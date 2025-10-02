import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import LoginForm from './login-form.svelte';
import { authStore } from '$lib/stores/auth.js';

// Mock the auth store
vi.mock('$lib/stores/auth.js', () => ({
  authStore: {
    subscribe: vi.fn(),
    login: vi.fn(),
    clearError: vi.fn()
  }
}));

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the store subscription
    const mockAuthState = {
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      token: null
    };
    
    (authStore.subscribe as any).mockImplementation((callback: any) => {
      callback(mockAuthState);
      return () => {};
    });
  });

  it('should render login form with all required fields', () => {
    render(LoginForm);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should disable submit button when fields are empty', () => {
    render(LoginForm);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when fields are filled', async () => {
    render(LoginForm);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    
    expect(submitButton).not.toBeDisabled();
  });

  it('should call authStore.login when form is submitted', async () => {
    render(LoginForm);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);
    
    expect(authStore.login).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('should show loading state when isLoading is true', () => {
    const mockAuthState = {
      isLoading: true,
      error: null,
      user: null,
      isAuthenticated: false,
      token: null
    };
    
    (authStore.subscribe as any).mockImplementation((callback: any) => {
      callback(mockAuthState);
      return () => {};
    });
    
    render(LoginForm);
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it('should display error message when error exists', () => {
    const mockAuthState = {
      isLoading: false,
      error: 'Invalid credentials',
      user: null,
      isAuthenticated: false,
      token: null
    };
    
    (authStore.subscribe as any).mockImplementation((callback: any) => {
      callback(mockAuthState);
      return () => {};
    });
    
    render(LoginForm);
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    render(LoginForm);
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // The eye icon button
    
    expect(passwordInput.type).toBe('password');
    
    await fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    await fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});
