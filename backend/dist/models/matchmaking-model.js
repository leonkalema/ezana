import { db } from '../database/connection.js';
export class MatchmakingModel {
    static async addToQueue(userId) {
        const query = `
      INSERT INTO matchmaking_queue (user_id)
      VALUES (?)
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;
        await db.query(query, [userId]);
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
      SELECT id, user_id, created_at
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
    static async getOldestQueuedPlayer(excludeUserId) {
        let query = `
      SELECT id, user_id, created_at
      FROM matchmaking_queue
    `;
        const params = [];
        if (excludeUserId) {
            query += ' WHERE user_id != ?';
            params.push(excludeUserId);
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