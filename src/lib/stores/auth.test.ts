import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from './auth.js';

// Mock the API client
vi.mock('$lib/utils/api.js', () => ({
  apiClient: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn()
  }
}));

// Mock the socket manager
vi.mock('$lib/utils/socket.js', () => ({
  socketManager: {
    connect: vi.fn(),
    disconnect: vi.fn()
  }
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    // Reset store state
    authStore.logout();
  });

  it('should initialize with default state', () => {
    const state = get(authStore);
    
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle successful registration', async () => {
    const mockResponse = {
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      token: 'mock-token'
    };

    const { apiClient } = await import('$lib/utils/api.js');
    const { socketManager } = await import('$lib/utils/socket.js');
    
    (apiClient.register as any).mockResolvedValue(mockResponse);
    (socketManager.connect as any).mockResolvedValue(undefined);

    await authStore.register('testuser', 'test@example.com', 'password123');

    const state = get(authStore);
    expect(state.user).toEqual(mockResponse.user);
    expect(state.token).toBe(mockResponse.token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle registration failure', async () => {
    const { apiClient } = await import('$lib/utils/api.js');
    
    (apiClient.register as any).mockRejectedValue(new Error('Registration failed'));

    await expect(
      authStore.register('testuser', 'test@example.com', 'password123')
    ).rejects.toThrow('Registration failed');

    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Registration failed');
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      token: 'mock-token'
    };

    const { apiClient } = await import('$lib/utils/api.js');
    const { socketManager } = await import('$lib/utils/socket.js');
    
    (apiClient.login as any).mockResolvedValue(mockResponse);
    (socketManager.connect as any).mockResolvedValue(undefined);

    await authStore.login('testuser', 'password123');

    const state = get(authStore);
    expect(state.user).toEqual(mockResponse.user);
    expect(state.token).toBe(mockResponse.token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle login failure', async () => {
    const { apiClient } = await import('$lib/utils/api.js');
    
    (apiClient.login as any).mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      authStore.login('testuser', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');

    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('should handle logout', async () => {
    // First login
    const mockResponse = {
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      token: 'mock-token'
    };

    const { apiClient } = await import('$lib/utils/api.js');
    const { socketManager } = await import('$lib/utils/socket.js');
    
    (apiClient.login as any).mockResolvedValue(mockResponse);
    (apiClient.logout as any).mockResolvedValue({ message: 'Logged out' });
    (socketManager.connect as any).mockResolvedValue(undefined);

    await authStore.login('testuser', 'password123');

    // Then logout
    await authStore.logout();

    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    
    expect(socketManager.disconnect).toHaveBeenCalled();
  });

  it('should clear error', () => {
    // Manually set an error state
    const { apiClient } = await import('$lib/utils/api.js');
    (apiClient.login as any).mockRejectedValue(new Error('Test error'));
    
    authStore.login('test', 'test').catch(() => {});
    
    // Clear the error
    authStore.clearError();
    
    const state = get(authStore);
    expect(state.error).toBeNull();
  });

  it('should validate authentication with valid token', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    
    const { apiClient } = await import('$lib/utils/api.js');
    (apiClient.getProfile as any).mockResolvedValue({ user: mockUser });

    // Set up initial authenticated state
    (window.localStorage.getItem as any)
      .mockReturnValueOnce('mock-token')
      .mockReturnValueOnce(JSON.stringify(mockUser));

    const isValid = await authStore.validateAuth();
    expect(isValid).toBe(true);
  });

  it('should invalidate authentication with invalid token', async () => {
    const { apiClient } = await import('$lib/utils/api.js');
    (apiClient.getProfile as any).mockRejectedValue(new Error('Invalid token'));

    // Set up initial authenticated state
    (window.localStorage.getItem as any)
      .mockReturnValueOnce('invalid-token')
      .mockReturnValueOnce(JSON.stringify({ id: 1 }));

    const isValid = await authStore.validateAuth();
    expect(isValid).toBe(false);
    
    const state = get(authStore);
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });
});
