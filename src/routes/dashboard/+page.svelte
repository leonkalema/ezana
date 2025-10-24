<script lang="ts">
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { walletStore, walletService } from '$lib/stores/wallet.js';
  import StakeSelector from '$lib/components/game/stake-selector.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let gameCodeInput = '';
  let isCreating = false;
  let isCreatingPrivate = false;
  let isJoining = false;
  let showStakeModal = false;
  let showPrivateGameModal = false;
  let privateGameCode = '';
  let selectedStake = 0;
  let pendingAction: 'matchmaking' | 'private' | 'join' | null = null;
  let isValidatingAuth = true;
  
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
    // Validate token is still valid
    const isValid = await authStore.validateAuth();
    if (!isValid) {
      goto('/login');
      return;
    }
    
    await gameStore.loadActiveGames();
    isValidatingAuth = false;
  });
  
  function showStakeSelection(action: 'matchmaking' | 'private' | 'join') {
    pendingAction = action;
    showStakeModal = true;
  }

  async function executeWithStake() {
    if (!pendingAction) return;
    
    showStakeModal = false;
    
    if (pendingAction === 'matchmaking') {
      await playNow();
    } else if (pendingAction === 'private') {
      await createPrivateGame();
    } else if (pendingAction === 'join') {
      await joinGame();
    }
    
    pendingAction = null;
  }

  async function createPrivateGame() {
    isCreatingPrivate = true;
    try {
      await gameStore.createGame();
      
      if ($gameStore.currentGame) {
        privateGameCode = $gameStore.currentGame.game_code;
        
        // Set stake if selected
        if (selectedStake > 0) {
          try {
            await walletService.setGameStake(privateGameCode, selectedStake);
          } catch (error) {
            console.error('Failed to set stake:', error);
          }
        }
        
        showPrivateGameModal = true;
      }
    } catch (error) {
      console.error('Failed to create private game:', error);
    } finally {
      isCreatingPrivate = false;
    }
  }

  function copyGameCode() {
    navigator.clipboard.writeText(privateGameCode);
  }

  function joinPrivateGame() {
    showPrivateGameModal = false;
    goto(`/game/${privateGameCode}`);
  }

  async function playNow() {
    isCreating = true;
    try {
      await gameStore.joinMatchmaking(selectedStake);
      
      if ($gameStore.currentGame && !$gameStore.isLoading) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
        isCreating = false;
      }
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
      isCreating = false;
    }
  }
  
  async function joinGame() {
    if (!gameCodeInput.trim()) return;
    isJoining = true;
    try {
      await gameStore.joinGame(gameCodeInput.toUpperCase());
      
      // If we joined successfully and stakes are selected, set the stake
      if ($gameStore.currentGame && selectedStake > 0) {
        try {
          await walletService.setGameStake($gameStore.currentGame.game_code, selectedStake);
        } catch (error) {
          console.error('Failed to set stake:', error);
        }
      }
      
      if ($gameStore.currentGame) {
        goto(`/game/${$gameStore.currentGame.game_code}`);
      }
    } finally {
      isJoining = false;
    }
  }
</script>

<div class="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
  {#if isValidatingAuth}
    <div class="text-center text-[#2D2D2D]">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B8E7E] mx-auto mb-4"></div>
      <p class="text-lg">Loading...</p>
    </div>
  {:else}
  <div class="w-full max-w-md space-y-6">
    <div class="text-center text-[#2D2D2D] mb-8">
      <h1 class="text-5xl font-bold mb-2">Binojo</h1>
      <p class="text-[#6B8E7E] text-lg font-medium">Play Checkers Online</p>
    </div>
    
    <button
      on:click={() => showStakeSelection('matchmaking')}
      disabled={isCreating}
      class="w-full bg-[#6B8E7E] text-white text-xl font-bold py-6 rounded-2xl shadow-lg hover:bg-[#5a7569] hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
    >
      {isCreating ? 'Searching for opponent...' : 'Play Now (Matchmaking)'}
    </button>
    
    <button
      on:click={() => showStakeSelection('private')}
      disabled={isCreatingPrivate}
      class="w-full bg-white border-2 border-[#6B8E7E] text-[#6B8E7E] text-xl font-bold py-6 rounded-2xl shadow-lg hover:bg-[#6B8E7E] hover:text-white hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
    >
      {isCreatingPrivate ? 'Creating...' : 'Create Private Game'}
    </button>
    
    <div class="bg-[#E9E8E3] rounded-2xl p-6 space-y-4 shadow-md">
      <input
        type="text"
        bind:value={gameCodeInput}
        placeholder="Enter game code"
        class="w-full px-4 py-4 text-center text-lg font-mono uppercase bg-white border-2 border-[#E9E8E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B8E7E] focus:border-[#6B8E7E] text-[#2D2D2D]"
        maxlength="8"
      />
      <button
        on:click={() => showStakeSelection('join')}
        disabled={!gameCodeInput.trim() || isJoining}
        class="w-full bg-white border-2 border-[#6B8E7E] text-[#6B8E7E] font-semibold py-4 rounded-xl hover:bg-[#6B8E7E] hover:text-white transition-all disabled:opacity-30"
      >
        {isJoining ? 'Joining...' : 'Join Game'}
      </button>
    </div>
    
    {#if activeGames.length > 0}
      <div class="bg-white rounded-2xl p-4 space-y-2 shadow-md">
        <h3 class="text-[#2D2D2D] font-semibold mb-3">Continue Playing</h3>
        {#each activeGames.slice(0, 3) as game}
          <button
            on:click={() => goto(`/game/${game.game_code}`)}
            class="w-full bg-[#E9E8E3] text-[#2D2D2D] px-4 py-3 rounded-xl hover:bg-[#6B8E7E] hover:text-white transition-all text-left"
          >
            <div class="font-mono font-bold">{game.game_code}</div>
            <div class="text-sm opacity-70">{game.status}</div>
          </button>
        {/each}
      </div>
    {/if}
    
    {#if error}
      <div class="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl text-center">
        {error}
      </div>
    {/if}
  </div>
  {/if}
</div>

<!-- Stake Selection Modal -->
{#if showStakeModal}
  <div class="fixed inset-0 bg-[#2D2D2D]/50 flex items-center justify-center p-4 z-50">
    <div class="bg-[#FAFAF9] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-[#2D2D2D]">
          {pendingAction === 'matchmaking' ? 'Matchmaking' : pendingAction === 'private' ? 'Create Private Game' : 'Join Game'} - Select Stakes
        </h2>
        <button 
          on:click={() => showStakeModal = false}
          class="text-[#6B8E7E] hover:text-[#5a7569] text-2xl"
        >
          ×
        </button>
      </div>
      
      <StakeSelector 
        bind:selectedStake 
        userBalance={$walletStore.balance}
        on:stakeSelected={(e) => selectedStake = e.detail.stake}
      />
      
      <div class="flex space-x-4 mt-6">
        <button
          on:click={() => showStakeModal = false}
          class="flex-1 px-6 py-3 border-2 border-[#E9E8E3] text-[#2D2D2D] rounded-lg hover:bg-[#E9E8E3] font-medium transition-all"
        >
          Cancel
        </button>
        <button
          on:click={executeWithStake}
          class="flex-1 px-6 py-3 bg-[#6B8E7E] text-white rounded-lg hover:bg-[#5a7569] font-medium transition-all"
          disabled={selectedStake > 0 && $walletStore.balance < selectedStake}
        >
          {pendingAction === 'matchmaking' ? 'Find Match' : pendingAction === 'private' ? 'Create Game' : 'Join Game'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Private Game Code Modal -->
{#if showPrivateGameModal}
  <div class="fixed inset-0 bg-[#2D2D2D]/50 flex items-center justify-center p-4 z-50">
    <div class="bg-[#FAFAF9] rounded-2xl p-8 w-full max-w-md shadow-2xl">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-[#6B8E7E] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-[#2D2D2D] mb-2">Private Game Created!</h2>
        <p class="text-[#2D2D2D]/70">Share this code with your friend</p>
      </div>
      
      <div class="bg-[#E9E8E3] rounded-xl p-6 mb-6">
        <div class="text-center">
          <p class="text-sm text-[#2D2D2D]/70 mb-2">Game Code</p>
          <p class="text-4xl font-bold font-mono text-[#6B8E7E] tracking-wider">{privateGameCode}</p>
        </div>
      </div>
      
      <div class="space-y-3">
        <button
          on:click={copyGameCode}
          class="w-full px-6 py-3 bg-white border-2 border-[#6B8E7E] text-[#6B8E7E] rounded-lg hover:bg-[#E9E8E3] font-medium transition-all flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy Code</span>
        </button>
        
        <button
          on:click={joinPrivateGame}
          class="w-full px-6 py-3 bg-[#6B8E7E] text-white rounded-lg hover:bg-[#5a7569] font-medium transition-all"
        >
          Enter Game Room
        </button>
      </div>
    </div>
  </div>
{/if}
