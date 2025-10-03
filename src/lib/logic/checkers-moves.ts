import type { Position } from '../types/index.js';

export function getValidMovesForPosition(gameState: any, position: Position): Position[] {
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
    // For regular pieces: check single step moves and longer captures
    const maxDistance = piece.type === 'king' ? 7 : 7;

    for (let distance = 1; distance <= maxDistance; distance++) {
      const newRow = position.row + rowDir * distance;
      const newCol = position.col + colDir * distance;

      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) {
        break; // Out of bounds
      }

      const targetSquare = board[newRow]?.[newCol];
      if (!targetSquare) break;

      // For regular pieces, only allow forward moves for distance 1 (non-capture)
      if (piece.type === 'regular' && distance === 1) {
        const isForwardDirection = piece.color === 'red' ? rowDir < 0 : rowDir > 0;
        if (!isForwardDirection) {
          // Still allow backward captures; just skip backward single-step moves
          // but continue scanning to check for possible capture at distance 2.
          // Do not continue/break here; we still need to inspect capture case below.
        }
      }

      // Empty target square handling
      if (!targetSquare.type) {
        // Non-capture moves
        if (distance === 1) {
          // Only allow if forward or king
          if (piece.type === 'king') validMoves.push({ row: newRow, col: newCol });
          else {
            const isForward = piece.color === 'red' ? rowDir < 0 : rowDir > 0;
            if (isForward) validMoves.push({ row: newRow, col: newCol });
          }
        } else {
          // Longer empty squares are only valid if path-based capture rules allow (kings);
          // For regular pieces we support long capture sequences via isValidPath below.
          if (isValidPath(board, position, { row: newRow, col: newCol }, piece.color, piece.type === 'king')) {
            validMoves.push({ row: newRow, col: newCol });
          }
        }
      }

      // Capture handling: encountered a piece along the ray
      if (targetSquare.type !== null) {
        const isOpponent = targetSquare.color !== piece.color;
        if (!isOpponent) {
          // Own piece blocks immediately
          break;
        }
        // Opponent encountered
        if (piece.type === 'regular') {
          // Regular piece: only allow immediate jump (distance must be 2)
          if (distance === 1) {
            const jumpRow = position.row + rowDir * 2;
            const jumpCol = position.col + colDir * 2;
            if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
              const landing = board[jumpRow]?.[jumpCol];
              if (landing && landing.type === null) {
                validMoves.push({ row: jumpRow, col: jumpCol });
              }
            }
          }
          // After encountering a piece, regular cannot look further in this ray
          break;
        } else {
          // King: allow flying capture — any empty square beyond the single opponent
          let jumpDist = distance + 1;
          while (true) {
            const landRow = position.row + rowDir * jumpDist;
            const landCol = position.col + colDir * jumpDist;
            if (landRow < 0 || landRow >= 8 || landCol < 0 || landCol >= 8) break;
            const landSq = board[landRow]?.[landCol];
            if (!landSq) break;
            if (landSq.type === null) {
              validMoves.push({ row: landRow, col: landCol });
              jumpDist++;
              continue;
            }
            // Blocked beyond
            break;
          }
          // Only one opponent allowed along the path; stop this direction after processing
          break;
        }
      }
    }
  }

  return validMoves;
}

export function isValidPath(board: any[][], from: Position, to: Position, playerColor: string, isKing: boolean): boolean {
  const rowStep = to.row > from.row ? 1 : -1;
  const colStep = to.col > from.col ? 1 : -1;
  const distance = Math.abs(to.row - from.row);

  // Special case for basic capture (distance 2)
  if (distance === 2) {
    const middleRow = from.row + rowStep;
    const middleCol = from.col + colStep;
    const middlePiece = board[middleRow]?.[middleCol];
    if (!middlePiece?.type || middlePiece.color === playerColor) return false;
    return true;
  }

  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  let captureCount = 0;

  for (let i = 1; i < distance; i++) {
    const square = board[currentRow]?.[currentCol];

    if (square?.type !== null) {
      if (square?.color === playerColor) return false; // own piece blocks
      captureCount++;
    }

    currentRow += rowStep;
    currentCol += colStep;
  }

  if (captureCount === 0) {
    // Regular move: only distance 1 for regular pieces; kings can move many
    return distance === 1 || isKing;
  }

  // Captures allowed
  return true;
}
