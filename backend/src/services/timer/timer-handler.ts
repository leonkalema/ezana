/**
 * Timer Handler
 * Integrates timer logic with game moves and handles timeouts
 */

import { TimerService, TimerState, TimeoutResult } from './timer-service.js';
import { AutoMoveGenerator, AutoMoveResult } from './auto-move-generator.js';
import { TimerModel } from '../../models/timer-model.js';
import { GameSession, CheckersGameState } from '../../types/index.js';

export interface TimerHandlerResult {
  shouldContinue: boolean;
  autoMove: AutoMoveResult | null;
  timeoutOccurred: boolean;
  strikes: number;
  gameOver: boolean;
  winnerId: number | null;
}

export class TimerHandler {
  /**
   * Process move with timer update
   */
  static async processMove(
    game: GameSession,
    playerRole: 'player1' | 'player2'
  ): Promise<void> {
    const timerState: TimerState = {
      player1TimeRemaining: game.player1_time_remaining ?? 60,
      player2TimeRemaining: game.player2_time_remaining ?? 60,
      player1Strikes: game.player1_strikes ?? 0,
      player2Strikes: game.player2_strikes ?? 0,
      currentTurn: game.current_turn,
      lastMoveTimestamp: game.last_move_timestamp ?? null,
    };

    // Update timer for the player who just moved
    const updatedTimer = TimerService.updateTimerAfterMove(timerState, playerRole);

    // Save updated timer to database
    await TimerModel.updateTimerAfterMove(
      game.game_code,
      playerRole,
      playerRole === 'player1' 
        ? updatedTimer.player1TimeRemaining 
        : updatedTimer.player2TimeRemaining,
      playerRole === 'player1'
        ? updatedTimer.player1Strikes
        : updatedTimer.player2Strikes
    );
  }

  /**
   * Check for timeout and handle auto-move if needed
   */
  static async checkAndHandleTimeout(
    game: GameSession,
    currentPlayer: 'player1' | 'player2'
  ): Promise<TimerHandlerResult> {
    let player1TimeRemaining = game.player1_time_remaining ?? 60;
    let player2TimeRemaining = game.player2_time_remaining ?? 60;
    
    // Calculate elapsed time since last move for current player
    if (game.last_move_timestamp && game.status === 'active') {
      const elapsedSeconds = TimerService.calculateTimeUsed(game.last_move_timestamp);
      
      if (game.current_turn === 'player1') {
        player1TimeRemaining = Math.max(0, player1TimeRemaining - elapsedSeconds);
      } else {
        player2TimeRemaining = Math.max(0, player2TimeRemaining - elapsedSeconds);
      }
    }
    
    const timerState: TimerState = {
      player1TimeRemaining,
      player2TimeRemaining,
      player1Strikes: game.player1_strikes ?? 0,
      player2Strikes: game.player2_strikes ?? 0,
      currentTurn: game.current_turn,
      lastMoveTimestamp: game.last_move_timestamp ?? null,
    };

    const timeoutResult = TimerService.checkTimeout(timerState, currentPlayer);

    if (!timeoutResult.hasTimedOut) {
      return {
        shouldContinue: true,
        autoMove: null,
        timeoutOccurred: false,
        strikes: timeoutResult.strikesUsed,
        gameOver: false,
        winnerId: null,
      };
    }

    // Timeout occurred
    if (timeoutResult.shouldEndGame) {
      // 3 strikes - player loses
      const winnerId = currentPlayer === 'player1' ? game.player2_id : game.player1_id;
      
      return {
        shouldContinue: false,
        autoMove: null,
        timeoutOccurred: true,
        strikes: timeoutResult.strikesUsed,
        gameOver: true,
        winnerId,
      };
    }

    // Generate auto-move
    const autoMove = AutoMoveGenerator.generateMove(game.game_state);

    if (!autoMove) {
      // No legal moves - game over
      const winnerId = currentPlayer === 'player1' ? game.player2_id : game.player1_id;
      
      return {
        shouldContinue: false,
        autoMove: null,
        timeoutOccurred: true,
        strikes: timeoutResult.strikesUsed,
        gameOver: true,
        winnerId,
      };
    }

    // Add strike to player
    await TimerModel.addStrike(game.game_code, currentPlayer);

    return {
      shouldContinue: true,
      autoMove,
      timeoutOccurred: true,
      strikes: timeoutResult.strikesUsed,
      gameOver: false,
      winnerId: null,
    };
  }

  /**
   * Initialize timers when both players join
   */
  static async initializeGameTimers(gameCode: string): Promise<void> {
    await TimerModel.initializeTimers(gameCode);
  }

  /**
   * Get timer data for client
   */
  static async getTimerData(gameCode: string) {
    const timerState = await TimerModel.getTimerState(gameCode);
    
    if (!timerState) {
      return null;
    }

    return {
      player1: {
        timeRemaining: timerState.player1TimeRemaining,
        strikes: timerState.player1Strikes,
      },
      player2: {
        timeRemaining: timerState.player2TimeRemaining,
        strikes: timerState.player2Strikes,
      },
      lastMoveTimestamp: timerState.lastMoveTimestamp,
    };
  }
}
