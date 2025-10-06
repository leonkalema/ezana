// Minimal turn manager for Ludo
// Phase machine: roll -> select -> move -> end

import type { LudoState, Move, Player } from '$lib/types/ludo';
import { defaultRules, legalMovesFor, applyMove } from '$lib/engine/ludo-rules';

export function nextPlayer(p: Player): Player {
  const order: Player[] = ['red', 'blue', 'yellow', 'green'];
  const i = order.indexOf(p);
  return order[(i + 1) % order.length];
}

export function onDiceRolled(state: LudoState, value: number): LudoState {
  const legal = legalMovesFor(state, state.current, value, defaultRules);
  if (legal.length === 0) {
    // No moves; end turn immediately (unless value === 6 and you want a retry rule; we keep it simple)
    return { ...state, phase: 'end', dice: value };
  }
  return { ...state, phase: 'select', dice: value };
}

export function onMoveSelected(state: LudoState, move: Move): LudoState {
  const after = applyMove(state, move, defaultRules);
  return { ...after, phase: 'end' };
}

export function finalizeTurn(state: LudoState): LudoState {
  // Extra turn on six
  if (state.dice === 6) {
    return { ...state, phase: 'roll' };
  }
  return { ...state, current: nextPlayer(state.current), phase: 'roll', dice: undefined };
}
