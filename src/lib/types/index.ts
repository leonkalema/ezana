export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  is_online: boolean;
  last_seen: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
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
  stake_tokens?: number;
  rake_bps?: number;
  escrow_status?: 'none' | 'held' | 'finalized';
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
  ended_at: Date | null;
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface SocketUser {
  id: number;
  username: string;
  socketId: string;
}

export interface GameMessage {
  message: string;
  sender: {
    id: number;
    username: string;
  };
  timestamp: string;
  gameCode: string;
}

export interface MatchmakingStatus {
  inQueue: boolean;
  queueEntry?: {
    id: number;
    user_id: number;
    created_at: Date;
  };
  queueSize: number;
}

export type PlayerRole = 'player1' | 'player2' | null;
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned';
export type PieceColor = 'red' | 'black';
export type PieceType = 'regular' | 'king';
