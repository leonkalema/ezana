import { db } from '../database/connection.js';
export class UserBalanceModel {
    static async get(userId) {
        const row = await db.queryOne('SELECT user_id, balance_tokens, updated_at FROM user_balances WHERE user_id = ?', [userId]);
        if (row)
            return row;
        await db.query('INSERT INTO user_balances (user_id, balance_tokens) VALUES (?, 0)', [userId]);
        return { user_id: userId, balance_tokens: 0, updated_at: new Date() };
    }
    static async credit(userId, amount, tx) {
        await tx.query('UPDATE user_balances SET balance_tokens = balance_tokens + ? WHERE user_id = ?', [amount, userId]);
    }
    static async debit(userId, amount, tx) {
        const ok = await tx.query('UPDATE user_balances SET balance_tokens = balance_tokens - ? WHERE user_id = ? AND balance_tokens >= ? ', [amount, userId, amount]);
        if (ok.affectedRows === 0) {
            throw new Error('Insufficient balance');
        }
    }
}
//# sourceMappingURL=user-balance-model.js.map