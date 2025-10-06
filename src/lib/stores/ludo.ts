import { writable, type Writable } from 'svelte/store';
import type { LudoState, Move, Piece, Player } from '$lib/types/ludo';
import { defaultRules, legalMovesFor, applyMove } from '$lib/engine/ludo-rules';
import { onDiceRolled, onMoveSelected, finalizeTurn } from '$lib/engine/turn-manager';

export interface LudoStoreState {
  readonly state: LudoState;
  readonly legalMoves: ReadonlyArray<Move>;
}

function toPiece(player: Player, raw: any): Piece {
  if (raw.position === 'home') return { id: raw.id, player, state: 'home' };
  if (raw.position === 'path') return { id: raw.id, player, state: 'track', pos: Number(raw.pathPosition) || 0 };
  return { id: raw.id, player, state: 'home' };
}

function createInitial(): LudoStoreState {
  const base: LudoState = {
    current: 'red',
    phase: 'roll',
    pieces: { red: [], blue: [], yellow: [], green: [] }
  };
  return { state: base, legalMoves: [] };
}

function recalc(state: LudoState, dice: number | undefined): LudoStoreState {
  const legal = typeof dice === 'number' ? legalMovesFor(state, state.current, dice, defaultRules) : [];
  return { state, legalMoves: legal };
}

function createLudoStore() {
  const inner: Writable<LudoStoreState> = writable(createInitial());

  function setState(next: LudoState, dice?: number): void {
    inner.update(() => recalc(next, dice));
  }

  return {
    subscribe: inner.subscribe,

    initFromMock(mock: any): void {
      const next: LudoState = {
        current: 'red',
        phase: 'roll',
        pieces: {
          red: mock.pieces.red.map((p: any) => toPiece('red', p)),
          blue: mock.pieces.blue.map((p: any) => toPiece('blue', p)),
          yellow: mock.pieces.yellow.map((p: any) => toPiece('yellow', p)),
          green: mock.pieces.green.map((p: any) => toPiece('green', p))
        }
      };
      setState(next);
    },

    setCurrent(player: Player): void {
      inner.update((s) => ({ ...s, state: { ...s.state, current: player } }));
    },

    setDice(value: number): void {
      inner.update((s) => recalc(s.state, value));
    },

    apply(move: Move, dice?: number): void {
      inner.update((s) => recalc(applyMove(s.state, move, defaultRules), dice));
    },

    acceptDice(value: number): void {
      inner.update((s) => {
        const next = onDiceRolled({ ...s.state }, value);
        return recalc(next, value);
      });
    },

    selectApply(move: Move): void {
      inner.update((s) => {
        const next = onMoveSelected({ ...s.state }, move);
        return recalc(next, s.state.dice);
      });
    },

    endTurn(): void {
      inner.update((s) => {
        const next = finalizeTurn({ ...s.state });
        return recalc(next, undefined);
      });
    }
  };
}

export const ludoStore = createLudoStore();
