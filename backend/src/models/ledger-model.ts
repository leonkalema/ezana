import { db } from '../database/connection.js';

export type LedgerKind = 'deposit' | 'withdrawal' | 'stake_hold' | 'stake_payout' | 'stake_refund';
export type LedgerDirection = 'credit' | 'debit';

export interface LedgerRow {
  id: number;
  user_id: number; // 10 = house account, others = player accounts
  kind: LedgerKind;
  direction: LedgerDirection;
  amount: number;
  reference: string | null;
  created_at: Date;
}

export class LedgerModel {
  static async add(
    tx: any,
    params: { userId: number; kind: LedgerKind; direction: LedgerDirection; amount: number; reference?: string | null }
  ): Promise<void> {
    await tx.query(
      'INSERT INTO ledger_transactions (user_id, kind, direction, amount, reference) VALUES (?, ?, ?, ?, ?)',
      [params.userId, params.kind, params.direction, params.amount, params.reference ?? null]
    );
  }

  static async listByUser(userId: number, limit = 50): Promise<LedgerRow[]> {
    const rows = await db.query<LedgerRow>(
      'SELECT id, user_id, kind, direction, amount, reference, created_at FROM ledger_transactions WHERE user_id = ? ORDER BY id DESC LIMIT ' + limit,
      [userId]
    );
    return rows;
  }
}
