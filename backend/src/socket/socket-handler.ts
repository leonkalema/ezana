import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuthUtils } from '../utils/auth.js';
import { UserModel } from '../models/user-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { SocketUser, GameRoom } from '../types/index.js';

export class SocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private gameRooms: Map<string, GameRoom> = new Map();

  constructor(server: HTTPServer) {
    // Use the same CORS configuration as the HTTP server
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:51229', // Browser preview
      process.env.FRONTEND_URL
    ].filter(Boolean);

    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, etc.)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          // Allow any localhost or 127.0.0.1 origin in development
          if (process.env.NODE_ENV === 'development' && 
              (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
          }
          
          return callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        console.log('Socket authentication attempt from:', socket.handshake.address);
        const token = socket.handshake.auth.token;
        if (!token) {
          console.log('No token provided in socket handshake');
          return next(new Error('Authentication token required'));
        }

        console.log('Verifying token for socket connection...');
        const decoded = AuthUtils.verifyToken(token);
        const user = await UserModel.findById(decoded.id);
        
        if (!user) {
          console.log('User not found for token:', decoded.id);
          return next(new Error('User not found'));
        }

        console.log('Socket authenticated for user:', user.username);

        socket.data.user = {
          id: user.id,
          username: user.username,
          email: user.email
        };

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: Socket): Promise<void> {
    const user = socket.data.user;
    console.log(`User ${user.username} connected with socket ${socket.id}`);

    // Add user to connected users
    const socketUser: SocketUser = {
      id: user.id,
      username: user.username,
      socketId: socket.id
    };
    this.connectedUsers.set(socket.id, socketUser);

    // Update user online status
    await UserModel.updateOnlineStatus(user.id, true);

    // Join user to their active games
    await this.joinUserToActiveGames(socket, user.id);

    // Set up event handlers
    this.setupSocketEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private async joinUserToActiveGames(socket: Socket, userId: number): Promise<void> {
    try {
      const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
      
      for (const game of activeGames) {
        const roomName = `game:${game.game_code}`;
        socket.join(roomName);

        // Update or create game room
        let gameRoom = this.gameRooms.get(game.game_code);
        if (!gameRoom) {
          gameRoom = {
            gameCode: game.game_code,
            players: [],
            gameSession: game
          };
          this.gameRooms.set(game.game_code, gameRoom);
        }

        // Add player to room if not already present
        const existingPlayer = gameRoom.players.find(p => p.id === userId);
        if (!existingPlayer) {
          gameRoom.players.push(this.connectedUsers.get(socket.id)!);
        }

        // Notify other players in the room
        socket.to(roomName).emit('player_joined', {
          player: this.connectedUsers.get(socket.id),
          gameCode: game.game_code
        });
      }
    } catch (error) {
      console.error('Error joining user to active games:', error);
    }
  }

  private setupSocketEventHandlers(socket: Socket): void {
    const user = socket.data.user;

    // Join game room
    socket.on('join_game', async (data: { gameCode: string }) => {
      try {
        const { gameCode } = data;
        
        // Verify user is part of this game
        const isPlayerInGame = await GameSessionModel.isPlayerInGame(user.id, gameCode);
        if (!isPlayerInGame) {
          socket.emit('error', { message: 'You are not part of this game' });
          return;
        }

        const roomName = `game:${gameCode}`;
        socket.join(roomName);

        // Get game session
        const gameSession = await GameSessionModel.findByGameCode(gameCode);
        if (!gameSession) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Update game room
        let gameRoom = this.gameRooms.get(gameCode);
        if (!gameRoom) {
          gameRoom = {
            gameCode,
            players: [],
            gameSession
          };
          this.gameRooms.set(gameCode, gameRoom);
        }

        // Add player to room
        const socketUser = this.connectedUsers.get(socket.id);
        if (socketUser && !gameRoom.players.find(p => p.id === user.id)) {
          gameRoom.players.push(socketUser);
        }

        // Send game state to the joining player
        socket.emit('game_state', {
          gameSession,
          playerRole: await GameSessionModel.getPlayerRole(user.id, gameCode)
        });

        // Notify other players
        socket.to(roomName).emit('player_joined', {
          player: socketUser,
          gameCode
        });

      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Leave game room
    socket.on('leave_game', (data: { gameCode: string }) => {
      const { gameCode } = data;
      const roomName = `game:${gameCode}`;
      
      socket.leave(roomName);
      
      // Remove player from game room
      const gameRoom = this.gameRooms.get(gameCode);
      if (gameRoom) {
        gameRoom.players = gameRoom.players.filter(p => p.id !== user.id);
        
        // If no players left, remove the room
        if (gameRoom.players.length === 0) {
          this.gameRooms.delete(gameCode);
        }
      }

      // Notify other players
      socket.to(roomName).emit('player_left', {
        playerId: user.id,
        gameCode
      });
    });

    // Handle game moves
    socket.on('make_move', async (data: { gameCode: string; move: any }) => {
      try {
        const { gameCode, move } = data;
        const roomName = `game:${gameCode}`;

        // Verify user is part of this game
        const playerRole = await GameSessionModel.getPlayerRole(user.id, gameCode);
        if (!playerRole) {
          socket.emit('error', { message: 'You are not part of this game' });
          return;
        }

        // Get current game state
        const gameSession = await GameSessionModel.findByGameCode(gameCode);
        if (!gameSession) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Broadcast move to all players in the room
        this.io.to(roomName).emit('move_made', {
          move,
          playerId: user.id,
          playerRole,
          gameCode
        });

        // Update game room
        const gameRoom = this.gameRooms.get(gameCode);
        if (gameRoom) {
          gameRoom.gameSession = gameSession;
        }

      } catch (error) {
        console.error('Error handling move:', error);
        socket.emit('error', { message: 'Failed to process move' });
      }
    });

    // Handle game state updates
    socket.on('game_updated', async (data: { gameCode: string }) => {
      try {
        const { gameCode } = data;
        const roomName = `game:${gameCode}`;

        // Get updated game session
        const gameSession = await GameSessionModel.findByGameCode(gameCode);
        if (!gameSession) {
          return;
        }

        // Broadcast updated game state to all players
        this.io.to(roomName).emit('game_state_updated', {
          gameSession
        });

        // Update game room
        const gameRoom = this.gameRooms.get(gameCode);
        if (gameRoom) {
          gameRoom.gameSession = gameSession;
        }

      } catch (error) {
        console.error('Error updating game state:', error);
      }
    });

    // Handle chat messages
    socket.on('send_message', (data: { gameCode: string; message: string }) => {
      const { gameCode, message } = data;
      const roomName = `game:${gameCode}`;

      // Broadcast message to all players in the room
      this.io.to(roomName).emit('message_received', {
        message,
        sender: {
          id: user.id,
          username: user.username
        },
        timestamp: new Date().toISOString(),
        gameCode
      });
    });

    // Handle matchmaking events
    socket.on('join_matchmaking', async () => {
      try {
        // Remove from queue first (in case already in queue)
        await MatchmakingModel.removeFromQueue(user.id);
        
        // Try to find a match
        const opponent = await MatchmakingModel.getOldestQueuedPlayer(user.id);
        
        if (opponent) {
          // Create game and notify both players
          const gameSession = await GameSessionModel.create(opponent.user_id);
          const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, user.id);
          
          // Remove both from queue
          await MatchmakingModel.removeFromQueue(opponent.user_id);
          
          // Find opponent's socket
          const opponentSocket = Array.from(this.connectedUsers.entries())
            .find(([_, socketUser]) => socketUser.id === opponent.user_id);
          
          if (opponentSocket) {
            const [opponentSocketId] = opponentSocket;
            const opponentSocketInstance = this.io.sockets.sockets.get(opponentSocketId);
            
            if (opponentSocketInstance) {
              // Notify both players
              socket.emit('match_found', { gameSession: updatedGameSession });
              opponentSocketInstance.emit('match_found', { gameSession: updatedGameSession });
            }
          }
        } else {
          // Add to queue
          await MatchmakingModel.addToQueue(user.id);
          socket.emit('matchmaking_joined', { message: 'Looking for opponent...' });
        }
      } catch (error) {
        console.error('Error in matchmaking:', error);
        socket.emit('error', { message: 'Matchmaking failed' });
      }
    });

    socket.on('leave_matchmaking', async () => {
      try {
        await MatchmakingModel.removeFromQueue(user.id);
        socket.emit('matchmaking_left', { message: 'Left matchmaking queue' });
      } catch (error) {
        console.error('Error leaving matchmaking:', error);
      }
    });
  }

  private async handleDisconnection(socket: Socket): Promise<void> {
    const user = socket.data.user;
    console.log(`User ${user.username} disconnected`);

    // Remove from connected users
    this.connectedUsers.delete(socket.id);

    // Update user online status
    await UserModel.updateOnlineStatus(user.id, false);

    // Remove from matchmaking queue
    await MatchmakingModel.removeFromQueue(user.id);

    // Remove from game rooms and notify other players
    for (const [gameCode, gameRoom] of this.gameRooms.entries()) {
      const playerIndex = gameRoom.players.findIndex(p => p.id === user.id);
      if (playerIndex !== -1) {
        gameRoom.players.splice(playerIndex, 1);
        
        // Notify other players
        socket.to(`game:${gameCode}`).emit('player_disconnected', {
          playerId: user.id,
          username: user.username,
          gameCode
        });

        // Remove room if empty
        if (gameRoom.players.length === 0) {
          this.gameRooms.delete(gameCode);
        }
      }
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public getConnectedUsers(): Map<string, SocketUser> {
    return this.connectedUsers;
  }

  public getGameRooms(): Map<string, GameRoom> {
    return this.gameRooms;
  }
}
