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
          board[row]![col] = { type: 'regular', color: 'black' };
        }
      }
    }

    // Place red pieces (bottom 3 rows)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row]![col] = { type: 'regular', color: 'red' };
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

    const piece = board[from.row]?.[from.col];
    const targetSquare = board[to.row]?.[to.col];

    // Check if there's a piece at the from position and it belongs to the current player
    if (!piece?.type || piece.color !== playerColor) {
      return false;
    }

    // Check if target square is empty
    if (targetSquare?.type !== null) {
      return false;
    }

    // Check if move is to a dark square
    if ((to.row + to.col) % 2 === 0) {
      return false;
    }

    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    // Must be diagonal move
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) {
      return false;
    }

    const distance = Math.abs(rowDiff);

    // Handle basic moves and captures
    if (distance === 1) {
      // Regular single-step move - must be forward for regular pieces
      if (piece.type === 'regular') {
        const correctDirection = playerColor === 'red' ? rowDiff < 0 : rowDiff > 0;
        if (!correctDirection) {
          return false;
        }
      }
      return true; // Valid single step move
    }
    
    if (distance === 2) {
      // Basic capture - check for opponent piece in middle
      const middleRow = from.row + rowDiff / 2;
      const middleCol = from.col + (to.col - from.col) / 2;
      const middlePiece = board[middleRow]?.[middleCol];

      // Must have opponent piece to jump over
      if (!middlePiece?.type || middlePiece.color === playerColor) {
        return false;
      }

      // Regular pieces can capture in any direction (including backwards)
      return true;
    }

    // For longer distances, use enhanced path validation
    return this.isValidPath(board, from, to, playerColor, piece.type === 'king');
  }

  private static pathHasCaptures(board: CheckersPiece[][], from: Position, to: Position, playerColor: 'red' | 'black'): boolean {
    const rowStep = to.row > from.row ? 1 : -1;
    const colStep = to.col > from.col ? 1 : -1;
    const distance = Math.abs(to.row - from.row);

    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;

    // Check each square along the path for opponent pieces
    for (let i = 1; i < distance; i++) {
      const square = board[currentRow]?.[currentCol];
      
      if (square?.type !== null && square?.color !== playerColor) {
        return true; // Found an opponent piece to capture
      }
      
      currentRow += rowStep;
      currentCol += colStep;
    }

    return false;
  }

  private static isValidPath(board: CheckersPiece[][], from: Position, to: Position, playerColor: 'red' | 'black', isKing: boolean): boolean {
    const rowStep = to.row > from.row ? 1 : -1;
    const colStep = to.col > from.col ? 1 : -1;
    const distance = Math.abs(to.row - from.row);

    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    let captureCount = 0;
    let lastCaptureRow = -1;
    let lastCaptureCol = -1;

    // Check each square along the path
    for (let i = 1; i < distance; i++) {
      const square = board[currentRow]?.[currentCol];
      
      if (square?.type !== null) {
        // There's a piece in the path
        if (square?.color === playerColor) {
          // Can't jump over own pieces
          return false;
        } else {
          // Opponent piece - can capture it
          captureCount++;
          lastCaptureRow = currentRow;
          lastCaptureCol = currentCol;
          
          // For kings: can have multiple captures with gaps
          // For regular pieces: must be consecutive captures
          if (!isKing && captureCount > 1) {
            // Check if this capture is adjacent to the last one
            const gapBetweenCaptures = Math.abs(currentRow - lastCaptureRow);
            if (gapBetweenCaptures > 2) {
              return false;
            }
          }
        }
      }
      
      currentRow += rowStep;
      currentCol += colStep;
    }

    // If no captures, it's a regular move (only allowed for distance 1, or kings can move multiple squares)
    if (captureCount === 0) {
      return distance === 1 || isKing;
    }

    // If there are captures, the move is valid
    return true;
  }

  static applyMove(gameState: CheckersGameState, move: CheckersMove): CheckersGameState {
    const newGameState = JSON.parse(JSON.stringify(gameState)) as CheckersGameState;
    const { board } = newGameState;
    const { from, to } = move;

    const piece = board[from.row]?.[from.col];
    if (!piece) {
      throw new Error('No piece at source position');
    }
    
    // Move the piece
    board[to.row][to.col] = piece;
    board[from.row][from.col] = { type: null, color: null };

    // Handle multiple captures along the path
    const capturedPositions = this.getCapturedPieces(board, from, to);
    move.capturedPieces = capturedPositions;
    
    // Remove all captured pieces and update count
    for (const capturePos of capturedPositions) {
      const capturedPiece = board[capturePos.row]?.[capturePos.col];
      if (capturedPiece?.type) {
        board[capturePos.row][capturePos.col] = { type: null, color: null };
        
        // Update captured pieces count
        if (capturedPiece.color === 'red') {
          newGameState.capturedPieces.red++;
        } else {
          newGameState.capturedPieces.black++;
        }
      }
    }

    // Check for king promotion
    if (piece.type === 'regular') {
      if ((piece.color === 'red' && to.row === 0) || (piece.color === 'black' && to.row === 7)) {
        board[to.row][to.col]!.type = 'king';
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

  private static getCapturedPieces(board: CheckersPiece[][], from: Position, to: Position): Position[] {
    const capturedPositions: Position[] = [];
    const rowStep = to.row > from.row ? 1 : -1;
    const colStep = to.col > from.col ? 1 : -1;
    const distance = Math.abs(to.row - from.row);

    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;

    // Check each square along the path for captures
    for (let i = 1; i < distance; i++) {
      const square = board[currentRow]?.[currentCol];
      
      if (square?.type) {
        capturedPositions.push({ row: currentRow, col: currentCol });
      }
      
      currentRow += rowStep;
      currentCol += colStep;
    }

    return capturedPositions;
  }

  private static checkGameEnd(gameState: CheckersGameState): void {
    const { board, currentPlayer } = gameState;

    // Count pieces and check for valid moves for both colors
    let redPieces = 0;
    let blackPieces = 0;
    let redHasMoves = false;
    let blackHasMoves = false;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece.type) {
          if (piece.color === 'red') {
            redPieces++;
            if (!redHasMoves) redHasMoves = this.hasValidMovesFromPosition(gameState, { row, col });
          } else if (piece.color === 'black') {
            blackPieces++;
            if (!blackHasMoves) blackHasMoves = this.hasValidMovesFromPosition(gameState, { row, col });
          }
        }
      }
    }

    // Win by elimination
    if (redPieces === 0) {
      gameState.gameStatus = 'completed';
      gameState.winner = 'black';
      return;
    }
    if (blackPieces === 0) {
      gameState.gameStatus = 'completed';
      gameState.winner = 'red';
      return;
    }

    // Draw if both sides have no legal moves (mutual blockade)
    if (!redHasMoves && !blackHasMoves) {
      gameState.gameStatus = 'completed';
      gameState.winner = null;
      return;
    }

    // Otherwise, if current player has no moves, opponent wins (standard rule)
    if (currentPlayer === 'red' && !redHasMoves) {
      gameState.gameStatus = 'completed';
      gameState.winner = 'black';
      return;
    }
    if (currentPlayer === 'black' && !blackHasMoves) {
      gameState.gameStatus = 'completed';
      gameState.winner = 'red';
      return;
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
    const piece = board[position.row]?.[position.col];
    
    if (!piece?.type) return validMoves;

    const directions = piece.type === 'king' 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Allow all directions for captures

    for (const direction of directions) {
      const rowDir = direction[0];
      const colDir = direction[1];
      if (rowDir === undefined || colDir === undefined) continue;
      
      // For kings: check multiple distances
      // For regular pieces: check single step moves and captures
      const maxDistance = piece.type === 'king' ? 7 : 7; // Allow long moves for captures
      
      for (let distance = 1; distance <= maxDistance; distance++) {
        const newRow = position.row + rowDir * distance;
        const newCol = position.col + colDir * distance;
        
        if (!this.isValidPosition({ row: newRow, col: newCol })) {
          break; // Out of bounds
        }

        const targetSquare = board[newRow]?.[newCol];
        if (!targetSquare) break;

        // For regular pieces, only allow forward moves for distance 1 (non-capture)
        if (piece.type === 'regular' && distance === 1) {
          const isForwardDirection = piece.color === 'red' ? rowDir < 0 : rowDir > 0;
          if (!isForwardDirection) {
            continue; // Skip backward moves for regular pieces (unless capturing)
          }
        }

        // Check if this move would be valid
        const testMove: CheckersMove = {
          from: position,
          to: { row: newRow, col: newCol },
          timestamp: new Date()
        };

        if (this.isValidMove(gameState, testMove, 0, piece.color === 'red')) {
          validMoves.push({ row: newRow, col: newCol });
        }

        // If we hit a piece, we can't continue in this direction
        if (targetSquare.type !== null) {
          break;
        }
      }
    }

    return validMoves;
  }
}
