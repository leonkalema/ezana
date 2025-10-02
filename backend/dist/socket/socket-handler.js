import { Server as SocketIOServer } from 'socket.io';
import { AuthUtils } from '../utils/auth.js';
import { UserModel } from '../models/user-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
export class SocketHandler {
    io;
    connectedUsers = new Map();
    gameRooms = new Map();
    constructor(server) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const decoded = AuthUtils.verifyToken(token);
                const user = await UserModel.findById(decoded.id);
                if (!user) {
                    return next(new Error('User not found'));
                }
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
        socket.on('join_matchmaking', async () => {
            try {
                await MatchmakingModel.removeFromQueue(user.id);
                const opponent = await MatchmakingModel.getOldestQueuedPlayer(user.id);
                if (opponent) {
                    const gameSession = await GameSessionModel.create(opponent.user_id);
                    const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, user.id);
                    await MatchmakingModel.removeFromQueue(opponent.user_id);
                    const opponentSocket = Array.from(this.connectedUsers.entries())
                        .find(([_, socketUser]) => socketUser.id === opponent.user_id);
                    if (opponentSocket) {
                        const [opponentSocketId] = opponentSocket;
                        const opponentSocketInstance = this.io.sockets.sockets.get(opponentSocketId);
                        if (opponentSocketInstance) {
                            socket.emit('match_found', { gameSession: updatedGameSession });
                            opponentSocketInstance.emit('match_found', { gameSession: updatedGameSession });
                        }
                    }
                }
                else {
                    await MatchmakingModel.addToQueue(user.id);
                    socket.emit('matchmaking_joined', { message: 'Looking for opponent...' });
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
}
//# sourceMappingURL=socket-handler.js.map