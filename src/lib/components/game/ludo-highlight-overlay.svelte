<script lang="ts">
  import { onMount } from 'svelte';
  import type { Player } from '$lib/types/ludo';

  export let boardRoot: HTMLElement | null = null;
  export let highlights: ReadonlyArray<string> = [];
  export let current: Player;

  type Marker = { left: number; top: number };
  let markers: Marker[] = [];

  const recompute = (): void => {
    if (!boardRoot || !highlights.length) {
      markers = [];
      return;
    }
    const rect = boardRoot.getBoundingClientRect();
    const next: Marker[] = [];
    
    highlights.forEach((id) => {
      const el = boardRoot!.querySelector<HTMLElement>(`[data-cell-id="${id}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        next.push({ left: cx - rect.left, top: cy - rect.top });
      }
    });
    markers = next;
  };

  onMount(() => {
    const observer = new MutationObserver(recompute);
    if (boardRoot) {
      observer.observe(boardRoot, { attributes: true, subtree: true });
    }
    window.addEventListener('resize', recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recompute);
    };
  });

  $: if (boardRoot) {
    highlights, current;
    recompute();
  }

  const colorClass: Record<Player, string> = {
    red: 'bg-red-500/90 shadow-red-400/40',
    green: 'bg-green-500/90 shadow-green-400/40',
    yellow: 'bg-yellow-400/95 shadow-yellow-300/40',
    blue: 'bg-sky-500/90 shadow-sky-400/40'
  } as const;
</script>

<div class="overlay" aria-hidden="false">
  {#each markers as m, i}
    <div class="marker animate-ping-slow" style="left: {m.left}px; top: {m.top}px;">
      <span class="dot {colorClass[current]}"></span>
    </div>
  {/each}
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
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    box-shadow: 0 0 0 8px rgba(0,0,0,0.10);
  }
  @keyframes ping-slow {
    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
    50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
  }
  .animate-ping-slow { animation: ping-slow 1.2s ease-in-out infinite; }
</style>
