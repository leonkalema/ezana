<script lang="ts">
  import LudoBoard from '$lib/components/game/ludo-board-tailwind.svelte';
  import Dice3D from '$lib/components/game/dice-3d.svelte';
  import TokenOverlay from '$lib/components/game/ludo-token-overlay.svelte';
  import HighlightOverlay from '$lib/components/game/ludo-highlight-overlay.svelte';
  import PieceOverlay from '$lib/components/game/ludo-piece-overlay.svelte';
  import { legalMovesFor, defaultRules } from '$lib/engine/ludo-rules';
  import type { LudoState, Piece, Player } from '$lib/types/ludo';
  import { ludoStore } from '$lib/stores/ludo';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { cellIdToTrackIndex, indexToCellId } from '$lib/engine/board-map';
  
  // Test state
  let diceValue = 1;
  let isRolling = false;
  let canRoll = true;
  let currentPlayer: 'red' | 'blue' | 'yellow' | 'green' = 'red';
  let gameLog: string[] = [];
  let boardRoot: HTMLElement | null = null;
  
  // Mock game state
  let mockGameState = {
    currentPlayer: 'red',
    pieces: {
      red: [
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'path', pathPosition: 5 },
        { id: 4, position: 'home' }
      ],
      blue: [
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'home' },
        { id: 4, position: 'home' }
      ],
      yellow: [
        { id: 1, position: 'home' },
        { id: 2, position: 'path', pathPosition: 12 },
        { id: 3, position: 'home' },
        { id: 4, position: 'home' }
      ],
      green: [
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'home' },
        { id: 4, position: 'home' }
      ]
    }
  };

  function handleDiceRoll(event: CustomEvent) {
    const { value } = event.detail;
    diceValue = value;
    
    // Add to game log
    gameLog = [`${currentPlayer.toUpperCase()} rolled ${value}`, ...gameLog.slice(0, 9)];
    console.log('[Ludo] Roll complete:', { player: currentPlayer, value });

    // Feed value into store, then wait for click-driven move selection
    ludoStore.acceptDice(value);
    const afterRoll = get(ludoStore);
    const lmCount = afterRoll.legalMoves.length;
    const enterExists = afterRoll.legalMoves.some(m => m.from === 'home');
    gameLog = [
      `Legal moves: ${lmCount} (click a destination)` + (value === 6 ? `, enter:${enterExists}` : ''),
      ...gameLog.slice(0, 9)
    ];
    console.log('[Ludo] Legal moves after roll:', { count: lmCount, enterExists, moves: afterRoll.legalMoves });
    // If no legal moves, auto-pass turn
    if (lmCount === 0) {
      ludoStore.endTurn();
      gameLog = [`No legal moves. Passing turn.`, ...gameLog.slice(0, 9)];
      console.log('[Ludo] No legal moves, passing turn');
    }
    
    // Switch player (unless rolled 6)
    // currentPlayer is mirrored from store subscription
  }
  
  function handleSquareClick(clickData: any) {
    gameLog = [`Clicked: ${JSON.stringify(clickData)}`, ...gameLog.slice(0, 9)];
    console.log('[Ludo] Board click:', clickData);
    // Mapping recorder capture
    if (recorderActive) {
      const id = idFromClick(clickData);
      if (id) {
        recorderList = [...recorderList, id];
        updateRecorderExport();
      }
    }

    // Click-driven move selection
    const id = idFromClick(clickData);
    if (!id) return;
    const storeSnap = get(ludoStore);
    const moves = storeSnap.legalMoves;
    if (!moves || moves.length === 0) return;

    // Destination mapping
    // - If clicking an entry cell for current player and there is a home-enter move, apply it
    // - Else map path cell id to track index and match moves with that 'to'
    const maybeEntry = id.startsWith('entry-') ? id.split('entry-')[1] : null;
    if (maybeEntry && maybeEntry === storeSnap.state.current) {
      const enter = moves.find(m => m.from === 'home' && typeof m.to === 'number');
      if (enter) {
        ludoStore.selectApply(enter);
        gameLog = [`Applied: enter from home`, ...gameLog.slice(0, 9)];
        console.log('[Ludo] Applied enter move:', enter);
        ludoStore.endTurn();
        return;
      } else {
        gameLog = [`No enter move available for ${storeSnap.state.current} (entry blocked or no home piece)`, ...gameLog.slice(0, 9)];
        console.log('[Ludo] Enter move not available');
      }
    }

    const idx = cellIdToTrackIndex(id);
    if (idx !== null) {
      const candidates = moves.filter(m => typeof m.to === 'number' && m.to === idx);
      if (candidates.length === 1) {
        ludoStore.selectApply(candidates[0]);
        gameLog = [`Applied: move to ${idx}`, ...gameLog.slice(0, 9)];
        console.log('[Ludo] Applied move:', candidates[0]);
        ludoStore.endTurn();
        return;
      } else if (candidates.length > 1) {
        // If multiple, pick the first for now (later we can disambiguate by piece)
        ludoStore.selectApply(candidates[0]);
        gameLog = [`Applied: move to ${idx} (multiple matched)`, ...gameLog.slice(0, 9)];
        console.log('[Ludo] Applied one of multiple moves:', candidates);
        ludoStore.endTurn();
        return;
      }
    }
  }
  
  function resetTest() {
    diceValue = 1;
    isRolling = false;
    currentPlayer = 'red';
    gameLog = ['Game reset'];
  }
  
  function simulateRoll(value: number) {
    diceValue = value;
    gameLog = [`Simulated roll: ${value}`, ...gameLog.slice(0, 9)];
  }

  // ===== Mapping Recorder (debug) =====
  let recorderActive: boolean = false;
  let recorderList: string[] = [];
  let recorderExport: string = '';
  let recorderCopied: boolean = false;

  function toggleRecorder(): void {
    recorderActive = !recorderActive;
    recorderCopied = false;
  }

  function resetRecorder(): void {
    recorderList = [];
    updateRecorderExport();
    recorderCopied = false;
  }

  function undoRecorder(): void {
    recorderList = recorderList.slice(0, -1);
    updateRecorderExport();
    recorderCopied = false;
  }

  async function copyRecorder(): Promise<void> {
    if (!recorderExport) return;
    try {
      await navigator.clipboard.writeText(recorderExport);
      recorderCopied = true;
      setTimeout(() => { recorderCopied = false; }, 2000);
    } catch (err) {
      console.error('[Mapping Recorder] Failed to copy', err);
    }
  }

  function idFromClick(data: any): string | null {
    if (!data || typeof data !== 'object') return null;
    if (data.type === 'path' && typeof data.position === 'string') return data.position; // e.g., 't1','l3','r14','b6'
    if (data.type === 'entry' && typeof data.color === 'string') return `entry-${data.color}`;
    if (data.type === 'home-path' && typeof data.color === 'string' && typeof data.position === 'number') return `${data.color}-lane-${data.position}`;
    return null;
  }

  function toCellToIndex(ids: readonly string[]): Record<string, number> {
    const map: Record<string, number> = {};
    ids.forEach((k, i) => { map[k] = i; });
    return map;
  }

  function updateRecorderExport(): void {
    recorderExport = recorderList.length ? JSON.stringify(toCellToIndex(recorderList), null, 2) : '';
  }

  // Build LudoState from our mockGameState for rules testing
  function buildState(): LudoState {
    const toPiece = (player: Player, raw: any): Piece => {
      if (raw.position === 'home') {
        return { id: raw.id, player, state: 'home' };
      }
      if (raw.position === 'path') {
        const pos = typeof raw.pathPosition === 'number' ? raw.pathPosition : 0;
        return { id: raw.id, player, state: 'track', pos };
      }
      return { id: raw.id, player, state: 'home' };
    };
    return {
      current: currentPlayer,
      phase: 'roll',
      pieces: {
        red: mockGameState.pieces.red.map((p: any) => toPiece('red', p)),
        blue: mockGameState.pieces.blue.map((p: any) => toPiece('blue', p)),
        yellow: mockGameState.pieces.yellow.map((p: any) => toPiece('yellow', p)),
        green: mockGameState.pieces.green.map((p: any) => toPiece('green', p))
      }
    } as const;
  }

  $: currentState = buildState();
  $: legalMoves = legalMovesFor(currentState, currentPlayer, diceValue, defaultRules);
  $: if (legalMoves) {
    // keep a short log in memory for quick verification
    const summary = `Legal moves: ${legalMoves.length}`;
    // only push when dice changes to avoid spam
  }

  // Derive highlight IDs from current store legal moves (reactive to $ludoStore)
  $: highlightIds = (() => {
    const ids: string[] = [];
    const moves = $ludoStore?.legalMoves || [];
    for (const m of moves) {
      if (m.from === 'home') {
        ids.push(`entry-${$ludoStore.state.current}`);
      }
      if (typeof m.to === 'number') {
        const id = indexToCellId(m.to);
        if (id) ids.push(id);
      }
    }
    return Array.from(new Set(ids));
  })();

  // Store wiring: init from mock and reflect current player
  let storeUnsub: (() => void) | null = null;
  onMount(() => {
    ludoStore.initFromMock(mockGameState);
    storeUnsub = ludoStore.subscribe((s) => {
      // Reflect store current player for dice color
      currentPlayer = s.state.current;
    });
    // Expose mapping recorder helpers to window for console usage
    (window as any).toggleRecorder = toggleRecorder;
    (window as any).resetRecorder = resetRecorder;
    (window as any).undoRecorder = undoRecorder;
    console.info('[Mapping Recorder] Use toggleRecorder(), resetRecorder(), undoRecorder() in console.');
    return () => { storeUnsub?.(); };
  });
</script>

<svelte:head>
  <title>Ludo UI Test - Binojo</title>
  <script src="https://kit.fontawesome.com/eb3d4e59bc.js" crossorigin="anonymous"></script>
</svelte:head>

<div class="test-container">
  <div class="test-header">
    <h1>🎲 Ludo UI Test</h1>
    <p>Testing Ludo board and dice components</p>
  </div>
  
  <div class="test-content">
    <!-- Ludo Board -->
    <div class="board-section">
      <div class="board-wrapper" bind:this={boardRoot}>
        <LudoBoard onSquareClick={handleSquareClick} {highlightIds} />
        <PieceOverlay {boardRoot} pieces={$ludoStore.state.pieces} />
        <HighlightOverlay {boardRoot} highlights={highlightIds} current={$ludoStore.state.current} />
        <div class="dice-overlay" aria-hidden={false}>
          <div class="dice-overlay-inner">
            <Dice3D 
              bind:value={diceValue}
              bind:isRolling={isRolling}
              {canRoll}
              playerColor={currentPlayer}
              on:rollStart={() => gameLog = ['Rolling dice...', ...gameLog.slice(0, 9)]}
              on:rollComplete={handleDiceRoll}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="test-info">
    <h3>🧪 Test Instructions</h3>
    <ul>
      <li><strong>Roll Dice:</strong> Click the dice or use spacebar/enter</li>
      <li><strong>Board Interaction:</strong> Click any square on the board</li>
      <li><strong>Player Switch:</strong> Use player buttons or roll dice (auto-switch unless 6)</li>
      <li><strong>Simulate Rolls:</strong> Use number buttons to test specific dice values</li>
      <li><strong>Special Effects:</strong> Roll a 6 to see celebration effects</li>
      <li><strong>Responsive:</strong> Resize window to test mobile layout</li>
    </ul>
  </div>

  <div class="recorder-panel" aria-live="polite">
    <h3>📍 Mapping Recorder</h3>
    <p>Click <code>Toggle</code> to start recording board cells in clockwise order. Use <code>Undo</code> or <code>Reset</code> as needed.</p>
    <div class="recorder-actions">
      <button class="btn-recorder" on:click={toggleRecorder}>
        {recorderActive ? '⏹ Stop' : '▶️ Start'}
      </button>
      <button class="btn-recorder" on:click={undoRecorder} disabled={recorderList.length === 0}>
        ↩️ Undo
      </button>
      <button class="btn-recorder" on:click={resetRecorder} disabled={recorderList.length === 0}>
        🔄 Reset
      </button>
      <button class="btn-recorder" on:click={copyRecorder} disabled={!recorderExport}>
        {recorderCopied ? '✅ Copied' : '📋 Copy JSON'}
      </button>
    </div>
    <div class="recorder-status">
      <span class:active={recorderActive}>Status: {recorderActive ? 'Recording…' : 'Idle'}</span>
      <span>Captured: {recorderList.length}</span>
    </div>
    <textarea class="recorder-output" readonly placeholder="JSON mapping will appear here" bind:value={recorderExport}></textarea>
  </div>

  <div class="game-log" aria-live="polite">
    <h3>📜 Game Log</h3>
    {#if gameLog.length === 0}
      <p class="muted">No events yet. Roll the dice to start.</p>
    {:else}
      <ul>
        {#each gameLog as line, i}
          <li>{line}</li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .test-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .test-header {
    text-align: center;
    color: white;
    margin-bottom: 0.5rem;
  }

  .test-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .test-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .board-section {
    background: white;
    border-radius: 12px;
    padding: 0.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .board-wrapper {
    position: relative;
    width: min(92vmin, 900px);
    height: min(92vmin, 900px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .board-wrapper :global(> *) {
    width: 100%;
    height: 100%;
  }

  .dice-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .dice-overlay-inner {
    pointer-events: auto;
    transform: scale(0.8);
    transform-origin: center;
  }

  .test-info {
    background: rgba(255,255,255,0.9);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    display: none; /* hidden on desktop to avoid scroll */
  }

  .test-info h3 {
    color: #333;
    margin-top: 0;
  }

  .test-info ul {
    list-style: none;
    padding: 0;
  }

  .test-info li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }

  .test-info li:last-child {
    border-bottom: none;
  }

  .recorder-panel {
    background: rgba(255, 255, 255, 0.85);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }

  .recorder-panel h3 {
    margin: 0;
    color: #1f2933;
  }

  .recorder-panel p {
    margin: 0;
    color: #4b5563;
    font-size: 0.95rem;
  }

  .recorder-panel code {
    background: rgba(0,0,0,0.08);
    padding: 0.1rem 0.35rem;
    border-radius: 6px;
  }

  .recorder-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn-recorder {
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .btn-recorder:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(99,102,241,0.25);
  }

  .btn-recorder:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .recorder-status {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #334155;
  }

  .recorder-status span.active {
    color: #047857;
    font-weight: 600;
  }

  .recorder-output {
    width: 100%;
    min-height: 140px;
    border-radius: 8px;
    border: 1px solid rgba(148,163,184,0.6);
    padding: 0.75rem;
    font-family: 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.85rem;
    background: rgba(255,255,255,0.95);
    color: #1f2933;
    resize: vertical;
  }

  /* Global highlight styling for legal destinations inside child board component */
  :global(.highlight) {
    outline: 3px solid #6366f1; /* indigo-500 */
    outline-offset: -3px;
    transition: outline-color 120ms ease;
  }

  @media (max-width: 1024px) {
    .test-content {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .board-section {
      order: 1;
    }

    .test-info {
      display: block;
    }
  }

  @media (max-width: 768px) {
    .test-container {
      padding: 1rem;
    }

    .test-header h1 {
      font-size: 2rem;
    }

    .dice-overlay-inner {
      transform: scale(0.5);
    }
  }
</style>
