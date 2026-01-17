import { WithdrawalRequest } from '../../models/withdrawal-model.js';

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

export interface PayoutResult {
  success: boolean;
  batchId?: string;
  payoutItemId?: string;
  error?: string;
}

export interface PayoutStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'unclaimed';
  transactionId?: string;
  error?: string;
}

const PAYPAL_API_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com'
};

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface CaptureOrderResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  error?: string;
}

export class PayPalService {
  private config: PayPalConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PayPalConfig) {
    this.config = config;
  }

  getMode(): string {
    return this.config.mode;
  }

  getClientId(): string {
    return this.config.clientId;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const baseUrl = PAYPAL_API_BASE[this.config.mode];
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[PayPal] Token fetch failed:', error);
      throw new Error('Failed to authenticate with PayPal');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  async createPayout(withdrawal: WithdrawalRequest): Promise<PayoutResult> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = PAYPAL_API_BASE[this.config.mode];
      const senderBatchId = `BINOJO_${withdrawal.id}_${Date.now()}`;

      const payload = {
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: 'You have received a payout from Binojo',
          email_message: 'Your withdrawal request has been processed.'
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: withdrawal.amount_usd.toFixed(2),
              currency: 'USD'
            },
            receiver: withdrawal.paypal_email,
            note: `Binojo withdrawal #${withdrawal.id}`,
            sender_item_id: `WD_${withdrawal.id}`
          }
        ]
      };

      console.log('[PayPal] Creating payout:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${baseUrl}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[PayPal] Payout creation failed:', data);
        return {
          success: false,
          error: data.message || data.error_description || 'Payout creation failed'
        };
      }

      console.log('[PayPal] Payout created:', data);
      return {
        success: true,
        batchId: data.batch_header?.payout_batch_id,
        payoutItemId: data.items?.[0]?.payout_item_id
      };
    } catch (error) {
      console.error('[PayPal] Payout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createOrder(amountUsd: number, returnUrl: string, cancelUrl: string): Promise<CreateOrderResult> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = PAYPAL_API_BASE[this.config.mode];

      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amountUsd.toFixed(2)
            },
            description: 'Binojo Token Purchase'
          }
        ],
        application_context: {
          brand_name: 'Binojo',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl
        }
      };

      console.log('[PayPal] Creating order:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[PayPal] Order creation failed:', data);
        return {
          success: false,
          error: data.message || 'Order creation failed'
        };
      }

      const approvalLink = data.links?.find((link: any) => link.rel === 'approve');

      console.log('[PayPal] Order created:', data.id);
      return {
        success: true,
        orderId: data.id,
        approvalUrl: approvalLink?.href
      };
    } catch (error) {
      console.error('[PayPal] Order creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async captureOrder(orderId: string): Promise<CaptureOrderResult> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = PAYPAL_API_BASE[this.config.mode];

      const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[PayPal] Order capture failed:', data);
        return {
          success: false,
          error: data.message || 'Order capture failed'
        };
      }

      if (data.status !== 'COMPLETED') {
        return {
          success: false,
          error: `Order status: ${data.status}`
        };
      }

      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
      const amount = parseFloat(capture?.amount?.value || '0');

      console.log('[PayPal] Order captured:', data.id, 'Amount:', amount);
      return {
        success: true,
        transactionId: capture?.id,
        amount
      };
    } catch (error) {
      console.error('[PayPal] Order capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPayoutStatus(batchId: string): Promise<PayoutStatusResult> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = PAYPAL_API_BASE[this.config.mode];

      const response = await fetch(`${baseUrl}/v1/payments/payouts/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[PayPal] Status check failed:', error);
        return { status: 'pending', error: 'Failed to check status' };
      }

      const data = await response.json();
      const batchStatus = data.batch_header?.batch_status;
      const itemStatus = data.items?.[0]?.transaction_status;

      let status: PayoutStatusResult['status'] = 'pending';
      if (batchStatus === 'SUCCESS' || itemStatus === 'SUCCESS') {
        status = 'completed';
      } else if (batchStatus === 'DENIED' || itemStatus === 'FAILED' || itemStatus === 'BLOCKED') {
        status = 'failed';
      } else if (itemStatus === 'UNCLAIMED') {
        status = 'unclaimed';
      } else if (batchStatus === 'PROCESSING') {
        status = 'processing';
      }

      return {
        status,
        transactionId: data.items?.[0]?.transaction_id
      };
    } catch (error) {
      console.error('[PayPal] Status check error:', error);
      return {
        status: 'pending',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

let paypalServiceInstance: PayPalService | null = null;

export function getPayPalService(): PayPalService {
  if (!paypalServiceInstance) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox';

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
    }

    paypalServiceInstance = new PayPalService({ clientId, clientSecret, mode });
  }
  return paypalServiceInstance;
}

export const WITHDRAWAL_CONFIG = {
  minTokens: 10000,
  tokensPerUsd: 1000,
  maxPendingWithdrawals: 1
};

export const DEPOSIT_CONFIG = {
  minUsd: 1,
  maxUsd: 1000,
  tokensPerUsd: 1000
};
