<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let selectedStake: number = 0;
  export let userBalance: number = 0;
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher<{
    stakeSelected: { stake: number };
  }>();
  
  const stakeTiers = [
    { value: 0, label: 'No Stakes', description: 'Play for fun' },
    { value: 500, label: '500 Tokens', description: 'Low stakes' },
    { value: 1000, label: '1,000 Tokens', description: 'Medium stakes' },
    { value: 3000, label: '3,000 Tokens', description: 'High stakes' },
    { value: 10000, label: '10,000 Tokens', description: 'Elite stakes' }
  ];
  
  function selectStake(stake: number) {
    if (disabled) return;
    if (stake > 0 && userBalance < stake) return; // Can't afford
    
    selectedStake = stake;
    dispatch('stakeSelected', { stake });
  }
  
  function canAfford(stake: number): boolean {
    return stake === 0 || userBalance >= stake;
  }
  
  function getStakeColor(stake: number): string {
    if (stake === 0) return 'bg-gray-100 border-gray-300';
    if (stake <= 1000) return 'bg-green-50 border-green-300';
    if (stake <= 3000) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  }
  
  function getStakeIcon(stake: number): string {
    if (stake === 0) return '🎮';
    if (stake <= 1000) return '🪙';
    if (stake <= 3000) return '💰';
    return '💎';
  }
</script>

<div class="stake-selector">
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-gray-800 mb-2">Select Stakes</h3>
    <p class="text-sm text-gray-600">
      Your balance: <span class="font-semibold text-blue-600">{userBalance.toLocaleString()} tokens</span>
    </p>
  </div>
  
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {#each stakeTiers as tier}
      {@const affordable = canAfford(tier.value)}
      {@const isSelected = selectedStake === tier.value}
      
      <button
        class="stake-option {getStakeColor(tier.value)} {isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} 
               {!affordable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
               {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
        class:selected={isSelected}
        disabled={disabled || !affordable}
        on:click={() => selectStake(tier.value)}
      >
        <div class="flex items-center justify-between p-4 rounded-lg border-2 transition-all">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{getStakeIcon(tier.value)}</span>
            <div class="text-left">
              <div class="font-semibold text-gray-800">{tier.label}</div>
              <div class="text-sm text-gray-500">{tier.description}</div>
            </div>
          </div>
          
          {#if isSelected}
            <div class="text-blue-500">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
          {/if}
          
          {#if !affordable && tier.value > 0}
            <div class="text-red-500 text-sm font-medium">
              Insufficient funds
            </div>
          {/if}
        </div>
      </button>
    {/each}
  </div>
  
  {#if selectedStake > 0}
    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <div class="text-sm text-blue-700">
          <strong>Stakes:</strong> {selectedStake.toLocaleString()} tokens each player
          <br>
          <strong>Winner gets:</strong> {Math.floor(selectedStake * 2 * 0.9).toLocaleString()} tokens (10% house rake)
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .stake-selector {
    width: 100%;
  }
  
  .stake-option {
    transition: all 0.2s;
  }
  
  .stake-option:not(:disabled):hover {
    transform: scale(1.05);
  }
  
  .stake-option.selected {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
</style>
