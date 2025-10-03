import type { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  GameSession, 
  CreateGameRequest, 
  JoinGameRequest, 
  GameMoveRequest,
  MatchmakingStatus,
  ApiError 
} from '../types/index.js';

const API_BASE_URL = 'http://157.180.80.78:3001/api';

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Network error occurred'
      }));
      throw new Error(errorData.error || 'Request failed');
    }
    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getProfile(): Promise<{ user: any }> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ user: any }>(response);
  }

  // Game endpoints
  async createGame(data: CreateGameRequest = {}): Promise<{ gameSession: GameSession }> {
    const response = await fetch(`${API_BASE_URL}/games/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<{ gameSession: GameSession }>(response);
  }

  async joinGame(data: JoinGameRequest): Promise<{ gameSession: GameSession }> {
    const response = await fetch(`${API_BASE_URL}/games/join`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<{ gameSession: GameSession }>(response);
  }

  async getGame(gameCode: string): Promise<{ gameSession: GameSession }> {
    const response = await fetch(`${API_BASE_URL}/games/${gameCode}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ gameSession: GameSession }>(response);
  }

  async makeMove(data: GameMoveRequest): Promise<{ gameSession: GameSession; move: any }> {
    const response = await fetch(`${API_BASE_URL}/games/move`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<{ gameSession: GameSession; move: any }>(response);
  }

  async getActiveGames(): Promise<{ activeGames: GameSession[] }> {
    const response = await fetch(`${API_BASE_URL}/games/active`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ activeGames: GameSession[] }>(response);
  }

  async abandonGame(gameCode: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/games/${gameCode}/abandon`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Matchmaking endpoints
  async joinMatchmaking(): Promise<{ gameSession?: GameSession; matched: boolean; queueSize?: number }> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/join`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ gameSession?: GameSession; matched: boolean; queueSize?: number }>(response);
  }

  async leaveMatchmaking(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/leave`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getMatchmakingStatus(): Promise<MatchmakingStatus> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/status`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<MatchmakingStatus>(response);
  }

  async getMatchmakingStats(): Promise<{ queueSize: number; averageWaitTime: number }> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/stats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ queueSize: number; averageWaitTime: number }>(response);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
