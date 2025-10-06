// Ludo domain types
// Keep file concise (<400 lines) and typed strictly

export type Player = 'red' | 'blue' | 'yellow' | 'green';

export type PieceState = 'home' | 'track' | 'finished';

export interface Piece {
  readonly id: number;
  readonly player: Player;
  readonly state: PieceState;
  readonly pos?: number; // track index 0..51 when state === 'track'
}

export type Phase = 'roll' | 'select' | 'move' | 'end';

export interface Move {
  readonly pieceId: number;
  readonly player: Player;
  readonly from: number | 'home';
  readonly to: number | 'finish' | number;
  readonly steps: number;
}

export interface LudoState {
  readonly current: Player;
  readonly phase: Phase;
  readonly dice?: number;
  readonly pieces: Record<Player, ReadonlyArray<Piece>>;
}

export interface RulesConfig {
  readonly trackLength: number; // default 52
  readonly entry: Record<Player, number>; // entry track index per player
  readonly safe: ReadonlyArray<number>; // safe squares on main track
}
