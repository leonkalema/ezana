import { GameSession, CheckersGameState } from '../types/index.js';
export declare class GameSessionModel {
    static create(player1Id: number, gameCode?: string): Promise<GameSession>;
    static findById(id: number): Promise<GameSession | null>;
    static findByGameCode(gameCode: string): Promise<GameSession | null>;
    static joinGame(gameCode: string, player2Id: number): Promise<GameSession | null>;
    static updateGameState(gameCode: string, gameState: CheckersGameState, currentTurn: 'player1' | 'player2'): Promise<void>;
    static endGame(gameCode: string, winnerId: number | null, status: 'completed' | 'abandoned'): Promise<void>;
    static findActiveGamesByPlayer(playerId: number): Promise<GameSession[]>;
    static findWaitingGames(): Promise<GameSession[]>;
    static checkGameCodeExists(gameCode: string): Promise<boolean>;
    static isPlayerInGame(playerId: number, gameCode: string): Promise<boolean>;
    static getPlayerRole(playerId: number, gameCode: string): Promise<'player1' | 'player2' | null>;
}
//# sourceMappingURL=game-session-model.d.ts.map