import type { Writable } from 'svelte/store';
import type { GameSession, GameMessage } from '../types/index.js';
import { socketManager } from '../utils/socket.js';

export interface GameSocketDeps {
  update: Writable<{
    currentGame: GameSession | null;
    playerRole: 'player1' | 'player2' | null;
    selectedSquare: any;
    validMoves: any[];
    gameMessages: GameMessage[];
    isLoading: boolean;
    error: string | null;
    matchmakingStatus: any;
    activeGames: GameSession[];
    lastTurn: 'player1' | 'player2' | null;
    isMyTurn: boolean;
  }>['update'];
  notifyGameUpdated: (gameCode: string) => void;
  notify: {
    success: (msg: string, ms?: number) => void;
    info: (msg: string, ms?: number) => void;
    warning: (msg: string, ms?: number) => void;
  };
  sound: {
    playTurnNotification: () => void;
    playOpponentMove: () => void;
    playGameEnd: () => void;
    playCelebration: () => void;
    playGameLoss: () => void;
    playGameStart: () => void;
  };
}

export function setupGameSocketListeners(deps: GameSocketDeps): void {
  const { update, notifyGameUpdated, notify, sound } = deps;

  socketManager.onGameState((data) => {
    update((state) => {
      const isMyTurnNow =
        (data.playerRole === 'player1' && data.gameSession.current_turn === 'player1') ||
        (data.playerRole === 'player2' && data.gameSession.current_turn === 'player2');

      const newState = {
        ...state,
        currentGame: data.gameSession,
        playerRole: data.playerRole,
        selectedSquare: null,
        validMoves: [],
        lastTurn: data.gameSession.current_turn,
        isMyTurn: isMyTurnNow,
      };

      if (data.gameSession.status === 'completed' && state.currentGame?.status !== 'completed') {
        const currentUserId = JSON.parse(localStorage.getItem('user_data') || '{}').id as number | undefined;
        const isWinner = data.gameSession.winner_id === currentUserId;
        if (isWinner) {
          notify.success('🏆 Congratulations! You won the game!', 6000);
          sound.playGameEnd();
          setTimeout(() => sound.playCelebration(), 1000);
        } else {
          notify.info('🎮 Game ended. Great effort!', 5000);
          sound.playGameLoss();
        }
      }

      return newState;
    });
  });

  socketManager.onGameStateUpdated((data) => {
    update((state) => {
      const isMyTurnNow =
        (state.playerRole === 'player1' && data.gameSession.current_turn === 'player1') ||
        (state.playerRole === 'player2' && data.gameSession.current_turn === 'player2');

      const newState = {
        ...state,
        currentGame: data.gameSession,
        selectedSquare: null,
        validMoves: [],
        isMyTurn: isMyTurnNow,
      };

      if (
        state.lastTurn &&
        state.lastTurn !== data.gameSession.current_turn &&
        data.gameSession.status === 'active'
      ) {
        const isMyTurn =
          (state.playerRole === 'player1' && data.gameSession.current_turn === 'player1') ||
          (state.playerRole === 'player2' && data.gameSession.current_turn === 'player2');
        if (isMyTurn) {
          notify.success('🎯 Your turn! Make your move', 4000);
          sound.playTurnNotification();
        } else {
          notify.info('⏳ Opponent made a move', 3000);
          sound.playOpponentMove();
        }
      }

      newState.lastTurn = data.gameSession.current_turn;
      if (data.gameSession.status === 'completed' && state.currentGame?.status !== 'completed') {
        const currentUserId = JSON.parse(localStorage.getItem('user_data') || '{}').id as number | undefined;
        const isWinner = data.gameSession.winner_id === currentUserId;
        if (isWinner) {
          notify.success('🏆 Congratulations! You won the game!', 6000);
          sound.playGameEnd();
          setTimeout(() => sound.playCelebration(), 1000);
        } else {
          notify.info('🎮 Game ended. Great effort!', 5000);
          sound.playGameLoss();
        }
      }

      return newState;
    });
  });

  socketManager.onMoveMade((data) => {
    update((state) => ({ ...state, selectedSquare: null, validMoves: [] }));
    notifyGameUpdated(data.gameCode);
  });

  socketManager.onPlayerJoined((data) => {
    console.log('Player joined:', data);
    notify.success('🎮 Opponent joined! Game starting...', 4000);
    sound.playGameStart();
    update((state) => ({ ...state, selectedSquare: null, validMoves: [] }));
    notifyGameUpdated(data.gameCode);
  });

  socketManager.onPlayerLeft((data) => {
    console.log('Player left:', data);
    notify.warning('👋 Opponent left the game', 4000);
  });

  socketManager.onPlayerDisconnected((data) => {
    console.log('Player disconnected:', data);
    notify.warning(`📡 ${data.username} disconnected`, 4000);
  });

  socketManager.onMessageReceived((data) => {
    update((state) => ({ ...state, gameMessages: [...state.gameMessages, data] }));
  });

  socketManager.onMatchFound((data) => {
    update((state) => ({ ...state, currentGame: data.gameSession, matchmakingStatus: null }));
  });

  socketManager.onMatchmakingJoined((data) => {
    console.log('Joined matchmaking:', data.message);
  });

  socketManager.onMatchmakingLeft((data) => {
    console.log('Left matchmaking:', data.message);
    update((state) => ({ ...state, matchmakingStatus: null }));
  });

  socketManager.onError((data) => {
    update((state) => ({ ...state, error: data.message }));
  });

  socketManager.onMatchmakingTimeout((data) => {
    console.log('Matchmaking timeout:', data.message);
    update((state) => ({ ...state, matchmakingStatus: null, error: data.message }));
  });
}
