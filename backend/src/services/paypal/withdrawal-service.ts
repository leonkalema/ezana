import { WithdrawalModel, WithdrawalRequest } from '../../models/withdrawal-model.js';
import { UserBalanceModel } from '../../models/user-balance-model.js';
import { LedgerModel } from '../../models/ledger-model.js';
import { withTransaction } from '../../utils/tx.js';
import { getPayPalService, WITHDRAWAL_CONFIG } from './paypal-service.js';

export interface WithdrawalResult {
  success: boolean;
  withdrawalId?: number;
  error?: string;
}

export interface CancelResult {
  success: boolean;
  error?: string;
}

export class WithdrawalService {
  static async requestWithdrawal(
    userId: number,
    amountTokens: number,
    paypalEmail: string
  ): Promise<WithdrawalResult> {
    if (amountTokens < WITHDRAWAL_CONFIG.minTokens) {
      return {
        success: false,
        error: `Minimum withdrawal is ${WITHDRAWAL_CONFIG.minTokens.toLocaleString()} tokens`
      };
    }

    if (!paypalEmail || !paypalEmail.includes('@')) {
      return { success: false, error: 'Invalid PayPal email address' };
    }

    const hasPending = await WithdrawalModel.hasPendingWithdrawal(userId);
    if (hasPending) {
      return { success: false, error: 'You already have a pending withdrawal request' };
    }

    const balance = await UserBalanceModel.get(userId);
    if (balance.balance_tokens < amountTokens) {
      return { success: false, error: 'Insufficient balance' };
    }

    const amountUsd = amountTokens / WITHDRAWAL_CONFIG.tokensPerUsd;

    try {
      let withdrawalId: number = 0;

      await withTransaction(async (conn) => {
        await UserBalanceModel.debit(userId, amountTokens, conn);

        await LedgerModel.add(conn, {
          userId,
          kind: 'withdrawal' as any,
          direction: 'debit',
          amount: amountTokens,
          reference: null
        });

        withdrawalId = await WithdrawalModel.create({
          userId,
          amountTokens,
          amountUsd,
          paypalEmail
        }, conn);

        await conn.query(
          `UPDATE ledger_transactions SET reference = ? WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
          [`WD_${withdrawalId}`, userId]
        );
      });

      console.log(`[Withdrawal] Created request #${withdrawalId} for user ${userId}: ${amountTokens} tokens ($${amountUsd})`);

      return { success: true, withdrawalId };
    } catch (error) {
      console.error('[Withdrawal] Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create withdrawal request'
      };
    }
  }

  static async cancelWithdrawal(userId: number, withdrawalId: number): Promise<CancelResult> {
    const withdrawal = await WithdrawalModel.findById(withdrawalId);

    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    if (withdrawal.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (withdrawal.status !== 'pending') {
      return { success: false, error: 'Only pending withdrawals can be cancelled' };
    }

    try {
      await withTransaction(async (conn) => {
        const cancelled = await WithdrawalModel.cancel(withdrawalId, userId, conn);
        if (!cancelled) {
          throw new Error('Failed to cancel withdrawal');
        }

        await UserBalanceModel.credit(userId, withdrawal.amount_tokens, conn);

        await LedgerModel.add(conn, {
          userId,
          kind: 'deposit' as any,
          direction: 'credit',
          amount: withdrawal.amount_tokens,
          reference: `WD_${withdrawalId}_CANCELLED`
        });
      });

      console.log(`[Withdrawal] Cancelled request #${withdrawalId} for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('[Withdrawal] Cancel failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel withdrawal'
      };
    }
  }

  static async processWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
    console.log(`[Withdrawal] Processing #${withdrawal.id}`);

    await WithdrawalModel.updateStatus(withdrawal.id, 'processing');

    try {
      const paypal = getPayPalService();
      const result = await paypal.createPayout(withdrawal);

      if (result.success) {
        await WithdrawalModel.updateStatus(withdrawal.id, 'completed', {
          paypalBatchId: result.batchId,
          paypalPayoutItemId: result.payoutItemId
        });
        console.log(`[Withdrawal] Completed #${withdrawal.id}, batch: ${result.batchId}`);
      } else {
        await this.handleFailedWithdrawal(withdrawal, result.error || 'PayPal payout failed');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.handleFailedWithdrawal(withdrawal, errorMsg);
    }
  }

  private static async handleFailedWithdrawal(withdrawal: WithdrawalRequest, reason: string): Promise<void> {
    console.error(`[Withdrawal] Failed #${withdrawal.id}: ${reason}`);

    await withTransaction(async (conn) => {
      await WithdrawalModel.updateStatus(withdrawal.id, 'failed', { failureReason: reason }, conn);

      await UserBalanceModel.credit(withdrawal.user_id, withdrawal.amount_tokens, conn);

      await LedgerModel.add(conn, {
        userId: withdrawal.user_id,
        kind: 'deposit' as any,
        direction: 'credit',
        amount: withdrawal.amount_tokens,
        reference: `WD_${withdrawal.id}_REFUND`
      });
    });
  }

  static async processPendingWithdrawals(): Promise<void> {
    const pending = await WithdrawalModel.findPending();
    console.log(`[Withdrawal] Processing ${pending.length} pending withdrawals`);

    for (const withdrawal of pending) {
      await this.processWithdrawal(withdrawal);
    }
  }

  static async getUserWithdrawals(userId: number, limit = 20): Promise<WithdrawalRequest[]> {
    return WithdrawalModel.findByUser(userId, limit);
  }

  static getConfig() {
    return {
      minTokens: WITHDRAWAL_CONFIG.minTokens,
      tokensPerUsd: WITHDRAWAL_CONFIG.tokensPerUsd,
      maxPendingWithdrawals: WITHDRAWAL_CONFIG.maxPendingWithdrawals
    };
  }
}
