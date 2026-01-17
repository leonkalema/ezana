import { db } from '../database/connection.js';

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount_tokens: number;
  amount_usd: number;
  paypal_email: string;
  status: WithdrawalStatus;
  paypal_batch_id: string | null;
  paypal_payout_item_id: string | null;
  failure_reason: string | null;
  created_at: Date;
  processed_at: Date | null;
  completed_at: Date | null;
}

export interface CreateWithdrawalParams {
  userId: number;
  amountTokens: number;
  amountUsd: number;
  paypalEmail: string;
}

export class WithdrawalModel {
  static async create(params: CreateWithdrawalParams, tx?: any): Promise<number> {
    const conn = tx || db;
    const result = await conn.query(
      `INSERT INTO withdrawal_requests (user_id, amount_tokens, amount_usd, paypal_email, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [params.userId, params.amountTokens, params.amountUsd, params.paypalEmail]
    );
    return (result as any).insertId;
  }

  static async findById(id: number): Promise<WithdrawalRequest | null> {
    return db.queryOne<WithdrawalRequest>(
      `SELECT * FROM withdrawal_requests WHERE id = ?`,
      [id]
    );
  }

  static async findByUser(userId: number, limit = 20): Promise<WithdrawalRequest[]> {
    return db.query<WithdrawalRequest>(
      `SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  static async findPending(): Promise<WithdrawalRequest[]> {
    return db.query<WithdrawalRequest>(
      `SELECT * FROM withdrawal_requests WHERE status = 'pending' ORDER BY created_at ASC`
    );
  }

  static async updateStatus(
    id: number,
    status: WithdrawalStatus,
    extra?: { paypalBatchId?: string; paypalPayoutItemId?: string; failureReason?: string },
    tx?: any
  ): Promise<void> {
    const conn = tx || db;
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status === 'processing') {
      updates.push('processed_at = NOW()');
    }
    if (status === 'completed') {
      updates.push('completed_at = NOW()');
    }
    if (extra?.paypalBatchId) {
      updates.push('paypal_batch_id = ?');
      values.push(extra.paypalBatchId);
    }
    if (extra?.paypalPayoutItemId) {
      updates.push('paypal_payout_item_id = ?');
      values.push(extra.paypalPayoutItemId);
    }
    if (extra?.failureReason) {
      updates.push('failure_reason = ?');
      values.push(extra.failureReason);
    }

    values.push(id);
    await conn.query(
      `UPDATE withdrawal_requests SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async hasPendingWithdrawal(userId: number): Promise<boolean> {
    const row = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM withdrawal_requests 
       WHERE user_id = ? AND status IN ('pending', 'processing')`,
      [userId]
    );
    return (row?.count ?? 0) > 0;
  }

  static async cancel(id: number, userId: number, tx?: any): Promise<boolean> {
    const conn = tx || db;
    const result = await conn.query(
      `UPDATE withdrawal_requests SET status = 'cancelled' 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [id, userId]
    );
    return (result as any).affectedRows > 0;
  }
}
