import { writable, get as getStore } from 'svelte/store';
import type { 
  GameSession, 
  CheckersMove, 
  Position, 
  PlayerRole, 
  GameMessage,
  MatchmakingStatus 
} from '../types/index.js';
import { apiClient } from '../utils/api.js';
import { socketManager } from '../utils/socket.js';
import { getValidMovesForPosition as computeValidMoves } from '../logic/checkers-moves.js';
import { notificationStore } from './notification.js';
import { soundManager } from '../utils/sound.js';
import { setupGameSocketListeners } from '../realtime/game-socket.js';

interface GameState {
  currentGame: GameSession | null;
  playerRole: PlayerRole;
  selectedSquare: Position | null;
  validMoves: Position[];
  gameMessages: GameMessage[];
  isLoading: boolean;
  error: string | null;
  matchmakingStatus: MatchmakingStatus | null;
  activeGames: GameSession[];
  lastTurn: 'player1' | 'player2' | null;
}

const initialState: GameState = {
  currentGame: null,
  playerRole: null,
  selectedSquare: null,
  validMoves: [],
  gameMessages: [],
  isLoading: false,
  error: null,
  matchmakingStatus: null,
  activeGames: [],
  lastTurn: null
};

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(initialState);

  // Initialize socket listeners (delegated to realtime module)
  setupGameSocketListeners({
    update,
    notifyGameUpdated: (gameCode: string) => socketManager.notifyGameUpdated(gameCode),
    notify: notificationStore,
    sound: soundManager
  });

  return {
    subscribe,

    async createGame(gameCode?: string): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.createGame({ gameCode });
        
        update(state => ({
          ...state,
          currentGame: response.gameSession,
          playerRole: 'player1',
          isLoading: false,
          gameMessages: []
        }));

        // Join the game room via socket
        socketManager.joinGame(response.gameSession.game_code);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
        update(state => ({ 
          ...state, 
          isLoading: false, 
          error: errorMessage 
        }));
        throw error;
      }
    },

    async joinGame(gameCode: string): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.joinGame({ gameCode });
        
        update(state => ({
          ...state,
          currentGame: response.gameSession,
          playerRole: 'player2',
          isLoading: false,
          gameMessages: []
        }));

        // Join the game room via socket
        socketManager.joinGame(response.gameSession.game_code);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to join game';
        update(state => ({ 
          ...state, 
          isLoading: false, 
          error: errorMessage 
        }));
        throw error;
      }
    },

    async loadGame(gameCode: string): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.getGame(gameCode);
        
        // Determine player role accurately (support spectators too)
        const currentUserId = JSON.parse(localStorage.getItem('user_data') || '{}').id as number | undefined;
        const playerRole: PlayerRole = currentUserId === response.gameSession.player1_id
          ? 'player1'
          : currentUserId === response.gameSession.player2_id
            ? 'player2'
            : null;
        
        update(state => ({
          ...state,
          currentGame: response.gameSession,
          playerRole,
          isLoading: false,
          gameMessages: []
        }));

        // Join the game room via socket
        socketManager.joinGame(response.gameSession.game_code);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load game';
        update(state => ({ 
          ...state, 
          isLoading: false, 
          error: errorMessage 
        }));
        throw error;
      }
    },

    async makeMove(from: Position, to: Position): Promise<void> {
      const currentState = get(gameStore);
      
      if (!currentState.currentGame) {
        throw new Error('No active game');
      }

      const move = { from, to };
      
      try {
        const response = await apiClient.makeMove({
          gameCode: currentState.currentGame.game_code,
          move
        });

        // Emit move via socket for real-time updates
        socketManager.makeMove(currentState.currentGame.game_code, move);

        update(state => ({
          ...state,
          currentGame: response.gameSession,
          selectedSquare: null,
          validMoves: []
        }));

        // Show success notification for successful move
        notificationStore.success('✅ Move made successfully!', 2000);
        soundManager.playMoveSuccess();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to make move';
        update(state => ({ ...state, error: errorMessage }));
        throw error;
      }
    },

    async abandonGame(): Promise<void> {
      const currentState = get(gameStore);
      
      if (!currentState.currentGame) {
        throw new Error('No active game');
      }

      try {
        await apiClient.abandonGame(currentState.currentGame.game_code);
        
        // Leave the game room
        socketManager.leaveGame(currentState.currentGame.game_code);
        
        update(state => ({
          ...state,
          currentGame: null,
          playerRole: null,
          selectedSquare: null,
          validMoves: [],
          gameMessages: []
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to abandon game';
        update(state => ({ ...state, error: errorMessage }));
        throw error;
      }
    },

    async loadActiveGames(): Promise<void> {
      try {
        const response = await apiClient.getActiveGames();
        update(state => ({
          ...state,
          activeGames: response.activeGames
        }));
      } catch (error) {
        console.error('Failed to load active games:', error);
      }
    },

    selectSquare(position: Position): void {
      update(state => {
        if (!state.currentGame) return state;

        const board = state.currentGame.game_state.board;
        const piece = board[position.row][position.col];

        // If clicking on own piece, select it
        const playerColor = state.playerRole === 'player1' ? 'red' : 'black';
        if (piece.type && piece.color === playerColor) {
          return {
            ...state,
            selectedSquare: position,
            validMoves: computeValidMoves(state.currentGame.game_state, position)
          };
        }

        // If a square is selected and clicking on a valid move, make the move
        if (state.selectedSquare && state.validMoves.some(move => 
          move.row === position.row && move.col === position.col
        )) {
          // This will trigger the makeMove function
          gameStore.makeMove(state.selectedSquare, position);
          return {
            ...state,
            selectedSquare: null,
            validMoves: []
          };
        }

        // Otherwise, deselect
        return {
          ...state,
          selectedSquare: null,
          validMoves: []
        };
      });
    },

    sendMessage(message: string): void {
      const currentState = get(gameStore);
      
      if (!currentState.currentGame) {
        return;
      }

      socketManager.sendMessage(currentState.currentGame.game_code, message);
    },

    async joinMatchmaking(): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.joinMatchmaking();
        
        if (response.matched && response.gameSession) {
          update(state => ({
            ...state,
            currentGame: response.gameSession!,
            playerRole: 'player2', // Joined player is always player2
            isLoading: false,
            matchmakingStatus: null
          }));
          
          socketManager.joinGame(response.gameSession.game_code);
        } else {
          // Join matchmaking queue via socket
          socketManager.joinMatchmaking();
          
          update(state => ({
            ...state,
            isLoading: false,
            matchmakingStatus: {
              inQueue: true,
              queueSize: response.queueSize || 0
            }
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to join matchmaking';
        update(state => ({ 
          ...state, 
          isLoading: false, 
          error: errorMessage 
        }));
        throw error;
      }
    },

    async leaveMatchmaking(): Promise<void> {
      try {
        await apiClient.leaveMatchmaking();
        socketManager.leaveMatchmaking();
        
        update(state => ({
          ...state,
          matchmakingStatus: null
        }));
      } catch (error) {
        console.error('Failed to leave matchmaking:', error);
      }
    },

    leaveGame(): void {
      const currentState = get(gameStore);
      
      if (currentState.currentGame) {
        socketManager.leaveGame(currentState.currentGame.game_code);
      }
      
      update(state => ({
        ...state,
        currentGame: null,
        playerRole: null,
        selectedSquare: null,
        validMoves: [],
        gameMessages: []
      }));
    },

    clearError(): void {
      update(state => ({ ...state, error: null }));
    },

    reset(): void {
      set(initialState);
    }
  };
}

// Move generation helpers moved to '../logic/checkers-moves.ts'

// Helper function to get current store value
function get<T>(store: { subscribe: (fn: (value: T) => void) => () => void }): T {
  let value: T;
  const unsubscribe = store.subscribe((v) => value = v);
  unsubscribe();
  return value!;
}

export const gameStore = createGameStore();
