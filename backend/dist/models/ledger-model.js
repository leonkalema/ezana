import { db } from '../database/connection.js';
export class LedgerModel {
    static async add(tx, params) {
        await tx.query('INSERT INTO ledger_transactions (user_id, kind, direction, amount, reference) VALUES (?, ?, ?, ?, ?)', [params.userId, params.kind, params.direction, params.amount, params.reference ?? null]);
    }
    static async listByUser(userId, limit = 50) {
        const rows = await db.query('SELECT id, user_id, kind, direction, amount, reference, created_at FROM ledger_transactions WHERE user_id = ? ORDER BY id DESC LIMIT ' + limit, [userId]);
        return rows;
    }
}
//# sourceMappingURL=ledger-model.js.map