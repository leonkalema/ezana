<script lang="ts">
  export let strikes: number = 0;
  export let maxStrikes: number = 3;
  export let variant: 'compact' | 'detailed' = 'compact';
</script>

{#if variant === 'compact'}
  <div class="flex gap-1.5">
    {#each Array(maxStrikes) as _, i}
      <div 
        class="w-2.5 h-2.5 rounded-full transition-all duration-300"
        class:bg-red-500={strikes > i}
        class:bg-gray-300={strikes <= i}
        class:shadow-sm={strikes > i}
      ></div>
    {/each}
  </div>
{:else}
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-800">Timeouts:</span>
      <div class="flex gap-1.5">
        {#each Array(maxStrikes) as _, i}
          <div 
            class="w-3 h-3 rounded-full transition-all duration-300"
            class:bg-red-500={strikes > i}
            class:bg-gray-300={strikes <= i}
            class:shadow-md={strikes > i}
          ></div>
        {/each}
      </div>
    </div>
    
    {#if strikes >= maxStrikes}
      <span class="text-xs text-red-600 font-semibold">
        ⚠️ Maximum timeouts reached!
      </span>
    {:else if strikes > 0}
      <span class="text-xs text-[#2D2D2D]/70">
        {maxStrikes - strikes} {maxStrikes - strikes === 1 ? 'timeout' : 'timeouts'} remaining
      </span>
    {/if}
  </div>
{/if}
