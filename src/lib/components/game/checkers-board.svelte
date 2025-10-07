<script lang="ts">
  import { gameStore } from '$lib/stores/game.js';
  import type { Position, CheckersPiece } from '$lib/types/index.js';
  
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
  <div class="text-center mb-4">
    {#if currentGame}
      <div class="flex items-center justify-center space-x-6 text-sm mb-3">
        <div class="flex items-center space-x-2 {playerRole === 'player1' && isMyTurn ? 'bg-blue-100 px-3 py-1 rounded-full border-2 border-blue-400' : ''}">
          <div class="w-4 h-4 bg-red-500 rounded-full {playerRole === 'player1' && isMyTurn ? 'animate-pulse' : ''}"></div>
          <span class="font-medium">Red: {currentGame.game_state.capturedPieces.black}</span>
          {#if playerRole === 'player1'}
            <span class="text-xs text-blue-600 font-bold">(YOU)</span>
          {/if}
        </div>
        <div class="text-gray-400 font-bold">VS</div>
        <div class="flex items-center space-x-2 {playerRole === 'player2' && isMyTurn ? 'bg-blue-100 px-3 py-1 rounded-full border-2 border-blue-400' : ''}">
          <div class="w-4 h-4 bg-gray-800 rounded-full {playerRole === 'player2' && isMyTurn ? 'animate-pulse' : ''}"></div>
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
  <div class="text-xs text-gray-600 text-center max-w-md bg-gray-50 p-3 rounded-lg">
    <p class="font-medium mb-1">How to Play:</p>
    <p>Click on your pieces to select them, then click on a highlighted square to move.</p>
    <div class="mt-2 flex items-center justify-center space-x-4">
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
        <span>Valid moves</span>
      </div>
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 bg-blue-400 rounded border"></div>
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
