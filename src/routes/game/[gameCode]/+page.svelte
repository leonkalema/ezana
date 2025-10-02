<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import CheckersBoard from '$lib/components/game/checkers-board.svelte';
  import GameChat from '$lib/components/game/game-chat.svelte';
  
  $: gameCode = $page.params.gameCode;
  $: ({ isAuthenticated } = $authStore);
  $: ({ currentGame, playerRole, isLoading, error } = $gameStore);
  
  let showAbandonModal = false;
  let isAbandoning = false;
  
  onMount(async () => {
    if (!isAuthenticated) {
      goto('/login');
      return;
    }
    
    if (!gameCode) {
      goto('/dashboard');
      return;
    }
    
    try {
      await gameStore.loadGame(gameCode);
    } catch (err) {
      console.error('Failed to load game:', err);
      // Redirect to dashboard if game doesn't exist or user can't access it
      setTimeout(() => goto('/dashboard'), 2000);
    }
  });
  
  onDestroy(() => {
    // Leave the game room when component is destroyed
    gameStore.leaveGame();
  });
  
  async function abandonGame() {
    isAbandoning = true;
    try {
      await gameStore.abandonGame();
      goto('/dashboard');
    } catch (err) {
      console.error('Failed to abandon game:', err);
    } finally {
      isAbandoning = false;
      showAbandonModal = false;
    }
  }
  
  function copyGameLink() {
    const gameUrl = `${window.location.origin}/game/${gameCode}`;
    navigator.clipboard.writeText(gameUrl).then(() => {
      // Could show a toast notification here
      console.log('Game link copied to clipboard');
    });
  }
  
  function copyGameCode() {
    navigator.clipboard.writeText(gameCode).then(() => {
      console.log('Game code copied to clipboard');
    });
  }
  
  function getPlayerName(playerId: number | null): string {
    if (!playerId) return 'Waiting...';
    // In a real app, you'd have player names from the game session
    return playerId === $authStore.user?.id ? 'You' : 'Opponent';
  }
  
  function getGameStatusMessage(): string {
    if (!currentGame) return '';
    
    switch (currentGame.status) {
      case 'waiting':
        return 'Waiting for another player to join...';
      case 'active':
        const isMyTurn = (playerRole === 'player1' && currentGame.game_state.currentPlayer === 'red') ||
                        (playerRole === 'player2' && currentGame.game_state.currentPlayer === 'black');
        return isMyTurn ? "It's your turn!" : "Waiting for opponent's move...";
      case 'completed':
        const winner = currentGame.game_state.winner;
        const didIWin = (winner === 'red' && playerRole === 'player1') ||
                       (winner === 'black' && playerRole === 'player2');
        return didIWin ? 'Congratulations! You won!' : 'Game over. Better luck next time!';
      case 'abandoned':
        return 'This game has been abandoned.';
      default:
        return '';
    }
  }
</script>

<svelte:head>
  <title>Game {gameCode} - Binojo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
        <p class="text-gray-600">Loading game...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center max-w-md mx-auto px-4">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h2>
        <p class="text-gray-600 mb-6">{error}</p>
        <a 
          href="/dashboard" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  {:else if currentGame}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Game Header -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="mb-4 lg:mb-0">
            <div class="flex items-center space-x-4 mb-2">
              <h1 class="text-2xl font-bold text-gray-900">Game {gameCode}</h1>
              <span class={`px-3 py-1 text-sm font-medium rounded-full ${
                currentGame.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                currentGame.status === 'active' ? 'bg-green-100 text-green-800' :
                currentGame.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentGame.status === 'waiting' ? 'Waiting for Player' :
                 currentGame.status === 'active' ? 'In Progress' :
                 currentGame.status === 'completed' ? 'Completed' :
                 'Abandoned'}
              </span>
            </div>
            <p class="text-gray-600">{getGameStatusMessage()}</p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            {#if currentGame.status === 'completed' || currentGame.status === 'abandoned'}
              <a
                href="/dashboard"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-center"
              >
                Back to Dashboard
              </a>
              <button
                on:click={async () => {
                  try {
                    await gameStore.createGame();
                    if ($gameStore.currentGame) {
                      goto(`/game/${$gameStore.currentGame.game_code}`);
                    }
                  } catch (err) {
                    console.error('Failed to create new game:', err);
                  }
                }}
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Play Again
              </button>
            {:else}
              <button
                on:click={copyGameCode}
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Copy Code
              </button>
              <button
                on:click={copyGameLink}
                class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Share Link
              </button>
              {#if currentGame.status === 'active' || currentGame.status === 'waiting'}
                <button
                  on:click={() => showAbandonModal = true}
                  class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Abandon Game
                </button>
              {/if}
            {/if}
          </div>
        </div>
        
        <!-- Player Info -->
        <div class="mt-6 grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
            <p class="font-medium text-gray-900">Red Player</p>
            <p class="text-sm text-gray-600">{getPlayerName(currentGame.player1_id)}</p>
          </div>
          <div class="text-center">
            <div class="w-4 h-4 bg-gray-800 rounded-full mx-auto mb-2"></div>
            <p class="font-medium text-gray-900">Black Player</p>
            <p class="text-sm text-gray-600">{getPlayerName(currentGame.player2_id)}</p>
          </div>
        </div>
      </div>
      
      <!-- Game Content -->
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Game Board -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-md p-6">
            {#if currentGame.status === 'active' || currentGame.status === 'completed'}
              <CheckersBoard />
            {:else if currentGame.status === 'waiting'}
              <div class="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div class="text-center">
                  <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Waiting for Opponent</h3>
                  <p class="text-gray-600 mb-4">Share the game code or link to invite a friend</p>
                  <div class="bg-gray-100 rounded-lg p-3 font-mono text-lg font-bold text-gray-900">
                    {gameCode}
                  </div>
                </div>
              </div>
            {:else}
              <div class="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div class="text-center">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Game {currentGame.status}</h3>
                  <p class="text-gray-600">This game is no longer active</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Chat and Game Info -->
        <div class="space-y-6">
          <!-- Game Chat -->
          {#if currentGame.status === 'active' || currentGame.status === 'completed'}
            <GameChat />
          {/if}
          
          <!-- Game Instructions -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">How to Play</h3>
            <div class="space-y-2 text-sm text-gray-600">
              <p>• Click on your pieces to select them</p>
              <p>• Click on highlighted squares to move</p>
              <p>• Jump over opponent pieces to capture them</p>
              <p>• Reach the opposite end to become a king</p>
              <p>• Capture all opponent pieces to win</p>
            </div>
          </div>
          
          {#if currentGame.status === 'waiting'}
            <!-- Waiting for Player -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div class="flex items-center">
                <div class="animate-spin w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full mr-3"></div>
                <div>
                  <h4 class="font-medium text-yellow-800">Waiting for Opponent</h4>
                  <p class="text-sm text-yellow-700 mt-1">
                    Share the game code <strong>{gameCode}</strong> or the game link with a friend to start playing.
                  </p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Abandon Game Modal -->
{#if showAbandonModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Abandon Game?</h3>
      <p class="text-gray-600 mb-6">
        Are you sure you want to abandon this game? This action cannot be undone and your opponent will be declared the winner.
      </p>
      <div class="flex space-x-3">
        <button
          on:click={() => showAbandonModal = false}
          disabled={isAbandoning}
          class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={abandonGame}
          disabled={isAbandoning}
          class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {#if isAbandoning}
            Abandoning...
          {:else}
            Abandon Game
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
