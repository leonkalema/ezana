import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { WithdrawalService } from '../services/paypal/withdrawal-service.js';
import { WITHDRAWAL_CONFIG } from '../services/paypal/paypal-service.js';

export class WithdrawalController {
  static async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = WithdrawalService.getConfig();
      res.json(config);
    } catch (error) {
      console.error('Get withdrawal config error:', error);
      res.status(500).json({ error: 'Failed to get withdrawal config' });
    }
  }

  static async requestWithdrawal(
    req: AuthenticatedRequest<{}, {}, { amountTokens: number; paypalEmail: string }>,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { amountTokens, paypalEmail } = req.body;

      if (!amountTokens || typeof amountTokens !== 'number' || amountTokens <= 0) {
        res.status(400).json({ error: 'Invalid withdrawal amount' });
        return;
      }

      if (!paypalEmail || typeof paypalEmail !== 'string') {
        res.status(400).json({ error: 'PayPal email is required' });
        return;
      }

      const result = await WithdrawalService.requestWithdrawal(userId, amountTokens, paypalEmail);

      if (result.success) {
        res.json({
          message: 'Withdrawal request submitted',
          withdrawalId: result.withdrawalId,
          amountTokens,
          amountUsd: amountTokens / WITHDRAWAL_CONFIG.tokensPerUsd
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Request withdrawal error:', error);
      res.status(500).json({ error: 'Failed to process withdrawal request' });
    }
  }

  static async cancelWithdrawal(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const withdrawalId = parseInt(req.params.id, 10);
      if (isNaN(withdrawalId)) {
        res.status(400).json({ error: 'Invalid withdrawal ID' });
        return;
      }

      const result = await WithdrawalService.cancelWithdrawal(userId, withdrawalId);

      if (result.success) {
        res.json({ message: 'Withdrawal cancelled successfully' });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Cancel withdrawal error:', error);
      res.status(500).json({ error: 'Failed to cancel withdrawal' });
    }
  }

  static async getWithdrawals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const withdrawals = await WithdrawalService.getUserWithdrawals(userId, Math.min(limit, 50));

      res.json({ withdrawals });
    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({ error: 'Failed to get withdrawals' });
    }
  }

  static async processWithdrawals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await WithdrawalService.processPendingWithdrawals();
      res.json({ message: 'Withdrawals processed' });
    } catch (error) {
      console.error('Process withdrawals error:', error);
      res.status(500).json({ error: 'Failed to process withdrawals' });
    }
  }
}
