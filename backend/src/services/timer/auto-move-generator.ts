/**
 * Auto-Move Generator
 * Generates random legal moves when player times out
 */

import { CheckersEngine } from '../../game/checkers-engine.js';
import { CheckersGameState, CheckersMove, Position } from '../../types/index.js';

export interface AutoMoveResult {
  from: Position;
  to: Position;
}

export class AutoMoveGenerator {
  /**
   * Get all legal moves for current player
   */
  private static getAllLegalMoves(gameState: CheckersGameState): AutoMoveResult[] {
    const { board, currentPlayer } = gameState;
    const legalMoves: AutoMoveResult[] = [];

    // Iterate through all board positions
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]?.[col];
        
        // Skip empty squares or opponent pieces
        if (!piece?.type || piece.color !== currentPlayer) {
          continue;
        }

        const from: Position = { row, col };
        const validDestinations = CheckersEngine.getValidMoves(gameState, from);

        // Create move objects for each valid destination
        for (const to of validDestinations) {
          legalMoves.push({ from, to });
        }
      }
    }

    return legalMoves;
  }

  /**
   * Generate a random legal move for current player
   * Returns null if no legal moves available (game over)
   */
  static generateMove(gameState: CheckersGameState): AutoMoveResult | null {
    const legalMoves = this.getAllLegalMoves(gameState);

    if (legalMoves.length === 0) {
      return null; // No legal moves - game is over
    }

    // Pick random move from all legal moves
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    const selectedMove = legalMoves[randomIndex]!; // Safe: we checked length > 0

    return {
      from: selectedMove.from,
      to: selectedMove.to,
    };
  }

  /**
   * Check if any legal moves exist
   */
  static hasLegalMoves(gameState: CheckersGameState): boolean {
    return this.getAllLegalMoves(gameState).length > 0;
  }
}
