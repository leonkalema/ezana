<script lang="ts">
  import { gameStore } from '$lib/stores/game.js';
  import type { Position, CheckersPiece } from '$lib/types/index.js';
  
  $: ({ currentGame, playerRole, selectedSquare, validMoves } = $gameStore);
  $: board = currentGame?.game_state.board || [];
  $: currentPlayer = currentGame?.game_state.currentPlayer;
  $: isMyTurn = currentGame && (
    (playerRole === 'player1' && currentPlayer === 'red') ||
    (playerRole === 'player2' && currentPlayer === 'black')
  );
  
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
  
  function getPieceColor(piece: CheckersPiece): string {
    if (!piece.type) return '';
    return piece.color === 'red' ? 'bg-red-500' : 'bg-gray-800';
  }
  
  function getPieceTextColor(piece: CheckersPiece): string {
    if (!piece.type) return '';
    return piece.color === 'red' ? 'text-white' : 'text-white';
  }
  
  function getSquareClasses(row: number, col: number): string {
    let classes = 'w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center relative cursor-pointer transition-all duration-200 ';
    
    if (isDarkSquare(row, col)) {
      classes += 'bg-amber-800 ';
      
      if (isSelected(row, col)) {
        classes += 'ring-4 ring-blue-400 ';
      } else if (isValidMove(row, col)) {
        classes += 'ring-2 ring-green-400 ';
      }
    } else {
      classes += 'bg-amber-100 ';
    }
    
    if (isMyTurn && isDarkSquare(row, col)) {
      classes += 'hover:bg-amber-700 ';
    }
    
    return classes;
  }
</script>

<div class="flex flex-col items-center space-y-4">
  <!-- Game Status -->
  <div class="text-center mb-2">
    {#if currentGame}
      <div class="flex items-center justify-center space-x-4 text-sm">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Red: {currentGame.game_state.capturedPieces.black}</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-gray-800 rounded-full"></div>
          <span>Black: {currentGame.game_state.capturedPieces.red}</span>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Checkers Board -->
  <div class="border-4 border-amber-900 rounded-lg overflow-hidden shadow-lg">
    <div class="grid grid-cols-8 gap-0">
      {#each Array(8) as _, row}
        {#each Array(8) as _, col}
          <button
            class={getSquareClasses(row, col)}
            on:click={() => handleSquareClick(row, col)}
            disabled={!isMyTurn || currentGame?.game_state.gameStatus !== 'active'}
          >
            {#if board[row] && board[row][col] && board[row][col].type}
              <div class={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md ${getPieceColor(board[row][col])} ${getPieceTextColor(board[row][col])}`}>
                {#if board[row][col].type === 'king'}
                  <svg class="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </div>
            {/if}
            
            <!-- Valid move indicator -->
            {#if isValidMove(row, col)}
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-3 h-3 bg-green-400 rounded-full opacity-75"></div>
              </div>
            {/if}
          </button>
        {/each}
      {/each}
    </div>
  </div>
  
  <!-- Legend -->
  <div class="text-xs text-gray-600 text-center max-w-md">
    <p>Click on your pieces to select them, then click on a highlighted square to move.</p>
    <p class="mt-1">
      You are playing as 
      <span class="font-semibold">
        {playerRole === 'player1' ? 'Red' : playerRole === 'player2' ? 'Black' : 'Spectator'}
      </span>
    </p>
  </div>
</div>
