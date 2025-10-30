<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import CheckersBoard from '$lib/components/game/checkers-board.svelte';
  import GameEndModal from '$lib/components/game/game-end-modal.svelte';
  import GameTimer from '$lib/components/game/game-timer.svelte';
  import StrikeIndicator from '$lib/components/game/strike-indicator.svelte';
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
  let soundEnabled = true;
  let showGameEndModal = false;
  let showQuitConfirmModal = false;
  
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

  function showQuitConfirm() {
    showQuitConfirmModal = true;
  }

  async function confirmQuit() {
    try {
      showQuitConfirmModal = false;
      await gameStore.abandonGame();
      goto('/dashboard');
    } catch (e) {
      console.error('Failed to quit game', e);
    }
  }

  function cancelQuit() {
    showQuitConfirmModal = false;
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

  // Game completion handled by UI messages, no modal needed
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
              on:click={showQuitConfirm}
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
      {:else if currentGame.status === 'completed' || currentGame.status === 'abandoned'}
        <div class="text-center">
          <div class="text-8xl mb-6">
            {#if isGameWinner()}
              🏆
            {:else}
              😔
            {/if}
          </div>
          <h2 class="text-4xl font-bold mb-4 text-gray-800">
            {#if isGameWinner()}
              🎉 You Won! 🎉
            {:else}
              Game Over
            {/if}
          </h2>
          <p class="text-xl text-gray-600 mb-6">
            {#if currentGame.status === 'abandoned'}
              {isGameWinner() ? 'Opponent quit - You win!' : 'You quit the game'}
            {:else if currentGame.winner_id}
              {isGameWinner() ? 'Congratulations!' : 'Better luck next time!'}
            {:else}
              It's a draw!
            {/if}
          </p>
          
          {#if currentGame.stake_tokens && currentGame.stake_tokens > 0}
            <div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 mb-6 border border-yellow-200 max-w-md mx-auto">
              {#if !currentGame.winner_id}
                <!-- Draw - stakes refunded -->
                <div class="flex items-center justify-center space-x-2 text-blue-600">
                  <span>↩️</span>
                  <span class="font-semibold">Stakes Refunded</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {currentGame.stake_tokens.toLocaleString()} tokens returned to each player
                </p>
              {:else if isGameWinner()}
                <!-- Winner gets payout -->
                <div class="flex items-center justify-center space-x-2 text-green-600">
                  <span>💰</span>
                  <span class="font-semibold">You Won {Math.floor(currentGame.stake_tokens * 2 * (1 - (currentGame.rake_bps || 1000) / 10000)).toLocaleString()} Tokens!</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  From {(currentGame.stake_tokens * 2).toLocaleString()} total stakes (10% house fee)
                </p>
              {:else}
                <!-- Loser loses stake -->
                <div class="flex items-center justify-center space-x-2 text-red-600">
                  <span>💸</span>
                  <span class="font-semibold">You Lost {currentGame.stake_tokens.toLocaleString()} Tokens</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  Winner received {Math.floor(currentGame.stake_tokens * 2 * (1 - (currentGame.rake_bps || 1000) / 10000)).toLocaleString()} tokens
                </p>
              {/if}
            </div>
          {/if}
          
          <button
            on:click={() => goto('/dashboard')}
            class="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-lg"
          >
            Back to Dashboard
          </button>
        </div>
      {:else}
        <!-- Timer Section - Right Above Board -->
        {#if currentGame.status === 'active'}
          <div class="w-full max-w-2xl mx-auto mb-2">
            <div class="flex items-center justify-between text-sm px-2 py-1 bg-white rounded-lg shadow-sm">
              <!-- You -->
              <div class="flex items-center gap-1.5">
                <span class="font-semibold text-[#6B8E7E]">YOU</span>
                <StrikeIndicator 
                  strikes={playerRole === 'player1' ? (currentGame.player1_strikes || 0) : (currentGame.player2_strikes || 0)}
                  variant="compact"
                />
                <GameTimer
                  timeRemaining={playerRole === 'player1' ? (currentGame.player1_time_remaining || 60) : (currentGame.player2_time_remaining || 60)}
                  isActive={playerRole === currentGame.current_turn}
                  isCurrentPlayer={playerRole === currentGame.current_turn}
                />
              </div>
              
              <!-- Opponent -->
              <div class="flex items-center gap-1.5">
                <GameTimer
                  timeRemaining={playerRole === 'player1' ? (currentGame.player2_time_remaining || 60) : (currentGame.player1_time_remaining || 60)}
                  isActive={playerRole !== currentGame.current_turn}
                  isCurrentPlayer={false}
                />
                <StrikeIndicator 
                  strikes={playerRole === 'player1' ? (currentGame.player2_strikes || 0) : (currentGame.player1_strikes || 0)}
                  variant="compact"
                />
                <span class="font-semibold text-gray-600">OPP</span>
              </div>
            </div>
          </div>
        {/if}
        
        <CheckersBoard />
      {/if}
    </div>
  {/if}
  
  <!-- Quit Confirmation Modal -->
  {#if showQuitConfirmModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <div class="text-center">
          <div class="text-6xl mb-4">⚠️</div>
          <h3 class="text-xl font-bold mb-4 text-gray-800">Quit Game?</h3>
          <p class="text-gray-600 mb-2">Are you sure you want to quit?</p>
          
          {#if currentGame?.stake_tokens && currentGame.stake_tokens > 0}
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p class="text-red-700 font-semibold">⚠️ Warning:</p>
              <p class="text-red-600 text-sm">
                You will lose your stake of {currentGame.stake_tokens.toLocaleString()} tokens and your opponent will win automatically.
              </p>
            </div>
          {:else}
            <p class="text-gray-500 text-sm mb-4">Your opponent will win automatically.</p>
          {/if}
          
          <div class="flex space-x-3">
            <button
              on:click={cancelQuit}
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              on:click={confirmQuit}
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Quit Game
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
