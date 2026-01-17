import { writable, derived } from 'svelte/store';
import { authStore } from './auth.js';
import { API_BASE_URL } from '$lib/config';

export interface Transaction {
  id: number;
  user_id: number;
  kind: 'deposit' | 'withdrawal' | 'stake_hold' | 'stake_payout' | 'stake_refund';
  direction: 'credit' | 'debit';
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount_tokens: number;
  amount_usd: number;
  paypal_email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  failure_reason: string | null;
  created_at: string;
  processed_at: string | null;
  completed_at: string | null;
}

export interface WithdrawalConfig {
  minTokens: number;
  tokensPerUsd: number;
  maxPendingWithdrawals: number;
}

export interface DepositConfig {
  minUsd: number;
  maxUsd: number;
  tokensPerUsd: number;
  clientId: string | null;
  mode: 'sandbox' | 'live';
}

export interface WalletState {
  balance: number;
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  withdrawalConfig: WithdrawalConfig | null;
  depositConfig: DepositConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  withdrawals: [],
  withdrawalConfig: null,
  depositConfig: null,
  loading: false,
  error: null
};

export const walletStore = writable<WalletState>(initialState);

class WalletService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authStore.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const status = response.status;
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const message = error.error || (status === 401 ? 'Wallet request unauthorized' : 'Request failed');
      throw new Error(message);
    }

    return response.json();
  }

  async fetchBalance(): Promise<number> {
    walletStore.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const data = await this.makeRequest('/wallet/balance');
      const balance = data.balance || 0;
      
      walletStore.update(state => ({ 
        ...state, 
        balance, 
        loading: false 
      }));
      
      return balance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      walletStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }

  async fetchTransactions(limit = 20): Promise<Transaction[]> {
    try {
      const data = await this.makeRequest(`/wallet/transactions?limit=${limit}`);
      const transactions = data.transactions || [];
      
      walletStore.update(state => ({ 
        ...state, 
        transactions 
      }));
      
      return transactions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      walletStore.update(state => ({ 
        ...state, 
        error: errorMessage 
      }));
      throw error;
    }
  }

  async deposit(amount: number): Promise<number> {
    walletStore.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const data = await this.makeRequest('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      
      const newBalance = data.balance || 0;
      
      walletStore.update(state => ({ 
        ...state, 
        balance: newBalance, 
        loading: false 
      }));
      
      // Refresh transactions to show the deposit
      this.fetchTransactions();
      
      return newBalance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deposit';
      walletStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }

  async setGameStake(gameCode: string, stakeTokens: number, rakeBps = 1000): Promise<void> {
    try {
      await this.makeRequest(`/games/${gameCode}/stake`, {
        method: 'POST',
        body: JSON.stringify({ stakeTokens, rakeBps })
      });
      
      // Refresh balance and transactions after setting stake
      await this.fetchBalance();
      await this.fetchTransactions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set stake';
      walletStore.update(state => ({ 
        ...state, 
        error: errorMessage 
      }));
      throw error;
    }
  }

  async fetchWithdrawalConfig(): Promise<WithdrawalConfig | null> {
    try {
      const data = await this.makeRequest('/withdrawals/config');
      walletStore.update(state => ({ ...state, withdrawalConfig: data }));
      return data;
    } catch (error) {
      console.error('Failed to fetch withdrawal config:', error);
      return null;
    }
  }

  async fetchDepositConfig(): Promise<DepositConfig | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/deposits/config`);
      if (!response.ok) throw new Error('Failed to fetch deposit config');
      const data = await response.json();
      walletStore.update(state => ({ ...state, depositConfig: data }));
      return data;
    } catch (error) {
      console.error('Failed to fetch deposit config:', error);
      return null;
    }
  }

  async createDepositOrder(amountUsd: number): Promise<{ success: boolean; approvalUrl?: string; error?: string }> {
    walletStore.update(state => ({ ...state, loading: true, error: null }));

    try {
      const data = await this.makeRequest('/deposits/create-order', {
        method: 'POST',
        body: JSON.stringify({ amountUsd })
      });

      walletStore.update(state => ({ ...state, loading: false }));

      if (data.approvalUrl) {
        return { success: true, approvalUrl: data.approvalUrl };
      }
      return { success: false, error: 'No approval URL returned' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create deposit order';
      walletStore.update(state => ({ ...state, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  async captureDeposit(orderId: string): Promise<{ success: boolean; tokens?: number; error?: string }> {
    walletStore.update(state => ({ ...state, loading: true, error: null }));

    try {
      const data = await this.makeRequest(`/deposits/${orderId}/capture`, { method: 'POST' });

      walletStore.update(state => ({ ...state, loading: false }));
      await this.fetchBalance();
      await this.fetchTransactions();

      return { success: true, tokens: data.tokens };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture deposit';
      walletStore.update(state => ({ ...state, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  async fetchWithdrawals(limit = 20): Promise<WithdrawalRequest[]> {
    try {
      const data = await this.makeRequest(`/withdrawals/history?limit=${limit}`);
      const withdrawals = data.withdrawals || [];
      walletStore.update(state => ({ ...state, withdrawals }));
      return withdrawals;
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      return [];
    }
  }

  async requestWithdrawal(amountTokens: number, paypalEmail: string): Promise<{ success: boolean; error?: string }> {
    walletStore.update(state => ({ ...state, loading: true, error: null }));

    try {
      const data = await this.makeRequest('/withdrawals/request', {
        method: 'POST',
        body: JSON.stringify({ amountTokens, paypalEmail })
      });

      walletStore.update(state => ({ ...state, loading: false }));
      await this.fetchBalance();
      await this.fetchWithdrawals();
      await this.fetchTransactions();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request withdrawal';
      walletStore.update(state => ({ ...state, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  async cancelWithdrawal(withdrawalId: number): Promise<{ success: boolean; error?: string }> {
    walletStore.update(state => ({ ...state, loading: true, error: null }));

    try {
      await this.makeRequest(`/withdrawals/${withdrawalId}/cancel`, { method: 'POST' });

      walletStore.update(state => ({ ...state, loading: false }));
      await this.fetchBalance();
      await this.fetchWithdrawals();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel withdrawal';
      walletStore.update(state => ({ ...state, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  clearError() {
    walletStore.update(state => ({ ...state, error: null }));
  }

  reset() {
    walletStore.set(initialState);
  }
}

export const walletService = new WalletService();

// Derived store for formatted balance
export const formattedBalance = derived(
  walletStore,
  ($wallet) => $wallet.balance.toLocaleString()
);

// Derived store for recent transactions
export const recentTransactions = derived(
  walletStore,
  ($wallet) => $wallet.transactions.slice(0, 5)
);

// Auto-fetch balance when user logs in
authStore.subscribe((auth) => {
  if (auth.isAuthenticated && auth.user) {
    walletService.fetchBalance().catch(console.error);
    walletService.fetchTransactions().catch(console.error);
  } else {
    walletService.reset();
  }
});
