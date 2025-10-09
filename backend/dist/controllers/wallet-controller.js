import { UserBalanceModel } from '../models/user-balance-model.js';
import { LedgerModel } from '../models/ledger-model.js';
import { withTransaction } from '../utils/tx.js';
export class WalletController {
    static async getBalance(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const balance = await UserBalanceModel.get(userId);
            res.json({ balance: balance.balance_tokens });
        }
        catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({ error: 'Failed to get balance' });
        }
    }
    static async getTransactions(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const limit = parseInt(req.query.limit) || 50;
            const transactions = await LedgerModel.listByUser(userId, Math.min(limit, 100));
            res.json({ transactions });
        }
        catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({ error: 'Failed to get transactions' });
        }
    }
    static async deposit(req, res) {
        try {
            const userId = req.user?.id;
            const { amount } = req.body;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            if (!Number.isFinite(amount) || amount <= 0) {
                res.status(400).json({ error: 'Invalid deposit amount' });
                return;
            }
            await withTransaction(async (conn) => {
                await UserBalanceModel.credit(userId, amount, conn);
                await LedgerModel.add(conn, {
                    userId,
                    kind: 'deposit',
                    direction: 'credit',
                    amount,
                    reference: 'test_deposit'
                });
            });
            const balance = await UserBalanceModel.get(userId);
            res.json({
                message: 'Deposit successful',
                balance: balance.balance_tokens
            });
        }
        catch (error) {
            console.error('Deposit error:', error);
            res.status(500).json({ error: 'Failed to process deposit' });
        }
    }
}
//# sourceMappingURL=wallet-controller.js.map