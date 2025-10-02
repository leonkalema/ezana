<script lang="ts">
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let gameCodeInput = '';
  let customGameCode = '';
  let showCreateGameModal = false;
  let isCreatingGame = false;
  let isJoiningGame = false;
  
  $: ({ user, isAuthenticated } = $authStore);
  $: ({ activeGames, matchmakingStatus, isLoading, error } = $gameStore);
  
  onMount(async () => {
    if (!isAuthenticated) {
      goto('/login');
      return;
    }
    
    // Load active games
    await gameStore.loadActiveGames();
  });
  
  async function createQuickGame() {
    isCreatingGame = true;
    try {
      await gameStore.createGame();
      if ($gameStore.currentGame) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
      }
    } catch (err) {
      console.error('Failed to create game:', err);
    } finally {
      isCreatingGame = false;
    }
  }
  
  async function createCustomGame() {
    if (!customGameCode.trim()) return;
    
    isCreatingGame = true;
    try {
      await gameStore.createGame(customGameCode.toUpperCase());
      if ($gameStore.currentGame) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
      }
      showCreateGameModal = false;
      customGameCode = '';
    } catch (err) {
      console.error('Failed to create custom game:', err);
    } finally {
      isCreatingGame = false;
    }
  }
  
  async function joinGame() {
    if (!gameCodeInput.trim()) return;
    
    isJoiningGame = true;
    try {
      await gameStore.joinGame(gameCodeInput.toUpperCase());
      if ($gameStore.currentGame) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
      }
      gameCodeInput = '';
    } catch (err) {
      console.error('Failed to join game:', err);
    } finally {
      isJoiningGame = false;
    }
  }
  
  async function joinMatchmaking() {
    try {
      await gameStore.joinMatchmaking();
      if ($gameStore.currentGame) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
      }
    } catch (err) {
      console.error('Failed to join matchmaking:', err);
    }
  }
  
  async function leaveMatchmaking() {
    try {
      await gameStore.leaveMatchmaking();
    } catch (err) {
      console.error('Failed to leave matchmaking:', err);
    }
  }
  
  function resumeGame(gameCode: string) {
    goto(`/game/${gameCode}`);
  }
  
  function getGameStatusText(status: string): string {
    switch (status) {
      case 'waiting': return 'Waiting for opponent';
      case 'active': return 'In progress';
      case 'completed': return 'Completed';
      case 'abandoned': return 'Abandoned';
      default: return status;
    }
  }
  
  function getGameStatusColor(status: string): string {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'abandoned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Binojo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Welcome Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">
        Welcome back, {user?.username}!
      </h1>
      <p class="text-gray-600 mt-2">Ready to play some checkers?</p>
    </div>
    
    <!-- Error Display -->
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="ml-2 text-sm text-red-700">{error}</p>
          <button 
            on:click={() => gameStore.clearError()}
            class="ml-auto text-red-400 hover:text-red-600"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Quick Actions -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <!-- Create Game -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 class="ml-3 text-lg font-semibold text-gray-900">Create Game</h3>
        </div>
        <p class="text-gray-600 mb-4">Start a new game and invite friends</p>
        <div class="space-y-2">
          <button
            on:click={createQuickGame}
            disabled={isCreatingGame || isLoading}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {#if isCreatingGame}
              Creating...
            {:else}
              Quick Game
            {/if}
          </button>
          <button
            on:click={() => showCreateGameModal = true}
            disabled={isLoading}
            class="w-full bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium border border-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Custom Code
          </button>
        </div>
      </div>
      
      <!-- Join Game -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 class="ml-3 text-lg font-semibold text-gray-900">Join Game</h3>
        </div>
        <p class="text-gray-600 mb-4">Enter a game code to join</p>
        <div class="space-y-2">
          <input
            type="text"
            bind:value={gameCodeInput}
            placeholder="Enter game code"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            maxlength="8"
          />
          <button
            on:click={joinGame}
            disabled={!gameCodeInput.trim() || isJoiningGame || isLoading}
            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {#if isJoiningGame}
              Joining...
            {:else}
              Join Game
            {/if}
          </button>
        </div>
      </div>
      
      <!-- Matchmaking -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="ml-3 text-lg font-semibold text-gray-900">Find Opponent</h3>
        </div>
        <p class="text-gray-600 mb-4">Get matched with other players</p>
        
        {#if matchmakingStatus?.inQueue}
          <div class="text-center">
            <div class="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-3"></div>
            <p class="text-sm text-gray-600 mb-3">Looking for opponent...</p>
            <p class="text-xs text-gray-500 mb-3">Queue size: {matchmakingStatus.queueSize}</p>
            <button
              on:click={leaveMatchmaking}
              class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        {:else}
          <button
            on:click={joinMatchmaking}
            disabled={isLoading}
            class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Find Match
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Active Games -->
    {#if activeGames.length > 0}
      <div class="bg-white rounded-lg shadow-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Your Games</h2>
        </div>
        <div class="divide-y divide-gray-200">
          {#each activeGames as game}
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <span class="font-mono text-lg font-semibold text-gray-900">
                    {game.game_code}
                  </span>
                  <span class={`px-2 py-1 text-xs font-medium rounded-full ${getGameStatusColor(game.status)}`}>
                    {getGameStatusText(game.status)}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  Created {new Date(game.created_at).toLocaleDateString()}
                  {#if game.started_at}
                    • Started {new Date(game.started_at).toLocaleTimeString()}
                  {/if}
                </p>
              </div>
              <button
                on:click={() => resumeGame(game.game_code)}
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {game.status === 'waiting' ? 'View' : 'Resume'}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Create Custom Game Modal -->
{#if showCreateGameModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Create Custom Game</h3>
      <div class="space-y-4">
        <div>
          <label for="customCode" class="block text-sm font-medium text-gray-700 mb-2">
            Custom Game Code (8 characters)
          </label>
          <input
            id="customCode"
            type="text"
            bind:value={customGameCode}
            placeholder="ABCD1234"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            maxlength="8"
          />
          <p class="text-xs text-gray-500 mt-1">
            Use letters and numbers only. Leave empty for random code.
          </p>
        </div>
        <div class="flex space-x-3">
          <button
            on:click={() => { showCreateGameModal = false; customGameCode = ''; }}
            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={createCustomGame}
            disabled={isCreatingGame}
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {#if isCreatingGame}
              Creating...
            {:else}
              Create
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
