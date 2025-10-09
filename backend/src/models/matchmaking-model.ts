import { db } from '../database/connection.js';
import { MatchmakingQueue } from '../types/index.js';

export class MatchmakingModel {
  static async addToQueue(userId: number, stakeTokens: number = 0): Promise<void> {
    const query = `
      INSERT INTO matchmaking_queue (user_id, stake_tokens)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP, stake_tokens = VALUES(stake_tokens)
    `;

    await db.query(query, [userId, stakeTokens]);
  }

  static async removeFromQueue(userId: number): Promise<void> {
    const query = `
      DELETE FROM matchmaking_queue
      WHERE user_id = ?
    `;

    await db.query(query, [userId]);
  }

  static async findInQueue(userId: number): Promise<MatchmakingQueue | null> {
    const query = `
      SELECT id, user_id, stake_tokens, created_at
      FROM matchmaking_queue
      WHERE user_id = ?
    `;

    return await db.queryOne<MatchmakingQueue>(query, [userId]);
  }

  static async getQueuedPlayers(excludeUserId?: number): Promise<MatchmakingQueue[]> {
    let query = `
      SELECT id, user_id, created_at
      FROM matchmaking_queue
    `;

    const params: any[] = [];

    if (excludeUserId) {
      query += ' WHERE user_id != ?';
      params.push(excludeUserId);
    }

    query += ' ORDER BY created_at ASC';

    return await db.query<MatchmakingQueue>(query, params);
  }

  static async getOldestQueuedPlayer(excludeUserId?: number, stakeTokens?: number): Promise<MatchmakingQueue | null> {
    let query = `
      SELECT id, user_id, stake_tokens, created_at
      FROM matchmaking_queue
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (excludeUserId) {
      conditions.push('user_id != ?');
      params.push(excludeUserId);
    }

    if (stakeTokens !== undefined) {
      conditions.push('stake_tokens = ?');
      params.push(stakeTokens);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at ASC LIMIT 1';

    return await db.queryOne<MatchmakingQueue>(query, params);
  }

  static async getQueueSize(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM matchmaking_queue
    `;

    const result = await db.queryOne<{ count: number }>(query);
    return result?.count || 0;
  }

  static async clearOldEntries(olderThanMinutes: number = 30): Promise<void> {
    const query = `
      DELETE FROM matchmaking_queue
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;

    await db.query(query, [olderThanMinutes]);
  }
}
