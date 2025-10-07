<script lang="ts">
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let gameCodeInput = '';
  let isCreating = false;
  let isJoining = false;
  
  $: ({ isAuthenticated } = $authStore);
  $: ({ activeGames, error, isLoading, currentGame } = $gameStore);
  
  // Handle navigation when match is found
  $: if (currentGame && !isLoading && isCreating) {
    goto(`/game/${currentGame.game_code}`);
    isCreating = false;
  }
  
  // Sync loading states
  $: if (!isLoading && isCreating) {
    isCreating = false;
  }
  
  onMount(async () => {
    if (!isAuthenticated) goto('/login');
    await gameStore.loadActiveGames();
  });
  
  async function playNow() {
    isCreating = true;
    try {
      await gameStore.joinMatchmaking();
      // Don't set isCreating to false immediately - let polling handle it
      // or if match found immediately, navigation will happen
      if ($gameStore.currentGame && !$gameStore.isLoading) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
        isCreating = false;
      }
      // If still loading (in queue), keep showing "Searching..."
    } catch (error) {
      isCreating = false;
    }
  }
  
  async function joinGame() {
    if (!gameCodeInput.trim()) return;
    isJoining = true;
    try {
      await gameStore.joinGame(gameCodeInput.toUpperCase());
      if ($gameStore.currentGame) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
      }
    } finally {
      isJoining = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
  <div class="w-full max-w-md space-y-6">
    <div class="text-center text-white mb-8">
      <h1 class="text-4xl font-bold mb-2">Binojo</h1>
      <p class="text-blue-100">Play Checkers Online</p>
    </div>
    
    <button
      on:click={playNow}
      disabled={isCreating}
      class="w-full bg-white text-blue-600 text-xl font-bold py-6 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all disabled:opacity-50"
    >
      {isCreating ? 'Searching for opponent...' : 'Play Now'}
    </button>
    
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 space-y-4">
      <input
        type="text"
        bind:value={gameCodeInput}
        placeholder="Enter game code"
        class="w-full px-4 py-4 text-center text-lg font-mono uppercase bg-white/90 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/50"
        maxlength="8"
      />
      <button
        on:click={joinGame}
        disabled={!gameCodeInput.trim() || isJoining}
        class="w-full bg-white/20 text-white font-semibold py-4 rounded-xl hover:bg-white/30 transition-all disabled:opacity-30"
      >
        {isJoining ? 'Joining...' : 'Join Game'}
      </button>
    </div>
    
    {#if activeGames.length > 0}
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-4 space-y-2">
        <h3 class="text-white font-semibold mb-3">Continue Playing</h3>
        {#each activeGames.slice(0, 3) as game}
          <button
            on:click={() => goto(`/game/${game.game_code}`)}
            class="w-full bg-white/20 text-white px-4 py-3 rounded-xl hover:bg-white/30 transition-all text-left"
          >
            <div class="font-mono font-bold">{game.game_code}</div>
            <div class="text-sm text-white/70">{game.status}</div>
          </button>
        {/each}
      </div>
    {/if}
    
    {#if error}
      <div class="bg-red-500 text-white px-4 py-3 rounded-xl text-center">
        {error}
      </div>
    {/if}
  </div>
</div>
