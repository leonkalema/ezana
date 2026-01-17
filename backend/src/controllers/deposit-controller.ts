import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { DepositService } from '../services/paypal/deposit-service.js';
import { getPayPalService, DEPOSIT_CONFIG } from '../services/paypal/paypal-service.js';

export class DepositController {
  static async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = DepositService.getConfig();
      
      let clientId: string | null = null;
      let mode: string = 'sandbox';
      
      try {
        const paypal = getPayPalService();
        clientId = paypal.getClientId();
        mode = paypal.getMode();
      } catch {
        console.warn('[Deposit] PayPal not configured');
      }

      res.json({
        ...config,
        clientId,
        mode
      });
    } catch (error) {
      console.error('Get deposit config error:', error);
      res.status(500).json({ error: 'Failed to get deposit config' });
    }
  }

  static async createOrder(
    req: AuthenticatedRequest<{}, {}, { amountUsd: number }>,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { amountUsd } = req.body;

      if (!amountUsd || typeof amountUsd !== 'number' || amountUsd <= 0) {
        res.status(400).json({ error: 'Invalid deposit amount' });
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const returnUrl = `${frontendUrl}/wallet/deposit/success`;
      const cancelUrl = `${frontendUrl}/wallet/deposit/cancel`;

      const result = await DepositService.createOrder(userId, amountUsd, returnUrl, cancelUrl);

      if (result.success) {
        res.json({
          orderId: result.orderId,
          approvalUrl: result.approvalUrl,
          tokens: Math.floor(amountUsd * DEPOSIT_CONFIG.tokensPerUsd)
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Create deposit order error:', error);
      res.status(500).json({ error: 'Failed to create deposit order' });
    }
  }

  static async captureOrder(
    req: AuthenticatedRequest<{ orderId: string }>,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const result = await DepositService.captureOrder(userId, orderId);

      if (result.success) {
        res.json({
          message: 'Payment successful',
          tokens: result.tokens
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Capture deposit order error:', error);
      res.status(500).json({ error: 'Failed to capture payment' });
    }
  }

  static async cancelOrder(
    req: AuthenticatedRequest<{ orderId: string }>,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.params;

      if (orderId) {
        await DepositService.cancelOrder(orderId);
      }

      res.json({ message: 'Order cancelled' });
    } catch (error) {
      console.error('Cancel deposit order error:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }
}
