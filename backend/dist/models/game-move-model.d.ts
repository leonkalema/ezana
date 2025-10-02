import { GameMove, CheckersMove } from '../types/index.js';
export declare class GameMoveModel {
    static create(gameSessionId: number, playerId: number, moveData: CheckersMove, moveNumber: number): Promise<GameMove>;
    static findById(id: number): Promise<GameMove | null>;
    static findByGameSession(gameSessionId: number): Promise<GameMove[]>;
    static getLastMoveNumber(gameSessionId: number): Promise<number>;
    static getMoveHistory(gameSessionId: number, limit?: number): Promise<GameMove[]>;
}
//# sourceMappingURL=game-move-model.d.ts.map