<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { walletService } from '$lib/stores/wallet.js';
  
  let status: 'loading' | 'success' | 'error' = 'loading';
  let tokens = 0;
  let errorMessage = '';
  
  onMount(async () => {
    const orderId = $page.url.searchParams.get('token');
    
    if (!orderId) {
      status = 'error';
      errorMessage = 'No order ID found';
      return;
    }
    
    const result = await walletService.captureDeposit(orderId);
    
    if (result.success) {
      status = 'success';
      tokens = result.tokens || 0;
    } else {
      status = 'error';
      errorMessage = result.error || 'Payment capture failed';
    }
  });
  
  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Deposit - Binojo</title>
</svelte:head>

<div class="min-h-screen bg-[#E9E8E3] flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
    {#if status === 'loading'}
      <div class="animate-pulse">
        <div class="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg class="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h1>
        <p class="text-gray-600">Please wait while we confirm your payment...</p>
      </div>
      
    {:else if status === 'success'}
      <div class="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
      <p class="text-gray-600 mb-4">Your tokens have been added to your wallet.</p>
      <div class="bg-green-50 rounded-lg p-4 mb-6">
        <div class="text-3xl font-bold text-green-600">+{tokens.toLocaleString()}</div>
        <div class="text-sm text-green-700">tokens added</div>
      </div>
      <button
        on:click={goToDashboard}
        class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Go to Dashboard
      </button>
      
    {:else}
      <div class="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
      <p class="text-gray-600 mb-4">{errorMessage}</p>
      <button
        on:click={goToDashboard}
        class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
      >
        Return to Dashboard
      </button>
    {/if}
  </div>
</div>
