/**
 * Timer Service
 * Handles chess clock logic for 60-second games
 */

import { GameSession } from '../../types/index.js';

export interface TimerState {
  player1TimeRemaining: number;
  player2TimeRemaining: number;
  player1Strikes: number;
  player2Strikes: number;
  currentTurn: 'player1' | 'player2';
  lastMoveTimestamp: Date | null;
}

export interface TimeoutResult {
  hasTimedOut: boolean;
  strikesUsed: number;
  shouldAutoMove: boolean;
  shouldEndGame: boolean;
}

const INITIAL_TIME_SECONDS = 60;
const MAX_STRIKES = 3;

export class TimerService {
  /**
   * Initialize timer for new game
   */
  static getInitialTimerState(): Partial<GameSession> {
    return {
      player1_time_remaining: INITIAL_TIME_SECONDS,
      player2_time_remaining: INITIAL_TIME_SECONDS,
      player1_strikes: 0,
      player2_strikes: 0,
      last_move_timestamp: null,
    };
  }

  /**
   * Calculate time used since last move
   */
  static calculateTimeUsed(lastMoveTimestamp: Date | null): number {
    if (!lastMoveTimestamp) return 0;
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastMoveTimestamp).getTime();
    return Math.ceil(diffMs / 1000);
  }

  /**
   * Update timer after a move
   */
  static updateTimerAfterMove(
    timerState: TimerState,
    playerMoved: 'player1' | 'player2'
  ): TimerState {
    const timeUsed = this.calculateTimeUsed(timerState.lastMoveTimestamp);
    
    const updatedState = { ...timerState };
    
    // Deduct time from player who just moved
    if (playerMoved === 'player1') {
      updatedState.player1TimeRemaining = Math.max(0, timerState.player1TimeRemaining - timeUsed);
    } else {
      updatedState.player2TimeRemaining = Math.max(0, timerState.player2TimeRemaining - timeUsed);
    }
    
    // Update timestamp for next player's turn
    updatedState.lastMoveTimestamp = new Date();
    
    return updatedState;
  }

  /**
   * Check if current player has timed out
   */
  static checkTimeout(
    timerState: TimerState,
    currentPlayer: 'player1' | 'player2'
  ): TimeoutResult {
    const timeRemaining = currentPlayer === 'player1' 
      ? timerState.player1TimeRemaining 
      : timerState.player2TimeRemaining;
      
    const currentStrikes = currentPlayer === 'player1'
      ? timerState.player1Strikes
      : timerState.player2Strikes;

    const hasTimedOut = timeRemaining <= 0;
    
    if (!hasTimedOut) {
      return {
        hasTimedOut: false,
        strikesUsed: currentStrikes,
        shouldAutoMove: false,
        shouldEndGame: false,
      };
    }

    const newStrikes = currentStrikes + 1;
    const shouldEndGame = newStrikes >= MAX_STRIKES;

    return {
      hasTimedOut: true,
      strikesUsed: newStrikes,
      shouldAutoMove: !shouldEndGame,
      shouldEndGame,
    };
  }

  /**
   * Add strike to player
   */
  static addStrike(
    timerState: TimerState,
    player: 'player1' | 'player2'
  ): TimerState {
    const updatedState = { ...timerState };
    
    if (player === 'player1') {
      updatedState.player1Strikes = Math.min(MAX_STRIKES, timerState.player1Strikes + 1);
      // Reset timer for auto-move
      updatedState.player1TimeRemaining = INITIAL_TIME_SECONDS;
    } else {
      updatedState.player2Strikes = Math.min(MAX_STRIKES, timerState.player2Strikes + 1);
      updatedState.player2TimeRemaining = INITIAL_TIME_SECONDS;
    }
    
    return updatedState;
  }

  /**
   * Get real-time timer data for client (accounts for elapsed time)
   */
  static getTimerData(game: GameSession) {
    let player1TimeRemaining = game.player1_time_remaining ?? INITIAL_TIME_SECONDS;
    let player2TimeRemaining = game.player2_time_remaining ?? INITIAL_TIME_SECONDS;
    
    // Calculate elapsed time since last move for current player
    if (game.last_move_timestamp && game.status === 'active') {
      const elapsedSeconds = this.calculateTimeUsed(game.last_move_timestamp);
      
      if (game.current_turn === 'player1') {
        player1TimeRemaining = Math.max(0, player1TimeRemaining - elapsedSeconds);
      } else {
        player2TimeRemaining = Math.max(0, player2TimeRemaining - elapsedSeconds);
      }
    }
    
    return {
      player1: {
        timeRemaining: player1TimeRemaining,
        strikes: game.player1_strikes ?? 0,
      },
      player2: {
        timeRemaining: player2TimeRemaining,
        strikes: game.player2_strikes ?? 0,
      },
      currentTurn: game.current_turn,
      lastMoveTimestamp: game.last_move_timestamp,
    };
  }

  /**
   * Check if player has lost by timeout (3 strikes)
   */
  static hasLostByTimeout(strikes: number): boolean {
    return strikes >= MAX_STRIKES;
  }
}
