<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale } from 'svelte/transition';
  import { soundManager } from '$lib/utils/sound.js';
  
  export let isVisible: boolean = false;
  export let isWinner: boolean = false;
  export let playerRole: 'player1' | 'player2' | null = null;
  export let winnerColor: 'red' | 'black' | null = null;
  export let gameSession: any = null;
  
  const dispatch = createEventDispatcher();
  
  // Minimalistic text only
  $: resultTitle = winnerColor === null
    ? 'Draw'
    : isWinner
      ? 'You Won'
      : 'Game Over';
  $: resultDetail = winnerColor === null
    ? 'No legal moves for both players.'
    : isWinner
      ? `${playerRole === 'player1' ? 'Red' : 'Black'} wins`
      : `${winnerColor === 'red' ? 'Red' : 'Black'} wins`;
      
  $: hasStakes = gameSession?.stake_tokens && gameSession.stake_tokens > 0;
  $: payout = hasStakes ? Math.floor(gameSession.stake_tokens * 2 * (1 - (gameSession.rake_bps || 1000) / 10000)) : 0;
  
  function handleBackToDashboard() {
    dispatch('backToDashboard');
  }
  
  // Play sound when modal becomes visible
  $: if (isVisible) {
    if (isWinner) {
      soundManager.playGameEnd();
    } else {
      // Play a gentler sound for losers
      setTimeout(() => soundManager.playTurnNotification(), 500);
    }
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center" transition:scale={{ duration: 150, start: 0.98 }}>
      <!-- Result Icon -->
      <div class="text-6xl mb-4">
        {#if winnerColor === null}
          🤝
        {:else if isWinner}
          🏆
        {:else}
          😔
        {/if}
      </div>
      
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{resultTitle}</h2>
      <p class="text-sm text-gray-600 mb-4">{resultDetail}</p>
      
      <!-- Stakes Information -->
      {#if hasStakes}
        <div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 mb-6 border border-yellow-200">
          {#if winnerColor === null}
            <!-- Draw - stakes refunded -->
            <div class="flex items-center justify-center space-x-2 text-blue-600">
              <span>↩️</span>
              <span class="font-semibold">Stakes Refunded</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              {gameSession.stake_tokens.toLocaleString()} tokens returned to each player
            </p>
          {:else if isWinner}
            <!-- Winner gets payout -->
            <div class="flex items-center justify-center space-x-2 text-green-600">
              <span>💰</span>
              <span class="font-semibold">You Won {payout.toLocaleString()} Tokens!</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              From {(gameSession.stake_tokens * 2).toLocaleString()} total stakes (10% house fee)
            </p>
          {:else}
            <!-- Loser loses stake -->
            <div class="flex items-center justify-center space-x-2 text-red-600">
              <span>💸</span>
              <span class="font-semibold">You Lost {gameSession.stake_tokens.toLocaleString()} Tokens</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              Winner received {payout.toLocaleString()} tokens
            </p>
          {/if}
        </div>
      {/if}
      
      <div class="flex justify-center">
        <button
          on:click={handleBackToDashboard}
          class="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>
{/if}

<style></style>
