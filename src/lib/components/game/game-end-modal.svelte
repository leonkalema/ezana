<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale } from 'svelte/transition';
  import { soundManager } from '$lib/utils/sound.js';
  
  export let isVisible: boolean = false;
  export let isWinner: boolean = false;
  export let playerRole: 'player1' | 'player2' | null = null;
  export let winnerColor: 'red' | 'black' | null = null;
  
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
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center" transition:scale={{ duration: 150, start: 0.98 }}>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">{resultTitle}</h2>
      <p class="text-sm text-gray-600 mb-6">{resultDetail}</p>
      <div class="flex justify-center">
        <button
          on:click={handleBackToDashboard}
          class="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>
{/if}

<style></style>
