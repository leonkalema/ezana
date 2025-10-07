<script lang="ts">
  import { walletStore, walletService, formattedBalance } from '$lib/stores/wallet.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    openWallet: void;
  }>();
  
  let showQuickDeposit = false;
  let depositAmount = 1000;
  
  async function quickDeposit() {
    try {
      await walletService.deposit(depositAmount);
      showQuickDeposit = false;
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  }
  
  function openWalletModal() {
    dispatch('openWallet');
  }
</script>

<div class="wallet-balance">
  <button 
    class="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
    on:click={openWalletModal}
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
      <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>
    </svg>
    <span>{$formattedBalance}</span>
    <span class="text-yellow-200 text-sm">tokens</span>
  </button>
  
  <!-- Quick deposit dropdown -->
  {#if showQuickDeposit}
    <div class="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-50 min-w-[200px]">
      <h4 class="font-semibold text-gray-800 mb-3">Quick Deposit</h4>
      <div class="space-y-3">
        <div class="flex space-x-2">
          <button 
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            on:click={() => depositAmount = 1000}
            class:bg-blue-100={depositAmount === 1000}
          >
            1,000
          </button>
          <button 
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            on:click={() => depositAmount = 5000}
            class:bg-blue-100={depositAmount === 5000}
          >
            5,000
          </button>
          <button 
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            on:click={() => depositAmount = 10000}
            class:bg-blue-100={depositAmount === 10000}
          >
            10,000
          </button>
        </div>
        <input 
          type="number" 
          bind:value={depositAmount} 
          min="100" 
          max="100000"
          class="w-full px-3 py-2 border rounded-lg text-sm"
          placeholder="Custom amount"
        />
        <div class="flex space-x-2">
          <button 
            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
            on:click={quickDeposit}
            disabled={$walletStore.loading}
          >
            {$walletStore.loading ? 'Adding...' : 'Add Tokens'}
          </button>
          <button 
            class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            on:click={() => showQuickDeposit = false}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .wallet-balance {
    position: relative;
  }
</style>
