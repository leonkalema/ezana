// Minimal Ludo rules engine (Step 1)
// Provides default config and basic legal move generation for smoke testing
// - Enter from home on 6 if entry square not occupied by own piece
// - Move along main track (0..51) wrapping around
// - Capture opponents on non-safe squares (send them home)

import type { LudoState, Move, Piece, Player, RulesConfig } from '$lib/types/ludo';

export const defaultRules: RulesConfig = {
  trackLength: 52,
  entry: {
    // Aligned to captured mapping (see defaultBoardMap.cellToIndex)
    // 'entry-red' => 11, 'entry-green' => 24, 'entry-yellow' => 37, 'entry-blue' => 50
    red: 11,
    blue: 50,
    yellow: 37,
    green: 24
  },
  // Classic safe squares: entry squares and 8 steps after each entry
  // Based on the aligned entry indices above: 11,24,37,50 -> +8 -> 19,32,45,2
  safe: [11, 19, 24, 32, 37, 45, 50, 2]
};

function wrap(pos: number, length: number): number { return ((pos % length) + length) % length; }

function piecesFlat(state: LudoState): ReadonlyArray<Piece> {
  return [...state.pieces.red, ...state.pieces.blue, ...state.pieces.yellow, ...state.pieces.green];
}

function occupiedBy(pos: number, state: LudoState): { owner: Player; members: ReadonlyArray<Piece> } | null {
  const all = piecesFlat(state).filter(p => p.state === 'track' && p.pos === pos);
  if (all.length === 0) return null;
  return { owner: all[0].player, members: all };
}

function isSafe(pos: number, cfg: RulesConfig): boolean { return cfg.safe.includes(pos); }

export function legalMovesFor(state: LudoState, player: Player, dice: number, cfg: RulesConfig = defaultRules): ReadonlyArray<Move> {
  if (dice < 1 || dice > 6) return [];
  const res: Move[] = [];
  const entry = cfg.entry[player];
  const own = state.pieces[player];

  // Enter from home on 6
  if (dice === 6) {
    const occ = occupiedBy(entry, state);
    const blockedByOwn = occ && occ.owner === player;
    if (!blockedByOwn) {
      const anyHome = own.some(p => p.state === 'home');
      if (anyHome) {
        res.push({ pieceId: own.find(p => p.state === 'home')!.id, player, from: 'home', to: entry, steps: 1 });
      }
    }
  }

  // Move pieces on track
  for (const p of own) {
    if (p.state !== 'track' || typeof p.pos !== 'number') continue;
    const to = wrap(p.pos + dice, cfg.trackLength);
    const occ = occupiedBy(to, state);
    const blockedByOwn = occ && occ.owner === player;
    if (blockedByOwn) continue;
    res.push({ pieceId: p.id, player, from: p.pos, to, steps: dice });

    // Minimal finish rule: if on entry square and roll a 6, allow finishing
    // (Note: real Ludo uses a 6-step home lane; this is a step-2 placeholder)
    if (p.pos === cfg.entry[player] && dice === 6) {
      res.push({ pieceId: p.id, player, from: p.pos, to: 'finish', steps: dice });
    }
  }

  return res;
}

export function applyMove(state: LudoState, move: Move, cfg: RulesConfig = defaultRules): LudoState {
  const { player } = move;
  const entry = cfg.entry[player];
  const updated: Record<Player, Piece[]> = {
    red: state.pieces.red.map(p => ({ ...p })),
    blue: state.pieces.blue.map(p => ({ ...p })),
    yellow: state.pieces.yellow.map(p => ({ ...p })),
    green: state.pieces.green.map(p => ({ ...p }))
  };

  const own = updated[player];
  const idx = own.findIndex(p => p.id === move.pieceId);
  if (idx === -1) return state;

  // Resolve capture if moving to opponent on non-safe square
  const toPos = typeof move.to === 'number' ? move.to : (move.to === 'finish' ? null : move.to);
  if (toPos !== null && toPos !== undefined) {
    const occ = occupiedBy(toPos, state);
    if (occ && occ.owner !== player && !isSafe(toPos, cfg)) {
      // send all opponent pieces at that square home
      const opp = updated[occ.owner];
      for (const captured of occ.members) {
        const cIdx = opp.findIndex(pp => pp.id === captured.id);
        if (cIdx !== -1) opp[cIdx] = { ...opp[cIdx], state: 'home', pos: undefined };
      }
    }
  }

  // Move own piece
  const fromPiece = own[idx];
  if (move.from === 'home') {
    own[idx] = { ...fromPiece, state: 'track', pos: entry };
  } else if (typeof move.to === 'number') {
    own[idx] = { ...fromPiece, state: 'track', pos: toPos! };
  } else if (move.to === 'finish') {
    own[idx] = { ...fromPiece, state: 'finished', pos: undefined };
  }

  return { ...state, pieces: updated };
}

export function isWin(state: LudoState, player: Player): boolean {
  return state.pieces[player].every(p => p.state === 'finished');
}

export function finishedCount(state: LudoState, player: Player): number {
  return state.pieces[player].filter(p => p.state === 'finished').length;
}
