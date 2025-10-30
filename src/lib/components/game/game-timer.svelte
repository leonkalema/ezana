<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let timeRemaining: number; // seconds
  export let strikes: number = 0;
  export let isActive: boolean = false;
  export let playerName: string = '';
  export let isCurrentPlayer: boolean = false;

  let displayTime = formatTime(timeRemaining);
  let interval: ReturnType<typeof setInterval> | null = null;
  
  $: urgencyLevel = getUrgencyLevel(timeRemaining);
  $: displayTime = formatTime(timeRemaining);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getUrgencyLevel(seconds: number): 'normal' | 'warning' | 'critical' {
    if (seconds <= 5) return 'critical';
    if (seconds <= 10) return 'warning';
    return 'normal';
  }

  function getStrikeClass(index: number, currentStrikes: number, isPlayerActive: boolean): string {
    const hasStrike = currentStrikes > index;
    if (hasStrike) {
      return isPlayerActive ? 'bg-white' : 'bg-gray-800';
    } else {
      return isPlayerActive ? 'bg-white/30' : 'bg-gray-300';
    }
  }

  // Client-side countdown when it's player's turn
  onMount(() => {
    if (isActive && isCurrentPlayer) {
      interval = setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining--;
        }
      }, 1000);
    }
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  // Restart interval when active state changes
  $: {
    if (interval) clearInterval(interval);
    
    if (isActive && isCurrentPlayer && timeRemaining > 0) {
      interval = setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining--;
        }
      }, 1000);
    }
  }
</script>

<div 
  class="flex items-center justify-between p-3 rounded-lg transition-all duration-300"
  class:bg-[#6B8E7E]={isActive && isCurrentPlayer}
  class:bg-[#E9E8E3]={!isActive || !isCurrentPlayer}
  class:shadow-lg={isActive && isCurrentPlayer}
  class:animate-pulse={urgencyLevel === 'critical' && isActive}
>
  <!-- Player name and strikes -->
  <div class="flex flex-col">
    <span 
      class="font-semibold text-sm"
      class:text-white={isActive && isCurrentPlayer}
      class:text-gray-800={!isActive || !isCurrentPlayer}
    >
      {playerName}
    </span>
    <div class="flex gap-1 mt-1">
      {#each Array(3) as _, i}
        <div class="w-2 h-2 rounded-full transition-all {getStrikeClass(i, strikes, isActive && isCurrentPlayer)}"></div>
      {/each}
    </div>
  </div>

  <!-- Timer display -->
  <div 
    class="text-2xl font-mono font-bold tracking-wider transition-all"
    class:text-white={isActive && isCurrentPlayer && urgencyLevel === 'normal'}
    class:text-yellow-300={isActive && isCurrentPlayer && urgencyLevel === 'warning'}
    class:text-red-400={isActive && isCurrentPlayer && urgencyLevel === 'critical'}
    class:text-gray-800={!isActive || !isCurrentPlayer}
  >
    {displayTime}
  </div>

  <!-- Activity indicator -->
  {#if isActive && isCurrentPlayer}
    <div class="flex flex-col items-center gap-1">
      <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      <span class="text-xs text-white/80 font-medium">ACTIVE</span>
    </div>
  {:else}
    <div class="w-12"></div>
  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
