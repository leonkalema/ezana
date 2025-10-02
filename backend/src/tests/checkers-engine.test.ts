import { describe, it, expect } from 'vitest';
import { CheckersEngine } from '../game/checkers-engine.js';
import { CheckersGameState, CheckersMove } from '../types/index.js';

describe('CheckersEngine', () => {
  describe('createInitialGameState', () => {
    it('should create a valid initial game state', () => {
      const gameState = CheckersEngine.createInitialGameState();
      
      expect(gameState.currentPlayer).toBe('red');
      expect(gameState.gameStatus).toBe('active');
      expect(gameState.winner).toBeNull();
      expect(gameState.moveHistory).toHaveLength(0);
      expect(gameState.capturedPieces.red).toBe(0);
      expect(gameState.capturedPieces.black).toBe(0);
      expect(gameState.board).toHaveLength(8);
      expect(gameState.board[0]).toHaveLength(8);
    });

    it('should place pieces correctly on the initial board', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const { board } = gameState;

      // Check black pieces (top 3 rows)
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row + col) % 2 === 1) {
            expect(board[row][col].type).toBe('regular');
            expect(board[row][col].color).toBe('black');
          } else {
            expect(board[row][col].type).toBeNull();
            expect(board[row][col].color).toBeNull();
          }
        }
      }

      // Check empty middle rows
      for (let row = 3; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          expect(board[row][col].type).toBeNull();
          expect(board[row][col].color).toBeNull();
        }
      }

      // Check red pieces (bottom 3 rows)
      for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row + col) % 2 === 1) {
            expect(board[row][col].type).toBe('regular');
            expect(board[row][col].color).toBe('red');
          } else {
            expect(board[row][col].type).toBeNull();
            expect(board[row][col].color).toBeNull();
          }
        }
      }
    });
  });

  describe('isValidMove', () => {
    it('should allow valid regular moves for red pieces', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        timestamp: new Date()
      };

      const isValid = CheckersEngine.isValidMove(gameState, move, 1, true);
      expect(isValid).toBe(true);
    });

    it('should reject moves in wrong direction for regular pieces', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 6, col: 1 }, // Moving backwards
        timestamp: new Date()
      };

      const isValid = CheckersEngine.isValidMove(gameState, move, 1, true);
      expect(isValid).toBe(false);
    });

    it('should reject moves when it is not the player\'s turn', () => {
      const gameState = CheckersEngine.createInitialGameState();
      gameState.currentPlayer = 'black'; // Black's turn
      
      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        timestamp: new Date()
      };

      const isValid = CheckersEngine.isValidMove(gameState, move, 1, true); // Red player trying to move
      expect(isValid).toBe(false);
    });

    it('should reject moves to occupied squares', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 5, col: 2 }, // Occupied by another red piece
        timestamp: new Date()
      };

      const isValid = CheckersEngine.isValidMove(gameState, move, 1, true);
      expect(isValid).toBe(false);
    });

    it('should reject moves to light squares', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 0 }, // Light square
        timestamp: new Date()
      };

      const isValid = CheckersEngine.isValidMove(gameState, move, 1, true);
      expect(isValid).toBe(false);
    });
  });

  describe('applyMove', () => {
    it('should apply a valid move and switch turns', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        timestamp: new Date()
      };

      const newGameState = CheckersEngine.applyMove(gameState, move);

      expect(newGameState.board[5][0].type).toBeNull();
      expect(newGameState.board[4][1].type).toBe('regular');
      expect(newGameState.board[4][1].color).toBe('red');
      expect(newGameState.currentPlayer).toBe('black');
      expect(newGameState.moveHistory).toHaveLength(1);
    });

    it('should handle piece capture', () => {
      const gameState = CheckersEngine.createInitialGameState();
      
      // Set up a capture scenario
      gameState.board[4][1] = { type: 'regular', color: 'black' };
      gameState.board[3][2] = { type: null, color: null };

      const move: CheckersMove = {
        from: { row: 5, col: 0 },
        to: { row: 3, col: 2 },
        timestamp: new Date()
      };

      const newGameState = CheckersEngine.applyMove(gameState, move);

      expect(newGameState.board[5][0].type).toBeNull();
      expect(newGameState.board[4][1].type).toBeNull(); // Captured piece removed
      expect(newGameState.board[3][2].type).toBe('regular');
      expect(newGameState.board[3][2].color).toBe('red');
      expect(newGameState.capturedPieces.black).toBe(1);
    });

    it('should promote pieces to kings when reaching the end', () => {
      const gameState = CheckersEngine.createInitialGameState();
      
      // Set up a piece near promotion
      gameState.board[1][0] = { type: 'regular', color: 'red' };
      gameState.board[0][1] = { type: null, color: null };

      const move: CheckersMove = {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 1 },
        timestamp: new Date()
      };

      const newGameState = CheckersEngine.applyMove(gameState, move);

      expect(newGameState.board[0][1].type).toBe('king');
      expect(newGameState.board[0][1].color).toBe('red');
      expect(move.isKingMove).toBe(true);
    });
  });

  describe('getValidMoves', () => {
    it('should return valid moves for a piece', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const validMoves = CheckersEngine.getValidMoves(gameState, { row: 5, col: 0 });

      expect(validMoves).toHaveLength(1);
      expect(validMoves[0]).toEqual({ row: 4, col: 1 });
    });

    it('should return empty array for invalid position', () => {
      const gameState = CheckersEngine.createInitialGameState();
      const validMoves = CheckersEngine.getValidMoves(gameState, { row: 3, col: 3 }); // Empty square

      expect(validMoves).toHaveLength(0);
    });

    it('should include jump moves when available', () => {
      const gameState = CheckersEngine.createInitialGameState();
      
      // Set up a jump scenario
      gameState.board[4][1] = { type: 'regular', color: 'black' };
      gameState.board[3][2] = { type: null, color: null };

      const validMoves = CheckersEngine.getValidMoves(gameState, { row: 5, col: 0 });

      expect(validMoves).toContainEqual({ row: 3, col: 2 }); // Jump move
    });
  });
});
