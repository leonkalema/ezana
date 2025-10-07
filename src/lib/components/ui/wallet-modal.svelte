<script lang="ts">
  import { walletStore, walletService, type Transaction } from '$lib/stores/wallet.js';
  import { createEventDispatcher } from 'svelte';
  
  export let isVisible = false;
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  let depositAmount = 1000;
  let activeTab: 'balance' | 'transactions' = 'balance';
  
  $: if (isVisible && activeTab === 'transactions') {
    walletService.fetchTransactions(20);
  }
  
  async function deposit() {
    try {
      await walletService.deposit(depositAmount);
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  }
  
  function close() {
    isVisible = false;
    dispatch('close');
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getTransactionIcon(transaction: Transaction): string {
    switch (transaction.kind) {
      case 'deposit': return '💰';
      case 'stake_hold': return '🔒';
      case 'stake_payout': return '🏆';
      case 'stake_refund': return '↩️';
      default: return '💳';
    }
  }
  
  function getTransactionDescription(transaction: Transaction): string {
    switch (transaction.kind) {
      case 'deposit': return 'Deposit';
      case 'stake_hold': return 'Stake Hold';
      case 'stake_payout': return 'Game Winnings';
      case 'stake_refund': return 'Stake Refund';
      default: return transaction.kind;
    }
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-2xl font-bold text-gray-800">Wallet</h2>
        <button 
          on:click={close}
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>
      
      <!-- Tabs -->
      <div class="flex border-b">
        <button
          class="flex-1 px-6 py-3 font-medium {activeTab === 'balance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'balance'}
        >
          Balance & Deposit
        </button>
        <button
          class="flex-1 px-6 py-3 font-medium {activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'transactions'}
        >
          Transaction History
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        {#if activeTab === 'balance'}
          <!-- Balance Tab -->
          <div class="space-y-6">
            <!-- Current Balance -->
            <div class="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div class="text-sm text-gray-600 mb-2">Current Balance</div>
              <div class="text-4xl font-bold text-blue-600 mb-2">
                {$walletStore.balance.toLocaleString()}
              </div>
              <div class="text-sm text-gray-500">tokens</div>
            </div>
            
            <!-- Quick Deposit -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800">Add Tokens</h3>
              <div class="grid grid-cols-3 gap-3">
                <button 
                  class="p-3 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors {depositAmount === 1000 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                  on:click={() => depositAmount = 1000}
                >
                  <div class="font-semibold">1,000</div>
                  <div class="text-sm text-gray-500">tokens</div>
                </button>
                <button 
                  class="p-3 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors {depositAmount === 5000 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                  on:click={() => depositAmount = 5000}
                >
                  <div class="font-semibold">5,000</div>
                  <div class="text-sm text-gray-500">tokens</div>
                </button>
                <button 
                  class="p-3 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors {depositAmount === 10000 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                  on:click={() => depositAmount = 10000}
                >
                  <div class="font-semibold">10,000</div>
                  <div class="text-sm text-gray-500">tokens</div>
                </button>
              </div>
              
              <div class="flex space-x-3">
                <input 
                  type="number" 
                  bind:value={depositAmount} 
                  min="100" 
                  max="100000"
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Custom amount"
                />
                <button 
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  on:click={deposit}
                  disabled={$walletStore.loading || depositAmount < 100}
                >
                  {$walletStore.loading ? 'Adding...' : 'Add Tokens'}
                </button>
              </div>
              
              <p class="text-xs text-gray-500 text-center">
                * This is a demo. In production, this would integrate with real payment processing.
              </p>
            </div>
          </div>
          
        {:else if activeTab === 'transactions'}
          <!-- Transactions Tab -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            
            {#if $walletStore.transactions.length === 0}
              <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-4">📋</div>
                <p>No transactions yet</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each $walletStore.transactions as transaction}
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <span class="text-2xl">{getTransactionIcon(transaction)}</span>
                      <div>
                        <div class="font-medium text-gray-800">
                          {getTransactionDescription(transaction)}
                        </div>
                        <div class="text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                          {#if transaction.reference}
                            • {transaction.reference}
                          {/if}
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-semibold {transaction.direction === 'credit' ? 'text-green-600' : 'text-red-600'}">
                        {transaction.direction === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                      </div>
                      <div class="text-sm text-gray-500">tokens</div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        
        {#if $walletStore.error}
          <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {$walletStore.error}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
