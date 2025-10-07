<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import CheckersBoard from '$lib/components/game/checkers-board.svelte';
  import GameEndModal from '$lib/components/game/game-end-modal.svelte';
  import { soundManager } from '$lib/utils/sound.js';
  
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
  let soundEnabled = soundManager.isEnabled();
  let showGameEndModal = false;
  
  function copyCode() {
    navigator.clipboard.writeText(gameCode || '').then(() => {
      showCopied = true;
      setTimeout(() => showCopied = false, 2000);
    });
  }
  
  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundManager.setEnabled(soundEnabled);
  }

  async function quitGame() {
    try {
      await gameStore.abandonGame();
      goto('/dashboard');
    } catch (e) {
      console.error('Failed to quit game', e);
    }
  }

  function isGameWinner(): boolean {
    if (!currentGame || !currentGame.winner_id || !playerRole) return false;
    const playerId = playerRole === 'player1' ? currentGame.player1_id : currentGame.player2_id;
    return currentGame.winner_id === playerId;
  }

  function getWinnerColor(): 'red' | 'black' | null {
    if (!currentGame) return null;
    // Prefer authoritative winner_id from server
    if (currentGame.winner_id) {
      return currentGame.winner_id === currentGame.player1_id ? 'red' : 'black';
    }
    // Fallback to engine-reported color in game_state
    if (currentGame.game_state?.winner) return currentGame.game_state.winner;
    return null;
  }

  function handleBackToDashboard() {
    showGameEndModal = false;
    goto('/dashboard');
  }

  // On game completion, show modal and wait for user action
  $: if (currentGame?.status === 'completed' && !showGameEndModal) {
    showGameEndModal = true;
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
            on:click={toggleSound}
            class="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
            title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
          >
            {#if soundEnabled}
              🔊
            {:else}
              🔇
            {/if}
          </button>
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
    <div class="bg-white border-b p-4 text-center">
      {#if currentGame.status === 'waiting'}
        <div class="flex items-center justify-center space-x-2">
          <div class="animate-pulse w-3 h-3 bg-amber-500 rounded-full"></div>
          <p class="text-amber-600 font-semibold text-lg">Waiting for opponent...</p>
          <div class="animate-pulse w-3 h-3 bg-amber-500 rounded-full"></div>
        </div>
        <p class="text-gray-500 text-sm mt-1">Share code <strong class="font-mono bg-gray-100 px-2 py-1 rounded">{gameCode}</strong></p>
      {:else if currentGame.status === 'completed'}
        <div class="flex items-center justify-center space-x-2">
          <span class="text-2xl">🎉</span>
          <p class="text-green-600 font-bold text-xl">Game Over!</p>
          <span class="text-2xl">🎉</span>
        </div>
        {#if currentGame.winner_id}
          <p class="text-gray-600 text-sm mt-1">
            {currentGame.winner_id === (playerRole === 'player1' ? currentGame.player1_id : currentGame.player2_id) ? 'You won!' : 'You lost!'}
          </p>
        {/if}
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
  
  <!-- Game End Modal -->
  <GameEndModal 
    bind:isVisible={showGameEndModal}
    isWinner={isGameWinner()}
    {playerRole}
    winnerColor={getWinnerColor()}
    on:backToDashboard={handleBackToDashboard}
  />
</div>
