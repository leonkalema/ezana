import { db } from '../database/connection.js';
export class MatchmakingModel {
    static async addToQueue(userId, stakeTokens = 0) {
        const query = `
      INSERT INTO matchmaking_queue (user_id, stake_tokens)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP, stake_tokens = VALUES(stake_tokens)
    `;
        await db.query(query, [userId, stakeTokens]);
    }
    static async removeFromQueue(userId) {
        const query = `
      DELETE FROM matchmaking_queue
      WHERE user_id = ?
    `;
        await db.query(query, [userId]);
    }
    static async findInQueue(userId) {
        const query = `
      SELECT id, user_id, stake_tokens, created_at
      FROM matchmaking_queue
      WHERE user_id = ?
    `;
        return await db.queryOne(query, [userId]);
    }
    static async getQueuedPlayers(excludeUserId) {
        let query = `
      SELECT id, user_id, created_at
      FROM matchmaking_queue
    `;
        const params = [];
        if (excludeUserId) {
            query += ' WHERE user_id != ?';
            params.push(excludeUserId);
        }
        query += ' ORDER BY created_at ASC';
        return await db.query(query, params);
    }
    static async getOldestQueuedPlayer(excludeUserId, stakeTokens) {
        let query = `
      SELECT id, user_id, stake_tokens, created_at
      FROM matchmaking_queue
    `;
        const params = [];
        const conditions = [];
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
        return await db.queryOne(query, params);
    }
    static async getQueueSize() {
        const query = `
      SELECT COUNT(*) as count
      FROM matchmaking_queue
    `;
        const result = await db.queryOne(query);
        return result?.count || 0;
    }
    static async clearOldEntries(olderThanMinutes = 30) {
        const query = `
      DELETE FROM matchmaking_queue
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;
        await db.query(query, [olderThanMinutes]);
    }
}
//# sourceMappingURL=matchmaking-model.js.map