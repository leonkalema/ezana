import { db } from '../database/connection.js';
import { AuthUtils } from '../utils/auth.js';
export class UserModel {
    static async create(userData) {
        const { username, email, password } = userData;
        const passwordHash = await AuthUtils.hashPassword(password);
        const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
        const result = await db.query(query, [username, email, passwordHash]);
        const insertId = result.insertId;
        const user = await this.findById(insertId);
        if (!user) {
            throw new Error('Failed to create user');
        }
        return user;
    }
    static async findById(id) {
        const query = `
      SELECT id, username, email, created_at, updated_at, is_online, last_seen
      FROM users
      WHERE id = ?
    `;
        return await db.queryOne(query, [id]);
    }
    static async findByUsername(username) {
        const query = `
      SELECT id, username, email, password_hash, created_at, updated_at, is_online, last_seen
      FROM users
      WHERE username = ?
    `;
        return await db.queryOne(query, [username]);
    }
    static async findByEmail(email) {
        const query = `
      SELECT id, username, email, password_hash, created_at, updated_at, is_online, last_seen
      FROM users
      WHERE email = ?
    `;
        return await db.queryOne(query, [email]);
    }
    static async updateOnlineStatus(id, isOnline) {
        const query = `
      UPDATE users
      SET is_online = ?, last_seen = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
        await db.query(query, [isOnline, id]);
    }
    static async checkUsernameExists(username) {
        const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE username = ?
    `;
        const result = await db.queryOne(query, [username]);
        return (result?.count || 0) > 0;
    }
    static async checkEmailExists(email) {
        const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE email = ?
    `;
        const result = await db.queryOne(query, [email]);
        return (result?.count || 0) > 0;
    }
    static async getOnlineUsers() {
        const query = `
      SELECT id, username, email, created_at, updated_at, is_online, last_seen
      FROM users
      WHERE is_online = true
      ORDER BY last_seen DESC
    `;
        return await db.query(query);
    }
}
//# sourceMappingURL=user-model.js.map