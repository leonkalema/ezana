<script lang="ts">
  import { goto } from '$app/navigation';
  
  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Deposit Cancelled - Binojo</title>
</svelte:head>

<div class="min-h-screen bg-[#E9E8E3] flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
    <div class="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
      <svg class="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
    <p class="text-gray-600 mb-6">Your deposit was cancelled. No charges were made to your account.</p>
    <button
      on:click={goToDashboard}
      class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
    >
      Return to Dashboard
    </button>
  </div>
</div>
