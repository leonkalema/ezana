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
import { notificationStore } from './notification.js';
import { soundManager } from '../utils/sound.js';

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

  // Set up socket event listeners
  function setupSocketListeners(): void {
    socketManager.onGameState((data) => {
      update(state => {
        const newState = {
          ...state,
          currentGame: data.gameSession,
          playerRole: data.playerRole,
          selectedSquare: null,
          validMoves: [],
          lastTurn: data.gameSession.current_turn
        };
        
        // Check if it's now the player's turn and show notification
        if (state.lastTurn && state.lastTurn !== data.gameSession.current_turn && data.gameSession.status === 'active') {
          const isMyTurn = (data.playerRole === 'player1' && data.gameSession.current_turn === 'player1') ||
                          (data.playerRole === 'player2' && data.gameSession.current_turn === 'player2');
          
          if (isMyTurn) {
            notificationStore.success('🎯 Your turn! Make your move', 4000);
            soundManager.playTurnNotification();
          } else {
            notificationStore.info('⏳ Opponent made a move', 3000);
            soundManager.playOpponentMove();
          }
        }

        // Check for game end
        if (data.gameSession.status === 'completed' && state.currentGame?.status !== 'completed') {
          const currentUserId = JSON.parse(localStorage.getItem('user_data') || '{}').id as number | undefined;
          const isWinner = data.gameSession.winner_id === currentUserId;
          
          if (isWinner) {
            notificationStore.success('🏆 Congratulations! You won the game!', 6000);
            soundManager.playGameEnd();
            setTimeout(() => soundManager.playCelebration(), 1000);
          } else {
            notificationStore.info('🎮 Game ended. Great effort!', 5000);
            soundManager.playGameLoss();
          }
        }
        
        return newState;
      });
    });

    socketManager.onGameStateUpdated((data) => {
      update(state => {
        const newState = {
          ...state,
          currentGame: data.gameSession,
          selectedSquare: null,
          validMoves: []
        };
        
        // Check if turn changed and show notification
        if (state.lastTurn && state.lastTurn !== data.gameSession.current_turn && data.gameSession.status === 'active') {
          const isMyTurn = (state.playerRole === 'player1' && data.gameSession.current_turn === 'player1') ||
                          (state.playerRole === 'player2' && data.gameSession.current_turn === 'player2');
          
          if (isMyTurn) {
            notificationStore.success('🎯 Your turn! Make your move', 4000);
            soundManager.playTurnNotification();
          } else {
            notificationStore.info('⏳ Opponent made a move', 3000);
            soundManager.playOpponentMove();
          }
        }

        // Check for game end
        if (data.gameSession.status === 'completed' && state.currentGame?.status !== 'completed') {
          const currentUserId = JSON.parse(localStorage.getItem('user_data') || '{}').id as number | undefined;
          const isWinner = data.gameSession.winner_id === currentUserId;
          
          if (isWinner) {
            notificationStore.success('🏆 Congratulations! You won the game!', 6000);
            soundManager.playGameEnd();
            setTimeout(() => soundManager.playCelebration(), 1000);
          } else {
            notificationStore.info('🎮 Game ended. Great effort!', 5000);
            soundManager.playGameLoss();
          }
        }
        
        newState.lastTurn = data.gameSession.current_turn;
        return newState;
      });
    });

    socketManager.onMoveMade((data) => {
      // Clear selection after move and request a fresh game state broadcast
      update(state => ({
        ...state,
        selectedSquare: null,
        validMoves: []
      }));
      // Ask server to emit the latest state so both players get turn changes immediately
      socketManager.notifyGameUpdated(data.gameCode);
    });

    socketManager.onPlayerJoined((data) => {
      console.log('Player joined:', data);
      notificationStore.success('🎮 Opponent joined! Game starting...', 4000);
      soundManager.playGameStart();
      // Clear selection and request a state broadcast (useful when the second player arrives)
      update(state => ({
        ...state,
        selectedSquare: null,
        validMoves: []
      }));
      socketManager.notifyGameUpdated(data.gameCode);
    });

    socketManager.onPlayerLeft((data) => {
      console.log('Player left:', data);
      notificationStore.warning('👋 Opponent left the game', 4000);
    });

    socketManager.onPlayerDisconnected((data) => {
      console.log('Player disconnected:', data);
      notificationStore.warning(`📡 ${data.username} disconnected`, 4000);
    });

    socketManager.onMessageReceived((data) => {
      update(state => ({
        ...state,
        gameMessages: [...state.gameMessages, data]
      }));
    });

    socketManager.onMatchFound((data) => {
      update(state => ({
        ...state,
        currentGame: data.gameSession,
        matchmakingStatus: null
      }));
    });

    socketManager.onMatchmakingJoined((data) => {
      console.log('Joined matchmaking:', data.message);
    });

    socketManager.onMatchmakingLeft((data) => {
      console.log('Left matchmaking:', data.message);
      update(state => ({
        ...state,
        matchmakingStatus: null
      }));
    });

    socketManager.onError((data) => {
      update(state => ({
        ...state,
        error: data.message
      }));
    });

    socketManager.onMatchmakingTimeout((data) => {
      console.log('Matchmaking timeout:', data.message);
      update(state => ({
        ...state,
        matchmakingStatus: null,
        error: data.message
      }));
    });
  }

  // Initialize socket listeners
  setupSocketListeners();

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
            validMoves: getValidMovesForPosition(state.currentGame.game_state, position)
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

// Helper function to get valid moves for a position
function getValidMovesForPosition(gameState: any, position: Position): Position[] {
  // Enhanced version supporting multiple captures and king long moves
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
          continue; // Skip backward moves for regular pieces (unless capturing)
        }
      }

      // Check if target square is empty
      if (!targetSquare.type) {
        // Check if this is a valid path (no own pieces blocking, valid captures)
        if (isValidPath(board, position, { row: newRow, col: newCol }, piece.color, piece.type === 'king')) {
          validMoves.push({ row: newRow, col: newCol });
        }
      }

      // If we hit a piece, we can't continue in this direction for non-capture moves
      if (targetSquare.type !== null) {
        break;
      }
    }
  }

  return validMoves;
}

// Helper function to validate path for moves
function isValidPath(board: any[][], from: Position, to: Position, playerColor: string, isKing: boolean): boolean {
  const rowStep = to.row > from.row ? 1 : -1;
  const colStep = to.col > from.col ? 1 : -1;
  const distance = Math.abs(to.row - from.row);

  // Special case for basic capture (distance 2) - matches backend logic
  if (distance === 2) {
    const middleRow = from.row + rowStep;
    const middleCol = from.col + colStep;
    const middlePiece = board[middleRow]?.[middleCol];
    
    // Must have opponent piece to jump over
    if (!middlePiece?.type || middlePiece.color === playerColor) {
      return false;
    }
    // Regular pieces can capture in any direction (including backwards)
    return true;
  }

  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  let captureCount = 0;

  // Check each square along the path for longer moves
  for (let i = 1; i < distance; i++) {
    const square = board[currentRow]?.[currentCol];
    
    if (square?.type !== null) {
      // There's a piece in the path
      if (square?.color === playerColor) {
        // Can't jump over own pieces
        return false;
      } else {
        // Opponent piece - can capture it
        captureCount++;
      }
    }
    
    currentRow += rowStep;
    currentCol += colStep;
  }

  // If no captures, it's a regular move (only allowed for distance 1, or kings can move multiple squares)
  if (captureCount === 0) {
    return distance === 1 || isKing;
  }

  // If there are captures, the move is valid
  return true;
}

// Helper function to get current store value
function get<T>(store: { subscribe: (fn: (value: T) => void) => () => void }): T {
  let value: T;
  const unsubscribe = store.subscribe((v) => value = v);
  unsubscribe();
  return value!;
}

export const gameStore = createGameStore();
