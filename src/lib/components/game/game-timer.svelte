<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let timeRemaining: number; // seconds
  export let isActive: boolean = false;
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

<!-- Simple timer display -->
<div 
  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-lg transition-all"
  class:bg-[#6B8E7E]={isActive && isCurrentPlayer}
  class:text-white={isActive && isCurrentPlayer && urgencyLevel === 'normal'}
  class:text-yellow-300={isActive && isCurrentPlayer && urgencyLevel === 'warning'}
  class:text-red-400={isActive && isCurrentPlayer && urgencyLevel === 'critical'}
  class:bg-gray-100={!isActive || !isCurrentPlayer}
  class:text-gray-700={!isActive || !isCurrentPlayer}
  class:animate-pulse={urgencyLevel === 'critical' && isActive}
>
  <span>⏱️</span>
  <span>{displayTime}</span>
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
