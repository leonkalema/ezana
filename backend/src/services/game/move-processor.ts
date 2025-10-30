/**
 * Move Processor
 * Processes game moves with timer integration
 */

import { GameSession, CheckersMove } from '../../types/index.js';
import { TimerHandler } from '../timer/timer-handler.js';
import { GameMoveModel } from '../../models/game-move-model.js';

export interface ProcessedMoveResult {
  success: boolean;
  autoMoveApplied: boolean;
  timeoutOccurred: boolean;
  strikes: number;
  gameOver: boolean;
  winnerId: number | null;
  error?: string;
}

export class MoveProcessor {
  /**
   * Process a move with timer update
   */
  static async processMove(
    game: GameSession,
    playerId: number,
    playerRole: 'player1' | 'player2',
    move: Omit<CheckersMove, 'timestamp'>,
    isAutoMove: boolean = false
  ): Promise<ProcessedMoveResult> {
    try {
      // Update timer for the player who just moved
      await TimerHandler.processMove(game, playerRole);

      // Save move to database
      const moveNumber = game.game_state.moveHistory.length + 1;
      const timeUsed = await this.calculateTimeUsed(game, playerRole);
      
      await GameMoveModel.create(
        game.id,
        playerId,
        { ...move, timestamp: new Date() },
        moveNumber,
        isAutoMove,
        timeUsed
      );

      return {
        success: true,
        autoMoveApplied: isAutoMove,
        timeoutOccurred: false,
        strikes: 0,
        gameOver: false,
        winnerId: null,
      };
    } catch (error) {
      console.error('Error processing move:', error);
      return {
        success: false,
        autoMoveApplied: false,
        timeoutOccurred: false,
        strikes: 0,
        gameOver: false,
        winnerId: null,
        error: 'Failed to process move',
      };
    }
  }

  /**
   * Calculate time used for this move
   */
  private static async calculateTimeUsed(
    game: GameSession,
    playerRole: 'player1' | 'player2'
  ): Promise<number> {
    if (!game.last_move_timestamp) {
      return 0;
    }

    const now = new Date();
    const lastMove = new Date(game.last_move_timestamp);
    const diffMs = now.getTime() - lastMove.getTime();
    return Math.ceil(diffMs / 1000);
  }

  /**
   * Check if current player has timed out
   */
  static async checkTimeout(
    game: GameSession,
    currentPlayer: 'player1' | 'player2'
  ) {
    return await TimerHandler.checkAndHandleTimeout(game, currentPlayer);
  }

  /**
   * Initialize timers when both players join
   */
  static async initializeTimers(gameCode: string): Promise<void> {
    await TimerHandler.initializeGameTimers(gameCode);
  }

  /**
   * Get timer data for client
   */
  static async getTimerData(gameCode: string) {
    return await TimerHandler.getTimerData(gameCode);
  }
}
