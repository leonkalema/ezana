import { CheckersGameState, CheckersMove, Position } from '../types/index.js';
export declare class CheckersEngine {
    static createInitialGameState(): CheckersGameState;
    private static createInitialBoard;
    static isValidMove(gameState: CheckersGameState, move: CheckersMove, playerId: number, isPlayer1: boolean): boolean;
    static applyMove(gameState: CheckersGameState, move: CheckersMove): CheckersGameState;
    private static checkGameEnd;
    private static hasValidMovesFromPosition;
    private static isValidPosition;
    static getValidMoves(gameState: CheckersGameState, position: Position): Position[];
}
//# sourceMappingURL=checkers-engine.d.ts.map