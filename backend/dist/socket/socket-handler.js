import { Server as SocketIOServer } from 'socket.io';
import { AuthUtils } from '../utils/auth.js';
import { UserModel } from '../models/user-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { EscrowService } from '../services/escrow/escrow-service.js';
export class SocketHandler {
    io;
    connectedUsers = new Map();
    gameRooms = new Map();
    matchmakingTimeouts = new Map();
    constructor(server) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:51229',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        this.io = new SocketIOServer(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin)
                        return callback(null, true);
                    if (allowedOrigins.includes(origin)) {
                        return callback(null, true);
                    }
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
    setupMiddleware() {
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
            }
            catch (error) {
                next(new Error('Authentication failed'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    async handleConnection(socket) {
        const user = socket.data.user;
        console.log(`User ${user.username} connected with socket ${socket.id}`);
        const socketUser = {
            id: user.id,
            username: user.username,
            socketId: socket.id
        };
        this.connectedUsers.set(socket.id, socketUser);
        await UserModel.updateOnlineStatus(user.id, true);
        await this.joinUserToActiveGames(socket, user.id);
        this.setupSocketEventHandlers(socket);
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }
    async joinUserToActiveGames(socket, userId) {
        try {
            const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
            for (const game of activeGames) {
                const roomName = `game:${game.game_code}`;
                socket.join(roomName);
                let gameRoom = this.gameRooms.get(game.game_code);
                if (!gameRoom) {
                    gameRoom = {
                        gameCode: game.game_code,
                        players: [],
                        gameSession: game
                    };
                    this.gameRooms.set(game.game_code, gameRoom);
                }
                const existingPlayer = gameRoom.players.find(p => p.id === userId);
                if (!existingPlayer) {
                    gameRoom.players.push(this.connectedUsers.get(socket.id));
                }
                socket.to(roomName).emit('player_joined', {
                    player: this.connectedUsers.get(socket.id),
                    gameCode: game.game_code
                });
            }
        }
        catch (error) {
            console.error('Error joining user to active games:', error);
        }
    }
    setupSocketEventHandlers(socket) {
        const user = socket.data.user;
        socket.on('join_game', async (data) => {
            try {
                const { gameCode } = data;
                const isPlayerInGame = await GameSessionModel.isPlayerInGame(user.id, gameCode);
                if (!isPlayerInGame) {
                    socket.emit('error', { message: 'You are not part of this game' });
                    return;
                }
                const roomName = `game:${gameCode}`;
                socket.join(roomName);
                const gameSession = await GameSessionModel.findByGameCode(gameCode);
                if (!gameSession) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }
                let gameRoom = this.gameRooms.get(gameCode);
                if (!gameRoom) {
                    gameRoom = {
                        gameCode,
                        players: [],
                        gameSession
                    };
                    this.gameRooms.set(gameCode, gameRoom);
                }
                const socketUser = this.connectedUsers.get(socket.id);
                if (socketUser && !gameRoom.players.find(p => p.id === user.id)) {
                    gameRoom.players.push(socketUser);
                }
                socket.emit('game_state', {
                    gameSession,
                    playerRole: await GameSessionModel.getPlayerRole(user.id, gameCode)
                });
                this.clearMatchmakingTimeout(gameCode);
                socket.to(roomName).emit('player_joined', {
                    player: socketUser,
                    gameCode
                });
            }
            catch (error) {
                console.error('Error joining game:', error);
                socket.emit('error', { message: 'Failed to join game' });
            }
        });
        socket.on('leave_game', (data) => {
            const { gameCode } = data;
            const roomName = `game:${gameCode}`;
            socket.leave(roomName);
            const gameRoom = this.gameRooms.get(gameCode);
            if (gameRoom) {
                gameRoom.players = gameRoom.players.filter(p => p.id !== user.id);
                if (gameRoom.players.length === 0) {
                    this.gameRooms.delete(gameCode);
                }
            }
            socket.to(roomName).emit('player_left', {
                playerId: user.id,
                gameCode
            });
        });
        socket.on('make_move', async (data) => {
            try {
                const { gameCode, move } = data;
                const roomName = `game:${gameCode}`;
                const playerRole = await GameSessionModel.getPlayerRole(user.id, gameCode);
                if (!playerRole) {
                    socket.emit('error', { message: 'You are not part of this game' });
                    return;
                }
                const gameSession = await GameSessionModel.findByGameCode(gameCode);
                if (!gameSession) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }
                this.io.to(roomName).emit('move_made', {
                    move,
                    playerId: user.id,
                    playerRole,
                    gameCode
                });
                const gameRoom = this.gameRooms.get(gameCode);
                if (gameRoom) {
                    gameRoom.gameSession = gameSession;
                }
            }
            catch (error) {
                console.error('Error handling move:', error);
                socket.emit('error', { message: 'Failed to process move' });
            }
        });
        socket.on('game_updated', async (data) => {
            try {
                const { gameCode } = data;
                const roomName = `game:${gameCode}`;
                const gameSession = await GameSessionModel.findByGameCode(gameCode);
                if (!gameSession) {
                    return;
                }
                this.io.to(roomName).emit('game_state_updated', {
                    gameSession
                });
                const gameRoom = this.gameRooms.get(gameCode);
                if (gameRoom) {
                    gameRoom.gameSession = gameSession;
                }
            }
            catch (error) {
                console.error('Error updating game state:', error);
            }
        });
        socket.on('send_message', (data) => {
            const { gameCode, message } = data;
            const roomName = `game:${gameCode}`;
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
        socket.on('join_matchmaking', async (data = {}) => {
            try {
                const stakeTokens = data.stakeTokens || 0;
                await MatchmakingModel.removeFromQueue(user.id);
                const opponent = await MatchmakingModel.getOldestQueuedPlayer(user.id, stakeTokens);
                if (opponent) {
                    const gameSession = await GameSessionModel.create(opponent.user_id);
                    const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, user.id);
                    if (stakeTokens > 0) {
                        await GameSessionModel.setStakeConfig(gameSession.game_code, stakeTokens);
                        await EscrowService.holdForGame(gameSession.game_code);
                    }
                    await MatchmakingModel.removeFromQueue(opponent.user_id);
                    this.setMatchmakingTimeout(gameSession.game_code, opponent.user_id, user.id);
                    const opponentSocket = Array.from(this.connectedUsers.entries())
                        .find(([_, socketUser]) => socketUser.id === opponent.user_id);
                    if (opponentSocket) {
                        const [opponentSocketId] = opponentSocket;
                        const opponentSocketInstance = this.io.sockets.sockets.get(opponentSocketId);
                        if (opponentSocketInstance) {
                            const finalGameSession = await GameSessionModel.findByGameCode(gameSession.game_code);
                            socket.emit('match_found', { gameSession: finalGameSession });
                            opponentSocketInstance.emit('match_found', { gameSession: finalGameSession });
                        }
                    }
                }
                else {
                    await MatchmakingModel.addToQueue(user.id, stakeTokens);
                    socket.emit('matchmaking_joined', {
                        message: stakeTokens > 0
                            ? `Looking for opponent with ${stakeTokens.toLocaleString()} token stakes...`
                            : 'Looking for opponent...'
                    });
                }
            }
            catch (error) {
                console.error('Error in matchmaking:', error);
                socket.emit('error', { message: 'Matchmaking failed' });
            }
        });
        socket.on('leave_matchmaking', async () => {
            try {
                await MatchmakingModel.removeFromQueue(user.id);
                socket.emit('matchmaking_left', { message: 'Left matchmaking queue' });
            }
            catch (error) {
                console.error('Error leaving matchmaking:', error);
            }
        });
    }
    async handleDisconnection(socket) {
        const user = socket.data.user;
        console.log(`User ${user.username} disconnected`);
        this.connectedUsers.delete(socket.id);
        await UserModel.updateOnlineStatus(user.id, false);
        await MatchmakingModel.removeFromQueue(user.id);
        for (const [gameCode, gameRoom] of this.gameRooms.entries()) {
            const playerIndex = gameRoom.players.findIndex(p => p.id === user.id);
            if (playerIndex !== -1) {
                gameRoom.players.splice(playerIndex, 1);
                socket.to(`game:${gameCode}`).emit('player_disconnected', {
                    playerId: user.id,
                    username: user.username,
                    gameCode
                });
                if (gameRoom.players.length === 0) {
                    this.gameRooms.delete(gameCode);
                }
            }
        }
    }
    getIO() {
        return this.io;
    }
    getConnectedUsers() {
        return this.connectedUsers;
    }
    getGameRooms() {
        return this.gameRooms;
    }
    setMatchmakingTimeout(gameCode, player1Id, player2Id) {
        this.clearMatchmakingTimeout(gameCode);
        const timeout = setTimeout(async () => {
            await this.handleMatchmakingTimeout(gameCode, player1Id, player2Id);
        }, 30000);
        this.matchmakingTimeouts.set(gameCode, timeout);
    }
    clearMatchmakingTimeout(gameCode) {
        const timeout = this.matchmakingTimeouts.get(gameCode);
        if (timeout) {
            clearTimeout(timeout);
            this.matchmakingTimeouts.delete(gameCode);
        }
    }
    async handleMatchmakingTimeout(gameCode, player1Id, player2Id) {
        try {
            const gameRoom = this.gameRooms.get(gameCode);
            if (!gameRoom) {
                return;
            }
            const player1InRoom = gameRoom.players.some(p => p.id === player1Id);
            const player2InRoom = gameRoom.players.some(p => p.id === player2Id);
            if (player1InRoom && player2InRoom) {
                return;
            }
            const gameSession = await GameSessionModel.findByGameCode(gameCode);
            if (gameSession) {
                let winnerId = null;
                if (player1InRoom && !player2InRoom) {
                    winnerId = player1Id;
                }
                else if (player2InRoom && !player1InRoom) {
                    winnerId = player2Id;
                }
                await GameSessionModel.endGame(gameCode, winnerId, 'abandoned');
            }
            const connectedPlayers = Array.from(this.connectedUsers.values())
                .filter(p => p.id === player1Id || p.id === player2Id);
            for (const player of connectedPlayers) {
                const socketEntry = Array.from(this.connectedUsers.entries())
                    .find(([_, socketUser]) => socketUser.id === player.id);
                if (socketEntry) {
                    const [socketId] = socketEntry;
                    const socketInstance = this.io.sockets.sockets.get(socketId);
                    if (socketInstance) {
                        await MatchmakingModel.addToQueue(player.id);
                        socketInstance.emit('matchmaking_timeout', {
                            message: 'Opponent didn\'t respond, returning to queue...'
                        });
                    }
                }
            }
            this.gameRooms.delete(gameCode);
            this.clearMatchmakingTimeout(gameCode);
        }
        catch (error) {
            console.error('Error handling matchmaking timeout:', error);
        }
    }
    clearAllMatchmakingTimeouts() {
        for (const timeout of this.matchmakingTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.matchmakingTimeouts.clear();
    }
}
//# sourceMappingURL=socket-handler.js.map