<script lang="ts">
  import { onMount } from 'svelte';
  import type { Player, Piece } from '$lib/types/ludo';
  import { indexToCellId } from '$lib/engine/board-map';

  export let boardRoot: HTMLElement | null = null;
  export let pieces: Record<Player, ReadonlyArray<Piece>>;

  type PieceMarker = { left: number; top: number; player: Player; id: number };
  let pieceMarkers: PieceMarker[] = [];

  const recompute = (): void => {
    if (!boardRoot) {
      pieceMarkers = [];
      return;
    }
    const rect = boardRoot.getBoundingClientRect();
    const next: PieceMarker[] = [];
    
    // Process all players' pieces
    (['red', 'blue', 'yellow', 'green'] as Player[]).forEach(player => {
      const playerPieces = pieces[player] || [];
      playerPieces.forEach(piece => {
        let cellId: string | null = null;
        
        if (piece.state === 'track' && typeof piece.pos === 'number') {
          cellId = indexToCellId(piece.pos);
        } else if (piece.state === 'home') {
          // Show pieces in home area - use a simple home cell ID
          cellId = `home-${player}-${piece.id}`;
        }
        
        if (cellId) {
          const el = boardRoot!.querySelector<HTMLElement>(`[data-cell-id="${cellId}"]`);
          if (el) {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            next.push({ 
              left: cx - rect.left, 
              top: cy - rect.top, 
              player, 
              id: piece.id 
            });
          }
        }
      });
    });
    
    pieceMarkers = next;
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
    pieces;
    recompute();
  }

  const colorClass: Record<Player, string> = {
    red: 'bg-red-600 border-red-800',
    green: 'bg-green-600 border-green-800', 
    yellow: 'bg-yellow-400 border-yellow-600',
    blue: 'bg-sky-500 border-sky-700'
  } as const;
</script>

<div class="overlay" aria-hidden="true">
  {#each pieceMarkers as marker}
    <div 
      class="piece" 
      style="left: {marker.left}px; top: {marker.top}px;"
      title="{marker.player} piece {marker.id}"
    >
      <div class="token {colorClass[marker.player]}">
        {marker.id}
      </div>
    </div>
  {/each}
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .piece {
    position: absolute;
    transform: translate(-50%, -50%);
  }
  .token {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border-width: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
</style>
