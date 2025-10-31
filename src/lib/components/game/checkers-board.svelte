<script lang="ts">
  import { gameStore } from '$lib/stores/game.js';
  import type { Position, CheckersPiece } from '$lib/types/index.js';
  import GameTimer from './game-timer.svelte';
  import StrikeIndicator from './strike-indicator.svelte';
  
  $: ({ currentGame, playerRole, selectedSquare, validMoves, isMyTurn } = $gameStore);
  $: board = currentGame?.game_state.board || [];
  $: currentPlayer = currentGame?.game_state.currentPlayer;
  
  function handleSquareClick(row: number, col: number) {
    if (!currentGame || !isMyTurn) return;
    
    gameStore.selectSquare({ row, col });
  }
  
  function isValidMove(row: number, col: number): boolean {
    return validMoves.some(move => move.row === row && move.col === col);
  }
  
  function isSelected(row: number, col: number): boolean {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  }
  
  function isDarkSquare(row: number, col: number): boolean {
    return (row + col) % 2 === 1;
  }
  
  function getPieceClasses(piece: CheckersPiece, row: number, col: number): string {
    if (!piece?.type) return '';
    const owner = piece.color === 'red' ? 'player1' : 'player2';
    const isKing = piece.type === 'king' ? ' king' : '';
    const selected = isSelected(row, col) ? ' selected' : '';
    return `piece ${owner}${isKing}${selected}`;
  }
  
  function getSquareClasses(row: number, col: number): string {
    let classes = 'w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center relative cursor-pointer transition-all duration-200 ';
    classes += isDarkSquare(row, col) ? 'square dark ' : 'square light ';
    return classes;
  }
</script>

<div class="flex flex-col items-center space-y-4">
  <!-- Game Status -->
  <div class="text-center mb-4">
    {#if currentGame}
      <div class="flex items-center justify-center space-x-4 text-sm mb-2">
        <!-- Red Player -->
        <div class="flex items-center space-x-2 {playerRole === 'player1' && isMyTurn ? 'bg-blue-100 px-2 py-1 rounded-lg border-2 border-blue-400' : ''}">
          <div class="w-3 h-3 bg-red-500 rounded-full {playerRole === 'player1' && isMyTurn ? 'animate-pulse' : ''}"></div>
          <span class="font-medium">Red: {currentGame.game_state.capturedPieces.black}</span>
          {#if playerRole === 'player1'}
            <span class="text-xs text-blue-600 font-bold">(YOU)</span>
          {/if}
          <StrikeIndicator 
            strikes={Math.min(currentGame.player1_strikes || 0, 3)}
            maxStrikes={3}
            variant="compact"
          />
          <GameTimer
            timeRemaining={currentGame.player1_time_remaining || 60}
            isActive={currentGame.current_turn === 'player1'}
            isCurrentPlayer={currentGame.current_turn === 'player1' && playerRole === 'player1'}
          />
        </div>
        
        <div class="text-gray-400 font-bold">VS</div>
        
        <!-- Black Player -->
        <div class="flex items-center space-x-2 {playerRole === 'player2' && isMyTurn ? 'bg-blue-100 px-2 py-1 rounded-lg border-2 border-blue-400' : ''}">
          <GameTimer
            timeRemaining={currentGame.player2_time_remaining || 60}
            isActive={currentGame.current_turn === 'player2'}
            isCurrentPlayer={currentGame.current_turn === 'player2' && playerRole === 'player2'}
          />
          <StrikeIndicator 
            strikes={Math.min(currentGame.player2_strikes || 0, 3)}
            maxStrikes={3}
            variant="compact"
          />
          <div class="w-3 h-3 bg-gray-800 rounded-full {playerRole === 'player2' && isMyTurn ? 'animate-pulse' : ''}"></div>
          <span class="font-medium">Black: {currentGame.game_state.capturedPieces.red}</span>
          {#if playerRole === 'player2'}
            <span class="text-xs text-blue-600 font-bold">(YOU)</span>
          {/if}
        </div>
      </div>
      
      <!-- Current Player Indicator -->
      <div class="text-xs text-gray-600">
        Current Player: 
        <span class="font-semibold {currentPlayer === 'red' ? 'text-red-600' : 'text-gray-800'}">
          {currentPlayer === 'red' ? 'Red' : 'Black'}
          {isMyTurn ? ' (Your Turn)' : ' (Opponent\'s Turn)'}
        </span>
      </div>
    {/if}
  </div>
  
  <!-- Checkers Board -->
  <div class="border-4 rounded-lg overflow-hidden shadow-lg transition-all duration-300 {isMyTurn ? 'border-blue-500 shadow-blue-200 shadow-xl animate-pulse' : 'border-amber-900'}">
    <div class="board-viewport">
      <div class="grid grid-cols-8 gap-0" class:rotated={playerRole === 'player2'}>
      {#each Array(8) as _, row}
        {#each Array(8) as _, col}
          <button
            class={getSquareClasses(row, col)}
            on:click={() => handleSquareClick(row, col)}
            disabled={!isMyTurn || currentGame?.game_state.gameStatus !== 'active'}
          >
            {#if board[row] && board[row][col] && board[row][col].type}
              <div class={getPieceClasses(board[row][col], row, col) + ' upright'}></div>
            {/if}

            {#if isValidMove(row, col)}
              <div class="absolute inset-0 flex items-center justify-center upright">
                <div class="move-indicator"></div>
              </div>
            {/if}
          </button>
        {/each}
      {/each}
      </div>
    </div>
  </div>
  
  <!-- Legend -->
  <div class="text-xs text-gray-600 text-center max-w-md bg-gray-50 p-3 rounded-lg">
    <p class="font-medium mb-1">How to Play:</p>
    <p>Click on your pieces to select them, then click on a highlighted square to move.</p>
    <div class="mt-2 flex items-center justify-center space-x-4">
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full" style="background-color: var(--highlight-color);"></div>
        <span>Valid moves</span>
      </div>
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 rounded border" style="border-color: var(--highlight-color);"></div>
        <span>Selected piece</span>
      </div>
    </div>
    <p class="mt-2">
      You are playing as 
      <span class="font-semibold px-2 py-1 rounded {playerRole === 'player1' ? 'bg-red-100 text-red-700' : playerRole === 'player2' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}">
        {playerRole === 'player1' ? '🔴 Red' : playerRole === 'player2' ? '⚫ Black' : '👁️ Spectator'}
      </span>
    </p>
  </div>
</div>

<style>
  :root {
    --board-light: #f0d9b5;
    --board-dark: #b58863;
    --red-piece: #c41e3a;
    --red-piece-king: #ff4d6d;
    --black-piece: #1e1e1e;
    --black-piece-king: #555555;
    --highlight-color: #00ff87;
  }

  .square.light { background-color: var(--board-light); }
  .square.dark { background-color: var(--board-dark); }

  .piece {
    width: 3rem; /* fallback, overridden by container sizing */
    height: 3rem;
    border-radius: 9999px;
    box-shadow: inset 0 -4px 6px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
  }
  .piece.player1 {
    background: radial-gradient(circle at 50% 30%, var(--red-piece-king), var(--red-piece) 70%);
  }
  .piece.player2 {
    background: radial-gradient(circle at 50% 30%, var(--black-piece-king), var(--black-piece) 70%);
  }
  .piece.selected {
    box-shadow: inset 0 0 10px rgba(0,0,0,0.3), 0 0 20px var(--highlight-color);
    outline: 3px solid var(--highlight-color);
    outline-offset: 0;
  }
  .piece.king::after {
    content: '👑';
    font-size: 1.25rem;
    line-height: 1;
    color: gold;
    text-shadow: 0 0 4px rgba(0,0,0,0.6);
  }

  .move-indicator {
    width: 40%;
    height: 40%;
    background-color: var(--highlight-color);
    opacity: 0.6;
    border-radius: 9999px;
    pointer-events: none;
  }

  .board-viewport { position: relative; }
  .board-viewport .grid { transform-origin: center; }
  .board-viewport .grid.rotated { transform: rotate(180deg); }
  .upright { transform: rotate(180deg); transform-origin: center; }
</style>
