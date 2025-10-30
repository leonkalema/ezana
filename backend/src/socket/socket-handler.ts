import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuthUtils } from '../utils/auth.js';
import { UserModel } from '../models/user-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { EscrowService } from '../services/escrow/escrow-service.js';
import { TimerService } from '../services/timer/timer-service.js';
import { SocketUser, GameRoom } from '../types/index.js';

export class SocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private gameRooms: Map<string, GameRoom> = new Map();
  private matchmakingTimeouts: Map<string, NodeJS.Timeout> = new Map();

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

        // Calculate real-time timer values
        const timerData = TimerService.getTimerData(gameSession);
        const enrichedGameSession = {
          ...gameSession,
          player1_time_remaining: timerData.player1.timeRemaining,
          player2_time_remaining: timerData.player2.timeRemaining,
        };

        // Send game state to the joining player
        socket.emit('game_state', {
          gameSession: enrichedGameSession,
          playerRole: await GameSessionModel.getPlayerRole(user.id, gameCode)
        });

        // Clear matchmaking timeout since player successfully joined
        this.clearMatchmakingTimeout(gameCode);

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

        // Calculate real-time timer values
        const timerData = TimerService.getTimerData(gameSession);
        const enrichedGameSession = {
          ...gameSession,
          player1_time_remaining: timerData.player1.timeRemaining,
          player2_time_remaining: timerData.player2.timeRemaining,
        };

        // Broadcast updated game state to all players
        this.io.to(roomName).emit('game_state_updated', {
          gameSession: enrichedGameSession
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
    socket.on('join_matchmaking', async (data: { stakeTokens?: number } = {}) => {
      try {
        const stakeTokens = data.stakeTokens || 0;
        
        // Validate user has sufficient balance for stakes
        if (stakeTokens > 0) {
          const { UserBalanceModel } = await import('../models/user-balance-model.js');
          const userBalance = await UserBalanceModel.get(user.id);
          if (userBalance.balance_tokens < stakeTokens) {
            socket.emit('error', { 
              message: 'Insufficient balance',
              required: stakeTokens,
              available: userBalance.balance_tokens
            });
            return;
          }
        }
        
        // Remove from queue first (in case already in queue)
        await MatchmakingModel.removeFromQueue(user.id);
        
        // Try to find a match with same stake amount
        const opponent = await MatchmakingModel.getOldestQueuedPlayer(user.id, stakeTokens);
        
        if (opponent) {
          // Validate opponent still has sufficient balance before creating match
          if (stakeTokens > 0) {
            const { UserBalanceModel } = await import('../models/user-balance-model.js');
            const opponentBalance = await UserBalanceModel.get(opponent.user_id);
            
            if (opponentBalance.balance_tokens < stakeTokens) {
              // Opponent no longer has sufficient balance, remove from queue
              await MatchmakingModel.removeFromQueue(opponent.user_id);
              
              // Try to find another opponent
              const nextOpponent = await MatchmakingModel.getOldestQueuedPlayer(user.id, stakeTokens);
              if (!nextOpponent) {
                // No other opponent, add current user to queue
                await MatchmakingModel.addToQueue(user.id, stakeTokens);
                socket.emit('matchmaking_joined', { 
                  message: stakeTokens > 0 
                    ? `Looking for opponent with ${stakeTokens.toLocaleString()} token stakes...`
                    : 'Looking for opponent...'
                });
                return;
              }
              // Use the next opponent instead
              opponent.user_id = nextOpponent.user_id;
            }
          }
          
          // Create game and notify both players
          const gameSession = await GameSessionModel.create(opponent.user_id);
          const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, user.id);

          // Set stakes for the game if specified and hold escrow immediately
          if (stakeTokens > 0) {
            try {
              await GameSessionModel.setStakeConfig(gameSession.game_code, stakeTokens);
              await EscrowService.holdForGame(gameSession.game_code);
            } catch (escrowError) {
              // If escrow fails, abandon the game and notify user
              console.error('Escrow failed:', escrowError);
              await GameSessionModel.endGame(gameSession.game_code, null, 'abandoned');
              
              socket.emit('error', { 
                message: 'Failed to hold stakes. Game cancelled.',
                details: escrowError instanceof Error ? escrowError.message : 'Unknown error'
              });
              return;
            }
          }

          // Remove both from queue
          await MatchmakingModel.removeFromQueue(opponent.user_id);

          // Set timeout to verify both players join the game
          this.setMatchmakingTimeout(gameSession.game_code, opponent.user_id, user.id);

          // Find opponent's socket
          const opponentSocket = Array.from(this.connectedUsers.entries())
            .find(([_, socketUser]) => socketUser.id === opponent.user_id);

          if (opponentSocket) {
            const [opponentSocketId] = opponentSocket;
            const opponentSocketInstance = this.io.sockets.sockets.get(opponentSocketId);

            if (opponentSocketInstance) {
              // Get updated game session with stakes
              const finalGameSession = await GameSessionModel.findByGameCode(gameSession.game_code);
              
              // Notify both players
              socket.emit('match_found', { gameSession: finalGameSession });
              opponentSocketInstance.emit('match_found', { gameSession: finalGameSession });
            }
          }
        } else {
          // Add to queue with stake preference
          await MatchmakingModel.addToQueue(user.id, stakeTokens);
          socket.emit('matchmaking_joined', { 
            message: stakeTokens > 0 
              ? `Looking for opponent with ${stakeTokens.toLocaleString()} token stakes...`
              : 'Looking for opponent...'
          });
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

  private setMatchmakingTimeout(gameCode: string, player1Id: number, player2Id: number): void {
    // Clear any existing timeout for this game
    this.clearMatchmakingTimeout(gameCode);

    // Set a 30-second timeout
    const timeout = setTimeout(async () => {
      await this.handleMatchmakingTimeout(gameCode, player1Id, player2Id);
    }, 30000);

    this.matchmakingTimeouts.set(gameCode, timeout);
  }

  private clearMatchmakingTimeout(gameCode: string): void {
    const timeout = this.matchmakingTimeouts.get(gameCode);
    if (timeout) {
      clearTimeout(timeout);
      this.matchmakingTimeouts.delete(gameCode);
    }
  }

  private async handleMatchmakingTimeout(gameCode: string, player1Id: number, player2Id: number): Promise<void> {
    try {
      // Check if both players are in the game room
      const gameRoom = this.gameRooms.get(gameCode);
      if (!gameRoom) {
        // Game room doesn't exist, both players may have left
        return;
      }

      const player1InRoom = gameRoom.players.some(p => p.id === player1Id);
      const player2InRoom = gameRoom.players.some(p => p.id === player2Id);

      // If both players are in the room, the game is fine
      if (player1InRoom && player2InRoom) {
        return;
      }

      // If one or both players are not in the room, abandon the game
      // Use the model method directly (determine winner as the player who is still connected)
      const gameSession = await GameSessionModel.findByGameCode(gameCode);
      if (gameSession) {
        // If player1 is still connected but player2 is not, player1 wins
        // If player2 is still connected but player1 is not, player2 wins
        // If both are disconnected, no winner
        let winnerId = null;
        if (player1InRoom && !player2InRoom) {
          winnerId = player1Id;
        } else if (player2InRoom && !player1InRoom) {
          winnerId = player2Id;
        }
        await GameSessionModel.endGame(gameCode, winnerId, 'abandoned');
      }

      // Find the player who is still connected and return them to matchmaking
      const connectedPlayers = Array.from(this.connectedUsers.values())
        .filter(p => p.id === player1Id || p.id === player2Id);

      for (const player of connectedPlayers) {
        // Find their socket
        const socketEntry = Array.from(this.connectedUsers.entries())
          .find(([_, socketUser]) => socketUser.id === player.id);

        if (socketEntry) {
          const [socketId] = socketEntry;
          const socketInstance = this.io.sockets.sockets.get(socketId);

          if (socketInstance) {
            // Return to matchmaking
            await MatchmakingModel.addToQueue(player.id);
            socketInstance.emit('matchmaking_timeout', {
              message: 'Opponent didn\'t respond, returning to queue...'
            });
          }
        }
      }

      // Clean up
      this.gameRooms.delete(gameCode);
      this.clearMatchmakingTimeout(gameCode);

    } catch (error) {
      console.error('Error handling matchmaking timeout:', error);
    }
  }

  private clearAllMatchmakingTimeouts(): void {
    for (const timeout of this.matchmakingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.matchmakingTimeouts.clear();
  }
}
