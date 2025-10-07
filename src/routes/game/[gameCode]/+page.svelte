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
    if (!currentGame || !playerRole) return false;
    
    // Get current user ID from auth store
    const currentUserId = $authStore.user?.id;
    if (!currentUserId) return false;
    
    // Check if current user is the winner
    if (currentGame.winner_id) {
      return currentGame.winner_id === currentUserId;
    }
    
    // Fallback: check game_state winner
    if (currentGame.game_state?.winner) {
      const winnerIsPlayer1 = currentGame.game_state.winner === 'red';
      const currentUserIsPlayer1 = playerRole === 'player1';
      return winnerIsPlayer1 === currentUserIsPlayer1;
    }
    
    return false;
  }

  function getWinnerColor(): 'red' | 'black' | null {
    if (!currentGame) return null;
    
    console.log('Getting winner color:', {
      winner_id: currentGame.winner_id,
      player1_id: currentGame.player1_id,
      player2_id: currentGame.player2_id,
      game_state_winner: currentGame.game_state?.winner,
      status: currentGame.status
    });
    
    // Prefer authoritative winner_id from server
    if (currentGame.winner_id) {
      return currentGame.winner_id === currentGame.player1_id ? 'red' : 'black';
    }
    
    // Fallback to engine-reported color in game_state
    if (currentGame.game_state?.winner) {
      return currentGame.game_state.winner;
    }
    
    return null;
  }

  function handleBackToDashboard() {
    showGameEndModal = false;
    goto('/dashboard');
  }

  // On game completion, show modal and wait for user action
  $: if (currentGame?.status === 'completed' && !showGameEndModal) {
    console.log('Game completed, showing modal in 1 second...', {
      winner_id: currentGame.winner_id,
      game_state_winner: currentGame.game_state?.winner
    });
    // Add a small delay to ensure socket updates have arrived
    setTimeout(() => {
      showGameEndModal = true;
    }, 1000);
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
    
    <!-- Game Info & Turn Indicator -->
    <div class="bg-white border-b p-4">
      <!-- Stakes Info -->
      {#if currentGame.stake_tokens && currentGame.stake_tokens > 0}
        <div class="text-center mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <div class="flex items-center justify-center space-x-4 text-sm">
            <div class="flex items-center space-x-1">
              <span class="text-yellow-600">💰</span>
              <span class="font-semibold text-gray-700">Stakes:</span>
              <span class="font-bold text-yellow-700">{currentGame.stake_tokens.toLocaleString()} tokens each</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-green-600">🏆</span>
              <span class="font-semibold text-gray-700">Winner gets:</span>
              <span class="font-bold text-green-700">{Math.floor(currentGame.stake_tokens * 2 * (1 - (currentGame.rake_bps || 1000) / 10000)).toLocaleString()} tokens</span>
            </div>
            {#if currentGame.escrow_status === 'held'}
              <div class="flex items-center space-x-1">
                <span class="text-blue-600">🔒</span>
                <span class="text-blue-600 text-xs font-medium">Funds Secured</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Turn Indicator -->
      <div class="text-center">
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
    gameSession={currentGame}
    on:backToDashboard={handleBackToDashboard}
  />
</div>
