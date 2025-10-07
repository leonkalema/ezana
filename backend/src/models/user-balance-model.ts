import { db } from '../database/connection.js';

export interface UserBalanceRow {
  user_id: number;
  balance_tokens: number;
  updated_at: Date;
}

export class UserBalanceModel {
  static async get(userId: number): Promise<UserBalanceRow> {
    const row = await db.queryOne<UserBalanceRow>(
      'SELECT user_id, balance_tokens, updated_at FROM user_balances WHERE user_id = ?',
      [userId]
    );
    if (row) return row;
    await db.query('INSERT INTO user_balances (user_id, balance_tokens) VALUES (?, 0)', [userId]);
    return { user_id: userId, balance_tokens: 0, updated_at: new Date() };
  }

  static async credit(userId: number, amount: number, tx: any): Promise<void> {
    await tx.query(
      'UPDATE user_balances SET balance_tokens = balance_tokens + ? WHERE user_id = ?',
      [amount, userId]
    );
  }

  static async debit(userId: number, amount: number, tx: any): Promise<void> {
    const ok = await tx.query(
      'UPDATE user_balances SET balance_tokens = balance_tokens - ? WHERE user_id = ? AND balance_tokens >= ? ',
      [amount, userId, amount]
    );
    if ((ok as any).affectedRows === 0) {
      throw new Error('Insufficient balance');
    }
  }
}
