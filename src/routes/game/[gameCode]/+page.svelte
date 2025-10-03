<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import CheckersBoard from '$lib/components/game/checkers-board.svelte';
  
  $: gameCode = $page.params.gameCode;
  $: ({ isAuthenticated } = $authStore);
  $: ({ currentGame, playerRole, isLoading } = $gameStore);
  
  onMount(async () => {
    if (!isAuthenticated) goto('/login');
    if (!gameCode) goto('/dashboard');
    if (gameCode) await gameStore.loadGame(gameCode);
  });
  
  onDestroy(() => {
    gameStore.leaveGame();
  });
  
  let showCopied = false;
  
  function copyCode() {
    navigator.clipboard.writeText(gameCode || '').then(() => {
      showCopied = true;
      setTimeout(() => showCopied = false, 2000);
    });
  }
  
  function isMyTurn() {
    if (!currentGame || currentGame.status !== 'active') return false;
    if (!playerRole) return false;
    const current = currentGame.game_state.currentPlayer;
    return (playerRole === 'player1' && current === 'red') ||
           (playerRole === 'player2' && current === 'black');
  }

  async function quitGame() {
    try {
      await gameStore.abandonGame();
      goto('/dashboard');
    } catch (e) {
      console.error('Failed to quit game', e);
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
    </div>
  {:else if currentGame}
    <!-- Top Bar -->
    <div class="bg-white shadow-sm p-4">
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-2">
        <button
          on:click={() => goto('/dashboard')}
          class="text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>
        
        <div class="font-mono font-bold text-lg">{gameCode}</div>
        
        <div class="flex items-center gap-2">
          <button
            on:click={copyCode}
            class="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 relative"
          >
            {showCopied ? 'Copied!' : 'Share'}
          </button>
          {#if currentGame && (currentGame.status === 'active' || currentGame.status === 'waiting')}
            <button
              on:click={quitGame}
              class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
            >
              Quit
            </button>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Turn Indicator -->
    <div class="bg-white border-b p-3 text-center">
      {#if currentGame.status === 'waiting'}
        <p class="text-amber-600 font-semibold">Waiting for opponent...</p>
        <p class="text-gray-500 text-sm">Share code <strong>{gameCode}</strong></p>
      {:else if currentGame.status === 'completed'}
        <p class="text-green-600 font-bold text-lg">🎉 Game Over!</p>
      {:else if isMyTurn()}
        <p class="text-blue-600 font-bold">Your turn</p>
      {:else}
        <p class="text-gray-600">Opponent's turn</p>
      {/if}
    </div>
    
    <!-- Board -->
    <div class="flex-1 flex items-start justify-center p-2 pt-4">
      {#if currentGame.status === 'waiting'}
        <div class="text-center">
          <div class="text-8xl mb-6">⏳</div>
          <p class="text-gray-600 text-xl">Waiting for player 2</p>
        </div>
      {:else}
        <CheckersBoard />
      {/if}
    </div>
  {/if}
</div>
