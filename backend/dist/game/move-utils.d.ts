import type { CheckersGameState, Position } from '../types/index.js';
export interface ApplyPathResult {
    state: CheckersGameState;
    captured: Position[];
}
export declare function applyMovePath(stateIn: CheckersGameState, path: Position[], moverIsPlayer1: boolean): ApplyPathResult | null;
//# sourceMappingURL=move-utils.d.ts.map