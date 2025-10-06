<script lang="ts">
  import type { Player } from '$lib/types/ludo';

  export let current: Player;
  // Accept any move shape; we only check for home-entry availability.
  export let legalMoves: ReadonlyArray<any> = [];

  const entryPos: Record<Player, { left: string; top: string }> = {
    red: { left: '8%', top: '50%' },
    green: { left: '50%', top: '8%' },
    yellow: { left: '92%', top: '50%' },
    blue: { left: '50%', top: '92%' }
  } as const;

  const hasEnter = (): boolean => legalMoves.some((m) => m.from === 'home');
  const colorClass: Record<Player, string> = {
    red: 'bg-red-600 border-red-700 shadow-red-400/40',
    green: 'bg-green-600 border-green-700 shadow-green-400/40',
    yellow: 'bg-yellow-400 border-yellow-500 shadow-yellow-300/50',
    blue: 'bg-sky-500 border-sky-600 shadow-sky-400/40'
  } as const;
</script>

<div class="overlay" aria-hidden="false">
  {#if hasEnter()}
    {#key current}
      <div
        class="marker animate-pulse"
        style="left: {entryPos[current].left}; top: {entryPos[current].top};"
        aria-label="Entry available"
      >
        <span class="dot {colorClass[current]}"></span>
      </div>
    {/key}
  {/if}
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .marker {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    border-width: 2px;
    box-shadow: 0 0 0 6px rgba(0,0,0,0.12);
  }
</style>
