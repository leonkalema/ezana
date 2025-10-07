import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '../types/index.js';
import { apiClient } from '../utils/api.js';
import { socketManager } from '../utils/socket.js';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  // Initialize auth state from localStorage
  if (browser) {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Connect socket with token
        socketManager.connect(token).catch(console.error);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user_data');
      }
    }
  }


  // Helper method to get current user
  const getUser = () => {
    const state = get({ subscribe });
    return state.user;
  }

  // Helper method to get current token
  const getToken = () => {
    const state = get({ subscribe });
    return state.token;

  const register = async (username: string, email: string, password: string): Promise<void> => {
    update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.register({ username, email, password });
      
      if (browser) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
      
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Connect socket
      await socketManager.connect(response.token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      update(state => ({ 
        ...state, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.login({ username, password });
      
      if (browser) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
      
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Connect socket
      await socketManager.connect(response.token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      update(state => ({ 
        ...state, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    update(state => ({ ...state, isLoading: true }));
    
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state regardless of API call success
      if (browser) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      
      socketManager.disconnect();
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  };

  const clearError = (): void => {
    update(state => ({ ...state, error: null }));
  };

  const validateAuth = async (): Promise<boolean> => {
    const currentState = get({ subscribe });
    if (!currentState.token) return false;
    
    try {
      const response = await apiClient.getProfile();
      
      set({
        user: response.user,
        token: currentState.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      // Token is invalid, clear auth state
      if (browser) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      return false;
    }
  };

  return {
    subscribe,
    register,
    login,
    logout,
    clearError,
    validateAuth,
    getToken
  };
}

// Helper function to get current store value
function get<T>(store: { subscribe: (fn: (value: T) => void) => () => void }): T {
  let value: T;
  const unsubscribe = store.subscribe((v) => value = v);
  unsubscribe();
  return value!;
}

export const authStore = createAuthStore();
