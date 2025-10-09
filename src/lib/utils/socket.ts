import { io, type Socket } from 'socket.io-client';
import type { GameSession, GameMessage, CheckersMove, PlayerRole } from '../types/index.js';

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  // Buffer of listeners to ensure handlers are registered even before a socket exists
  private pendingListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  private addListener(event: string, callback: (...args: any[]) => void): void {
    // Always store for future (re)binding
    const existing = this.pendingListeners.get(event) ?? [];
    existing.push(callback);
    this.pendingListeners.set(event, existing);
    // If a socket exists, bind immediately as well
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  private bindAllPendingListeners(): void {
    if (!this.socket) return;
    for (const [event, callbacks] of this.pendingListeners.entries()) {
      for (const cb of callbacks) {
        this.socket.on(event, cb);
      }
    }
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      this.socket = io(origin, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        // Ensure any listeners registered before connection are bound now
        this.bindAllPendingListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          description: (error as any).description,
          context: (error as any).context,
          type: (error as any).type,
          stack: error.stack
        });
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.attemptReconnect(token);
        }
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error('Reconnection failed:', error);
        this.attemptReconnect(token);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Game room management
  joinGame(gameCode: string): void {
    if (!this.socket) return;
    this.socket.emit('join_game', { gameCode });
  }

  leaveGame(gameCode: string): void {
    if (!this.socket) return;
    this.socket.emit('leave_game', { gameCode });
  }

  // Game moves
  makeMove(gameCode: string, move: Omit<CheckersMove, 'timestamp'>): void {
    if (!this.socket) return;
    this.socket.emit('make_move', { gameCode, move });
  }

  notifyGameUpdated(gameCode: string): void {
    if (!this.socket) return;
    this.socket.emit('game_updated', { gameCode });
  }

  // Chat
  sendMessage(gameCode: string, message: string): void {
    if (!this.socket) return;
    this.socket.emit('send_message', { gameCode, message });
  }

  // Matchmaking
  joinMatchmaking(stakeTokens?: number): void {
    if (!this.socket) return;
    this.socket.emit('join_matchmaking', { stakeTokens });
  }

  leaveMatchmaking(): void {
    if (!this.socket) return;
    this.socket.emit('leave_matchmaking');
  }

  // Event listeners
  onGameState(callback: (data: { gameSession: GameSession; playerRole: PlayerRole }) => void): void {
    this.addListener('game_state', callback);
  }

  onGameStateUpdated(callback: (data: { gameSession: GameSession }) => void): void {
    this.addListener('game_state_updated', callback);
  }

  onMoveMade(callback: (data: { move: CheckersMove; playerId: number; playerRole: PlayerRole; gameCode: string }) => void): void {
    this.addListener('move_made', callback);
  }

  onPlayerJoined(callback: (data: { player: any; gameCode: string }) => void): void {
    this.addListener('player_joined', callback);
  }

  onPlayerLeft(callback: (data: { playerId: number; gameCode: string }) => void): void {
    this.addListener('player_left', callback);
  }

  onPlayerDisconnected(callback: (data: { playerId: number; username: string; gameCode: string }) => void): void {
    this.addListener('player_disconnected', callback);
  }

  onMessageReceived(callback: (data: GameMessage) => void): void {
    this.addListener('message_received', callback);
  }

  onMatchFound(callback: (data: { gameSession: GameSession }) => void): void {
    this.addListener('match_found', callback);
  }

  onMatchmakingJoined(callback: (data: { message: string }) => void): void {
    this.addListener('matchmaking_joined', callback);
  }

  onMatchmakingLeft(callback: (data: { message: string }) => void): void {
    this.addListener('matchmaking_left', callback);
  }

  onMatchmakingTimeout(callback: (data: { message: string }) => void): void {
    this.addListener('matchmaking_timeout', callback);
  }

  // Wallet updates: when backend finalizes escrow and emits this event, refresh wallet balance
  onWalletBalanceUpdated(callback: () => void | Promise<void>): void {
    this.addListener('wallet_balance_updated', callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.addListener('error', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    // Remove from live socket
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
    // Remove from buffer
    const existing = this.pendingListeners.get(event);
    if (!existing) return;
    if (callback) {
      this.pendingListeners.set(
        event,
        existing.filter((cb) => cb !== callback)
      );
    } else {
      this.pendingListeners.delete(event);
    }
  }

  // Utility methods
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketManager = new SocketManager();
export default socketManager;
