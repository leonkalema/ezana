import { writable, derived } from 'svelte/store';
import { authStore } from './auth.js';
import { API_BASE_URL } from '$lib/config';

export interface Transaction {
  id: number;
  user_id: number;
  kind: 'deposit' | 'stake_hold' | 'stake_payout' | 'stake_refund';
  direction: 'credit' | 'debit';
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null
};

export const walletStore = writable<WalletState>(initialState);

class WalletService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authStore.getToken?.();
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
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
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
