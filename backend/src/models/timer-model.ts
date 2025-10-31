/**
 * Timer Model
 * Database operations for game timer management
 */

import { db } from '../database/connection.js';
import { TimerService } from '../services/timer/timer-service.js';

export class TimerModel {
  /**
   * Update timer state after a move
   */
  static async updateTimerAfterMove(
    gameCode: string,
    player: 'player1' | 'player2',
    timeRemaining: number,
    strikes: number
  ): Promise<void> {
    const query = `
      UPDATE game_sessions
      SET 
        ${player}_time_remaining = ?,
        ${player}_strikes = ?,
        last_move_timestamp = CURRENT_TIMESTAMP
      WHERE game_code = ?
    `;

    await db.query(query, [timeRemaining, strikes, gameCode]);
  }

  /**
   * Initialize timers when game starts
   */
  static async initializeTimers(gameCode: string): Promise<void> {
    const initialState = TimerService.getInitialTimerState();
    
    const query = `
      UPDATE game_sessions
      SET 
        player1_time_remaining = ?,
        player2_time_remaining = ?,
        player1_strikes = ?,
        player2_strikes = ?,
        last_move_timestamp = CURRENT_TIMESTAMP
      WHERE game_code = ?
    `;

    await db.query(query, [
      initialState.player1_time_remaining,
      initialState.player2_time_remaining,
      initialState.player1_strikes,
      initialState.player2_strikes,
      gameCode,
    ]);
  }

  /**
   * Add strike to player
   */
  static async addStrike(
    gameCode: string,
    player: 'player1' | 'player2'
  ): Promise<void> {
    const query = `
      UPDATE game_sessions
      SET 
        ${player}_strikes = COALESCE(${player}_strikes, 0) + 1,
        ${player}_time_remaining = 60,
        last_move_timestamp = CURRENT_TIMESTAMP
      WHERE game_code = ?
    `;

    await db.query(query, [gameCode]);
  }

  /**
   * Get current timer state for a game
   */
  static async getTimerState(gameCode: string): Promise<{
    player1TimeRemaining: number;
    player2TimeRemaining: number;
    player1Strikes: number;
    player2Strikes: number;
    lastMoveTimestamp: Date | null;
  } | null> {
    const query = `
      SELECT 
        player1_time_remaining,
        player2_time_remaining,
        player1_strikes,
        player2_strikes,
        last_move_timestamp
      FROM game_sessions
      WHERE game_code = ?
    `;

    const result = await db.queryOne<any>(query, [gameCode]);
    if (!result) return null;

    return {
      player1TimeRemaining: result.player1_time_remaining ?? 60,
      player2TimeRemaining: result.player2_time_remaining ?? 60,
      player1Strikes: result.player1_strikes ?? 0,
      player2Strikes: result.player2_strikes ?? 0,
      lastMoveTimestamp: result.last_move_timestamp,
    };
  }

  /**
   * Update last move timestamp
   */
  static async updateLastMoveTimestamp(gameCode: string): Promise<void> {
    const query = `
      UPDATE game_sessions
      SET last_move_timestamp = CURRENT_TIMESTAMP
      WHERE game_code = ?
    `;

    await db.query(query, [gameCode]);
  }
}
