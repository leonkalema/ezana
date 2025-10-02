import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'binojo_db'
};
class DatabaseConnection {
    pool;
    constructor() {
        this.pool = mysql.createPool({
            ...config,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000
        });
    }
    async getConnection() {
        return await this.pool.getConnection();
    }
    async query(sql, params) {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return rows;
        }
        finally {
            connection.release();
        }
    }
    async queryOne(sql, params) {
        const results = await this.query(sql, params);
        return results[0] || null;
    }
    async testConnection() {
        try {
            await this.query('SELECT 1');
            return true;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    async close() {
        await this.pool.end();
    }
}
export const db = new DatabaseConnection();
export default db;
//# sourceMappingURL=connection.js.map