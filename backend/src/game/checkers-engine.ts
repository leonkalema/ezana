import { CheckersGameState, CheckersPiece, CheckersMove, Position } from '../types/index.js';

export class CheckersEngine {
  static createInitialGameState(): CheckersGameState {
    const board = this.createInitialBoard();
    return {
      board,
      currentPlayer: 'red',
      gameStatus: 'active',
      winner: null,
      moveHistory: [],
      capturedPieces: {
        red: 0,
        black: 0
      }
    };
  }

  private static createInitialBoard(): CheckersPiece[][] {
    const board: CheckersPiece[][] = Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ type: null, color: null }))
    );

    // Place black pieces (top 3 rows)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { type: 'regular', color: 'black' };
        }
      }
    }

    // Place red pieces (bottom 3 rows)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { type: 'regular', color: 'red' };
        }
      }
    }

    return board;
  }

  static isValidMove(gameState: CheckersGameState, move: CheckersMove, playerId: number, isPlayer1: boolean): boolean {
    const { board, currentPlayer } = gameState;
    const playerColor = isPlayer1 ? 'red' : 'black';

    // Check if it's the player's turn
    if (currentPlayer !== playerColor) {
      return false;
    }

    const { from, to } = move;
    
    // Check bounds
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
      return false;
    }

    const piece = board[from.row][from.col];
    const targetSquare = board[to.row][to.col];

    // Check if there's a piece at the from position and it belongs to the current player
    if (!piece.type || piece.color !== playerColor) {
      return false;
    }

    // Check if target square is empty
    if (targetSquare.type !== null) {
      return false;
    }

    // Check if move is to a dark square
    if ((to.row + to.col) % 2 === 0) {
      return false;
    }

    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);

    // Regular move (one diagonal square)
    if (Math.abs(rowDiff) === 1 && colDiff === 1) {
      // Check direction for regular pieces
      if (piece.type === 'regular') {
        const correctDirection = playerColor === 'red' ? rowDiff < 0 : rowDiff > 0;
        if (!correctDirection) {
          return false;
        }
      }
      return true;
    }

    // Jump move (two diagonal squares)
    if (Math.abs(rowDiff) === 2 && colDiff === 2) {
      const middleRow = from.row + rowDiff / 2;
      const middleCol = from.col + (to.col - from.col) / 2;
      const middlePiece = board[middleRow][middleCol];

      // Check if there's an opponent piece to jump over
      if (!middlePiece.type || middlePiece.color === playerColor) {
        return false;
      }

      // Check direction for regular pieces
      if (piece.type === 'regular') {
        const correctDirection = playerColor === 'red' ? rowDiff < 0 : rowDiff > 0;
        if (!correctDirection) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  static applyMove(gameState: CheckersGameState, move: CheckersMove): CheckersGameState {
    const newGameState = JSON.parse(JSON.stringify(gameState)) as CheckersGameState;
    const { board } = newGameState;
    const { from, to } = move;

    const piece = board[from.row][from.col];
    
    // Move the piece
    board[to.row][to.col] = piece;
    board[from.row][from.col] = { type: null, color: null };

    // Handle captures
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const middleRow = from.row + rowDiff / 2;
      const middleCol = from.col + colDiff / 2;
      const capturedPiece = board[middleRow][middleCol];
      
      // Remove captured piece
      board[middleRow][middleCol] = { type: null, color: null };
      
      // Update captured pieces count
      if (capturedPiece.color === 'red') {
        newGameState.capturedPieces.red++;
      } else {
        newGameState.capturedPieces.black++;
      }
    }

    // Check for king promotion
    if (piece.type === 'regular') {
      if ((piece.color === 'red' && to.row === 0) || (piece.color === 'black' && to.row === 7)) {
        board[to.row][to.col].type = 'king';
        move.isKingMove = true;
      }
    }

    // Add move to history
    move.timestamp = new Date();
    newGameState.moveHistory.push(move);

    // Switch turns
    newGameState.currentPlayer = newGameState.currentPlayer === 'red' ? 'black' : 'red';

    // Check for game end conditions
    this.checkGameEnd(newGameState);

    return newGameState;
  }

  private static checkGameEnd(gameState: CheckersGameState): void {
    const { board, currentPlayer } = gameState;
    
    // Count pieces and check for valid moves
    let redPieces = 0;
    let blackPieces = 0;
    let hasValidMoves = false;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece.type) {
          if (piece.color === 'red') redPieces++;
          if (piece.color === 'black') blackPieces++;

          // Check if current player has valid moves
          if (piece.color === currentPlayer && !hasValidMoves) {
            hasValidMoves = this.hasValidMovesFromPosition(gameState, { row, col });
          }
        }
      }
    }

    // Game ends if no pieces left or no valid moves
    if (redPieces === 0) {
      gameState.gameStatus = 'completed';
      gameState.winner = 'black';
    } else if (blackPieces === 0) {
      gameState.gameStatus = 'completed';
      gameState.winner = 'red';
    } else if (!hasValidMoves) {
      gameState.gameStatus = 'completed';
      gameState.winner = currentPlayer === 'red' ? 'black' : 'red';
    }
  }

  private static hasValidMovesFromPosition(gameState: CheckersGameState, position: Position): boolean {
    const { board } = gameState;
    const piece = board[position.row][position.col];
    
    if (!piece.type) return false;

    // Check all possible moves from this position
    const directions = piece.type === 'king' 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [rowDir, colDir] of directions) {
      // Check regular move
      const newRow = position.row + rowDir;
      const newCol = position.col + colDir;
      
      if (this.isValidPosition({ row: newRow, col: newCol })) {
        const targetSquare = board[newRow][newCol];
        if (!targetSquare.type) {
          return true; // Found a valid regular move
        }
        
        // Check jump move
        const jumpRow = position.row + rowDir * 2;
        const jumpCol = position.col + colDir * 2;
        
        if (this.isValidPosition({ row: jumpRow, col: jumpCol })) {
          const jumpSquare = board[jumpRow][jumpCol];
          if (!jumpSquare.type && targetSquare.color !== piece.color) {
            return true; // Found a valid jump move
          }
        }
      }
    }

    return false;
  }

  private static isValidPosition(position: Position): boolean {
    return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
  }

  static getValidMoves(gameState: CheckersGameState, position: Position): Position[] {
    const validMoves: Position[] = [];
    const { board } = gameState;
    const piece = board[position.row][position.col];
    
    if (!piece.type) return validMoves;

    const directions = piece.type === 'king' 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [rowDir, colDir] of directions) {
      // Check regular move
      const newRow = position.row + rowDir;
      const newCol = position.col + colDir;
      
      if (this.isValidPosition({ row: newRow, col: newCol })) {
        const targetSquare = board[newRow][newCol];
        if (!targetSquare.type) {
          validMoves.push({ row: newRow, col: newCol });
        } else if (targetSquare.color !== piece.color) {
          // Check jump move
          const jumpRow = position.row + rowDir * 2;
          const jumpCol = position.col + colDir * 2;
          
          if (this.isValidPosition({ row: jumpRow, col: jumpCol })) {
            const jumpSquare = board[jumpRow][jumpCol];
            if (!jumpSquare.type) {
              validMoves.push({ row: jumpRow, col: jumpCol });
            }
          }
        }
      }
    }

    return validMoves;
  }
}
