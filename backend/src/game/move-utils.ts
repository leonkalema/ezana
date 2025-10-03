import type { CheckersGameState, Position } from '../types/index.js';

export interface ApplyPathResult {
  state: CheckersGameState;
  captured: Position[];
}

function isValidPos(p: Position): boolean {
  return p.row >= 0 && p.row < 8 && p.col >= 0 && p.col < 8;
}

function cloneState(state: CheckersGameState): CheckersGameState {
  return JSON.parse(JSON.stringify(state)) as CheckersGameState;
}

function colorAt(state: CheckersGameState, p: Position): 'red' | 'black' | null {
  if (!isValidPos(p)) return null;
  const row = state.board[p.row];
  if (!row) return null;
  const sq = row[p.col];
  return sq && sq.color ? sq.color : null;
}

function typeAt(state: CheckersGameState, p: Position): 'regular' | 'king' | null {
  if (!isValidPos(p)) return null;
  const row = state.board[p.row];
  if (!row) return null;
  const sq = row[p.col];
  return sq && sq.type ? sq.type : null;
}

function setEmpty(state: CheckersGameState, p: Position): void {
  if (!isValidPos(p)) return;
  state.board[p.row]![p.col] = { type: null, color: null } as any;
}

function setPiece(state: CheckersGameState, p: Position, type: 'regular' | 'king', color: 'red' | 'black'): void {
  if (!isValidPos(p)) return;
  state.board[p.row]![p.col] = { type, color } as any;
}

function diagonalStep(a: Position, b: Position): { rowStep: number; colStep: number; distance: number } | null {
  const rowDiff = b.row - a.row;
  const colDiff = b.col - a.col;
  if (Math.abs(rowDiff) !== Math.abs(colDiff)) return null;
  const distance = Math.abs(rowDiff);
  if (distance < 1) return null;
  return { rowStep: rowDiff > 0 ? 1 : -1, colStep: colDiff > 0 ? 1 : -1, distance };
}

function collectCapturedAlong(state: CheckersGameState, from: Position, to: Position, moverColor: 'red' | 'black', isKing: boolean): Position[] | null {
  const step = diagonalStep(from, to);
  if (!step) return null;
  const { rowStep, colStep, distance } = step;

  // For regular pieces, only allow distance 1 (move) or distance 2 (single capture)
  // For kings, allow long distances but at most one opponent piece per segment
  let seenOpponent = 0;
  const captured: Position[] = [];

  let r = from.row + rowStep;
  let c = from.col + colStep;
  for (let i = 1; i <= distance; i++) {
    if (!isValidPos({ row: r, col: c })) return null;
    const sq = state.board[r] ? state.board[r]![c] : undefined;
    const isLast = i === distance;

    if (isLast) {
      // destination must be empty
      if (sq?.type !== null) return null;
      break;
    }

    if (sq?.type !== null) {
      if (sq.color === moverColor) return null; // blocked by own piece
      // opponent piece
      seenOpponent++;
      captured.push({ row: r, col: c });
      // For regular piece, capture must be exactly at i === 1 and land at i === 2
      if (!isKing) {
        if (i !== 1 || distance !== 2) return null;
      }
    }

    r += rowStep;
    c += colStep;
  }

  if (seenOpponent === 0) {
    // Non-capture segment: allowed only if king (long move) or distance 1 forward for regular
    return [];
  }

  if (!isKing && seenOpponent === 1) return captured;
  if (isKing && seenOpponent === 1) return captured;
  // More than one opponent on the path in a single segment is not allowed
  return null;
}

export function applyMovePath(stateIn: CheckersGameState, path: Position[], moverIsPlayer1: boolean): ApplyPathResult | null {
  if (!path || path.length < 2) return null;
  const state = cloneState(stateIn);
  const from = path[0];
  const pieceType = typeAt(state, from);
  const moverColor = moverIsPlayer1 ? 'red' : 'black';
  if (!pieceType) return null;
  if (colorAt(state, from) !== moverColor) return null;
  let isKing = pieceType === 'king';
  const capturedAll: Position[] = [];

  // Remove piece from start; we will place it at the end of each segment
  const movingPiece = { type: pieceType, color: moverColor } as const;
  setEmpty(state, from);
  let current = from;

  for (let i = 1; i < path.length; i++) {
    const to = path[i];
    if (!to) return null;
    if (!isValidPos(to)) return null;
    const segCaptured = collectCapturedAlong(state, current, to, moverColor, isKing);
    if (segCaptured === null) return null; // illegal segment

    // Move piece to intermediate landing
    setPiece(state, to, isKing ? 'king' : 'regular', moverColor);

    // Remove captured pieces for this segment
    for (const cap of segCaptured) {
      const victim = state.board[cap.row]?.[cap.col];
      if (victim?.type) {
        setEmpty(state, cap);
        if (victim.color === 'red') state.capturedPieces.red++;
        else state.capturedPieces.black++;
        capturedAll.push(cap);
      }
    }

    // Handle promotion if applicable
    if (!isKing) {
      if ((moverColor === 'red' && to.row === 0) || (moverColor === 'black' && to.row === 7)) {
        isKing = true;
        setPiece(state, to, 'king', moverColor);
      }
    }

    // Prepare for next segment: treat `to` as current, clear prior square already cleared
    current = to;
  }

  // Update current player
  state.currentPlayer = state.currentPlayer === 'red' ? 'black' : 'red';

  // Add to history (single consolidated move)
  const start = path[0]!;
  const end = path[path.length - 1]!;
  state.moveHistory.push({ from: start, to: end, capturedPieces: capturedAll, timestamp: new Date() } as any);

  return { state, captured: capturedAll };
}
