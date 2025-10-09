import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SocketUser, GameRoom } from '../types/index.js';
export declare class SocketHandler {
    private io;
    private connectedUsers;
    private gameRooms;
    private matchmakingTimeouts;
    constructor(server: HTTPServer);
    private setupMiddleware;
    private setupEventHandlers;
    private handleConnection;
    private joinUserToActiveGames;
    private setupSocketEventHandlers;
    private handleDisconnection;
    getIO(): SocketIOServer;
    getConnectedUsers(): Map<string, SocketUser>;
    getGameRooms(): Map<string, GameRoom>;
    private setMatchmakingTimeout;
    private clearMatchmakingTimeout;
    private handleMatchmakingTimeout;
    private clearAllMatchmakingTimeouts;
}
//# sourceMappingURL=socket-handler.d.ts.map