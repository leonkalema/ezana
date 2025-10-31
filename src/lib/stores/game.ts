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
  isMyTurn: boolean;
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
  lastTurn: null,
  isMyTurn: false
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

  // Single polling timer for matchmaking status
  let pollTimerId: ReturnType<typeof setInterval> | null = null;

  return {
    subscribe,

    async joinMatchmaking(stakeTokens?: number): Promise<void> {
      update((state) => ({ ...state, isLoading: true, error: null }));
      try {
        const response = await apiClient.joinMatchmaking(stakeTokens);
        if (response.matched && response.gameSession) {
          // Match found immediately
          update((state) => ({
            ...state,
            currentGame: response.gameSession || null,
            matchmakingStatus: null,
            isLoading: false
          }));
        } else {
          // Added to queue
          update((state) => ({
            ...state,
            matchmakingStatus: { inQueue: true, queueEntry: undefined, queueSize: response.queueSize ?? 0 },
            isLoading: true
          }));
          // Start polling only if not already active
          if (!pollTimerId) {
            gameStore.pollMatchmakingStatus();
          }
        }
      } catch (error) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to join matchmaking'
        }));
      }
    },

    async pollMatchmakingStatus(): Promise<void> {
      if (pollTimerId) return; // Guard against multiple intervals
      pollTimerId = setInterval(async () => {
        try {
          const status = await apiClient.getMatchmakingStatus();
          if (!status.inQueue) {
            // No longer in queue, stop polling and set game
            if (pollTimerId) {
              clearInterval(pollTimerId);
              pollTimerId = null;
            }
            const active = await apiClient.getActiveGames();
            const latestGame = active.activeGames[0] ?? null;
            update((state) => ({
              ...state,
              currentGame: latestGame,
              matchmakingStatus: null,
              isLoading: false
            }));
            return;
          }
          // Still in queue – keep UI informed
          update((state) => ({
            ...state,
            matchmakingStatus: { inQueue: true, queueEntry: status.queueEntry, queueSize: status.queueSize }
          }));
        } catch (error) {
          if (pollTimerId) {
            clearInterval(pollTimerId);
            pollTimerId = null;
          }
          update((state) => ({ ...state, isLoading: false, error: 'Matchmaking failed' }));
        }
      }, 2000); // Poll every 2 seconds
    },

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


    async leaveMatchmaking(): Promise<void> {
      try {
        await apiClient.leaveMatchmaking();
        socketManager.leaveMatchmaking();
      } finally {
        if (pollTimerId) {
          clearInterval(pollTimerId);
          pollTimerId = null;
        }
        update((state) => ({ ...state, matchmakingStatus: null, isLoading: false }));
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

    async handleTimeout(): Promise<void> {
      console.log('🔥 handleTimeout() CALLED');
      
      const currentState = get(gameStore);
      
      console.log('📊 Current game state:', {
        hasGame: !!currentState.currentGame,
        playerRole: currentState.playerRole,
        gameCode: currentState.currentGame?.game_code,
        currentTurn: currentState.currentGame?.current_turn
      });
      
      if (!currentState.currentGame || !currentState.playerRole) {
        console.error('❌ Cannot handle timeout: no active game or player role');
        return;
      }

      console.log('⏰ Handling timeout for', currentState.playerRole);
      
      const requestPayload = {
        gameCode: currentState.currentGame.game_code,
        move: {
          from: { row: 0, col: 0 }, // Dummy move - backend will replace with auto-move
          to: { row: 0, col: 0 }
        }
      };
      
      console.log('📤 Sending timeout request to backend:', requestPayload);
      
      try {
        // Make a dummy move - the backend will detect timeout and generate auto-move
        const response = await apiClient.makeMove(requestPayload);
        
        console.log('📥 Received response from backend:', response);

        if (response.gameSession) {
          update(state => ({
            ...state,
            currentGame: response.gameSession,
            selectedSquare: null,
            validMoves: []
          }));

          // Show notification about auto-move
          const strikes = (response as any).strikes || 0;
          notificationStore.warning(`⏱️ Time's up! Auto-move made. Strikes: ${strikes}/3`, 5000);
          soundManager.playOpponentMove();
        }
      } catch (error: any) {
        console.error('Timeout handling error:', error);
        
        const errorData = error.response?.data;
        if (errorData?.timeout) {
          // Game ended due to 3 strikes
          notificationStore.error('❌ 3 strikes! You lost by timeout.', 8000);
          
          if (errorData.gameSession) {
            update(state => ({
              ...state,
              currentGame: errorData.gameSession
            }));
          }
        } else {
          notificationStore.error('Failed to process timeout', 3000);
        }
      }
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
