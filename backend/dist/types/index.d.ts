import { Request } from 'express';
export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
    is_online: boolean;
    last_seen: Date;
}
export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface AuthResponse {
    user: Omit<User, 'password_hash'>;
    token: string;
}
export interface GameSession {
    id: number;
    game_code: string;
    player1_id: number;
    player2_id: number | null;
    game_state: CheckersGameState;
    current_turn: 'player1' | 'player2';
    status: 'waiting' | 'active' | 'completed' | 'abandoned';
    winner_id: number | null;
    stake_tokens?: number | null;
    rake_bps?: number | null;
    escrow_status?: 'none' | 'held' | 'released' | 'refunded' | null;
    created_at: Date;
    updated_at: Date;
    started_at: Date | null;
    ended_at: Date | null;
}
export interface GameMove {
    id: number;
    game_session_id: number;
    player_id: number;
    move_data: CheckersMove;
    move_number: number;
    created_at: Date;
}
export interface CheckersGameState {
    board: CheckersPiece[][];
    currentPlayer: 'red' | 'black';
    gameStatus: 'active' | 'completed' | 'draw';
    winner: 'red' | 'black' | null;
    moveHistory: CheckersMove[];
    capturedPieces: {
        red: number;
        black: number;
    };
}
export interface CheckersPiece {
    type: 'regular' | 'king' | null;
    color: 'red' | 'black' | null;
}
export interface CheckersMove {
    from: Position;
    to: Position;
    capturedPieces?: Position[];
    isKingMove?: boolean;
    path?: Position[];
    timestamp: Date;
}
export interface Position {
    row: number;
    col: number;
}
export interface CreateGameRequest {
    gameCode?: string;
}
export interface JoinGameRequest {
    gameCode: string;
}
export interface GameMoveRequest {
    gameCode: string;
    move: Omit<CheckersMove, 'timestamp'>;
}
export interface SocketUser {
    id: number;
    username: string;
    socketId: string;
}
export interface GameRoom {
    gameCode: string;
    players: SocketUser[];
    gameSession: GameSession;
}
export interface MatchmakingQueue {
    id: number;
    user_id: number;
    stake_tokens: number;
    created_at: Date;
}
export interface AuthenticatedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
    user?: Omit<User, 'password_hash'>;
}
export interface PlayerRole {
    role: 'player1' | 'player2' | null;
}
export interface GameMessage {
    id: string;
    gameCode: string;
    sender: {
        id: number;
        username: string;
    };
    message: string;
    timestamp: string;
}
export interface MatchmakingStatus {
    inQueue: boolean;
    queueSize: number;
}
//# sourceMappingURL=index.d.ts.map