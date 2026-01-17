import { UserBalanceModel } from '../../models/user-balance-model.js';
import { LedgerModel } from '../../models/ledger-model.js';
import { withTransaction } from '../../utils/tx.js';
import { getPayPalService, DEPOSIT_CONFIG } from './paypal-service.js';
import { db } from '../../database/connection.js';

export interface DepositOrder {
  id: number;
  user_id: number;
  order_id: string;
  amount_usd: number;
  amount_tokens: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paypal_transaction_id: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface CreateDepositResult {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface CaptureDepositResult {
  success: boolean;
  tokens?: number;
  error?: string;
}

export class DepositService {
  static async createOrder(
    userId: number,
    amountUsd: number,
    returnUrl: string,
    cancelUrl: string
  ): Promise<CreateDepositResult> {
    if (amountUsd < DEPOSIT_CONFIG.minUsd) {
      return { success: false, error: `Minimum deposit is $${DEPOSIT_CONFIG.minUsd}` };
    }

    if (amountUsd > DEPOSIT_CONFIG.maxUsd) {
      return { success: false, error: `Maximum deposit is $${DEPOSIT_CONFIG.maxUsd}` };
    }

    try {
      const paypal = getPayPalService();
      const result = await paypal.createOrder(amountUsd, returnUrl, cancelUrl);

      if (!result.success || !result.orderId) {
        return { success: false, error: result.error || 'Failed to create PayPal order' };
      }

      const amountTokens = Math.floor(amountUsd * DEPOSIT_CONFIG.tokensPerUsd);

      await db.query(
        `INSERT INTO deposit_orders (user_id, order_id, amount_usd, amount_tokens, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [userId, result.orderId, amountUsd, amountTokens]
      );

      console.log(`[Deposit] Created order ${result.orderId} for user ${userId}: $${amountUsd} = ${amountTokens} tokens`);

      return {
        success: true,
        orderId: result.orderId,
        approvalUrl: result.approvalUrl
      };
    } catch (error) {
      console.error('[Deposit] Create order failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create deposit order'
      };
    }
  }

  static async captureOrder(userId: number, orderId: string): Promise<CaptureDepositResult> {
    const order = await db.queryOne<DepositOrder>(
      `SELECT * FROM deposit_orders WHERE order_id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status === 'completed') {
      return { success: true, tokens: order.amount_tokens };
    }

    if (order.status !== 'pending') {
      return { success: false, error: `Order status: ${order.status}` };
    }

    try {
      const paypal = getPayPalService();
      const result = await paypal.captureOrder(orderId);

      if (!result.success) {
        await db.query(
          `UPDATE deposit_orders SET status = 'failed' WHERE order_id = ?`,
          [orderId]
        );
        return { success: false, error: result.error || 'Payment capture failed' };
      }

      await withTransaction(async (conn) => {
        await conn.query(
          `UPDATE deposit_orders SET status = 'completed', paypal_transaction_id = ?, completed_at = NOW() WHERE order_id = ?`,
          [result.transactionId, orderId]
        );

        await UserBalanceModel.credit(userId, order.amount_tokens, conn);

        await LedgerModel.add(conn, {
          userId,
          kind: 'deposit',
          direction: 'credit',
          amount: order.amount_tokens,
          reference: `PAYPAL_${orderId}`
        });
      });

      console.log(`[Deposit] Captured order ${orderId}: ${order.amount_tokens} tokens credited to user ${userId}`);

      return { success: true, tokens: order.amount_tokens };
    } catch (error) {
      console.error('[Deposit] Capture failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture payment'
      };
    }
  }

  static async cancelOrder(orderId: string): Promise<void> {
    await db.query(
      `UPDATE deposit_orders SET status = 'cancelled' WHERE order_id = ? AND status = 'pending'`,
      [orderId]
    );
  }

  static async getUserOrders(userId: number, limit = 10): Promise<DepositOrder[]> {
    return db.query<DepositOrder>(
      `SELECT * FROM deposit_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  static getConfig() {
    return {
      minUsd: DEPOSIT_CONFIG.minUsd,
      maxUsd: DEPOSIT_CONFIG.maxUsd,
      tokensPerUsd: DEPOSIT_CONFIG.tokensPerUsd
    };
  }
}
