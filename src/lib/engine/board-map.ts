// Board mapping for Ludo
// Maps visual board cells to canonical track indices (0..51),
// marks safe squares, and defines entry and finish-lane indices per player.
// Keep this file <400 lines and strongly typed.

import type { Player } from '$lib/types/ludo';

export interface BoardMap {
  readonly trackLength: number; // 52
  readonly entry: Record<Player, number>;
  readonly safe: ReadonlyArray<number>;
  // Optional mapping from your board cell IDs (like 't1','l3','r14','b6') to track indices
  readonly cellToIndex: Readonly<Record<string, number>>;
  // Finish lanes are logical per-player arrays of lane step indices [0..5]
  // These are NOT on the main 0..51 track. You decide how to render them.
  readonly finishLane: Record<Player, ReadonlyArray<number>>;
}

// Canonical Ludo defaults (match defaultRules in ludo-rules.ts)
export const defaultBoardMap: BoardMap = {
  trackLength: 52,
  entry: {
    // Aligned to captured mapping (cellToIndex):
    // 'entry-red' => 11, 'entry-green' => 24, 'entry-yellow' => 37, 'entry-blue' => 50
    red: 11,
    blue: 50,
    yellow: 37,
    green: 24
  },
  // Classic safe squares: each player's entry and the squares 8 steps after each entry
  safe: [0, 8, 13, 21, 26, 34, 39, 47],

  // IMPORTANT: Fill this map to reflect your UI grid.
  // Keys should be the IDs you emit from the board (e.g., 't1','l3','r14','b6').
  // Values are canonical indices in [0..51] going clockwise.
  // Leave empty if you do not rely on string IDs.
  cellToIndex: {
    "blue-lane-5": 0,
    "b10": 1,
    "b7": 2,
    "b4": 3,
    "b1": 4,
    "l18": 5,
    "l17": 6,
    "l16": 7,
    "l15": 8,
    "l14": 9,
    "l13": 10,
    "entry-red": 11,
    "l1": 12,
    "red-lane-1": 13,
    "l3": 14,
    "l4": 15,
    "l5": 16,
    "l6": 17,
    "t16": 18,
    "t13": 19,
    "t10": 20,
    "t7": 21,
    "t4": 22,
    "t1": 23,
    "entry-green": 24,
    "t3": 25,
    "green-lane-2": 26,
    "t9": 27,
    "t12": 28,
    "t15": 29,
    "t18": 30,
    "r1": 31,
    "r2": 32,
    "r3": 33,
    "r4": 34,
    "r5": 35,
    "r6": 36,
    "entry-yellow": 37,
    "r18": 38,
    "yellow-lane-6": 39,
    "r16": 40,
    "r15": 41,
    "r14": 42,
    "r13": 43,
    "b3": 44,
    "b6": 45,
    "b9": 46,
    "b12": 47,
    "b15": 48,
    "b18": 49,
    "entry-blue": 50,
    "b16": 51
  },

  // Finish lanes: logical lanes per player, 6 cells to reach finish.
  // We model them as relative lane positions [0..5]; how you render is up to the board component.
  finishLane: {
    red:   [0, 1, 2, 3, 4, 5],
    blue:  [0, 1, 2, 3, 4, 5],
    yellow:[0, 1, 2, 3, 4, 5],
    green: [0, 1, 2, 3, 4, 5]
  }
};

// Helpers
export function cellIdToTrackIndex(id: string, map: BoardMap = defaultBoardMap): number | null {
  return Object.prototype.hasOwnProperty.call(map.cellToIndex, id) ? map.cellToIndex[id] : null;
}

export function isSafeSquare(index: number, map: BoardMap = defaultBoardMap): boolean {
  return map.safe.includes(index);
}

export function entryIndexFor(player: Player, map: BoardMap = defaultBoardMap): number {
  return map.entry[player];
}

export function finishLaneFor(player: Player, map: BoardMap = defaultBoardMap): ReadonlyArray<number> {
  return map.finishLane[player];
}

// Reverse lookup: track index -> cellId (first match)
export function indexToCellId(index: number, map: BoardMap = defaultBoardMap): string | null {
  for (const [k, v] of Object.entries(map.cellToIndex)) {
    if (v === index) return k;
  }
  return null;
}
