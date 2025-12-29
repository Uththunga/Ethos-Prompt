import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { User } from 'firebase/auth';

// Mock Firebase Auth functions - these will be the actual mocked functions
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateProfile = vi.fn();
const mockOnAuthStateChanged = vi.fn();

// Mock auth instance
const mockAuth = {
  currentUser: null,
  app: {},
  name: 'test-auth',
  config: {},
  languageCode: null,
  tenantId: null,
  settings: {},
  onAuthStateChanged: mockOnAuthStateChanged,
  beforeAuthStateChanged: vi.fn(),
  onIdTokenChanged: vi.fn(),
  updateCurrentUser: vi.fn(),
  useDeviceLanguage: vi.fn(),
  signOut: mockSignOut,
};

// Mock Firebase Auth module - return the mock functions directly
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  updateProfile: mockUpdateProfile,
  onAuthStateChanged: mockOnAuthStateChanged,
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    addScope: vi.fn(),
    setCustomParameters: vi.fn(),
  })),
}));

// Mock Firebase config
vi.mock('../../config/firebase', () => ({
  auth: mockAuth,
}));

// Ensure we test the real AuthContext (override global setup mock)
vi.doUnmock('../AuthContext');
// Import AuthContext after mocks are set up
const { AuthProvider, useAuth } = await import('../AuthContext');

describe('AuthContext', () => {
  const mockUser: Partial<User> = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no user authenticated
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Call callback asynchronously to simulate real Firebase behavior
      setTimeout(() => callback(null), 0);
      return vi.fn(); // unsubscribe function
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderHook(() => useAuth());
        // If we get here, the test should fail
        expect.fail('Expected useAuth to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('useAuth must be used within an AuthProvider');
      } finally {
        consoleError.mockRestore();
      }
    });

    it('should provide auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toHaveProperty('currentUser');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('signup');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('loginWithGoogle');
      expect(result.current).toHaveProperty('logout');
    });
  });

  describe('Authentication State', () => {
    it('should start with loading=true and currentUser=null', () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Don't call callback immediately
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.currentUser).toBeNull();
    });

    it('should set loading=false after auth state determined', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(null), 0);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set currentUser when user is authenticated', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockUser as User), 0);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('signup', () => {
    it('should create user with email and password', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      mockUpdateProfile.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state to be determined
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signup('test@example.com', 'password123', 'Test User');
      });

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Test User',
      });
    });

    it('should throw error on signup failure', async () => {
      const error = new Error('Signup failed');
      mockCreateUserWithEmailAndPassword.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signup('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Signup failed');
    });
  });

  describe('login', () => {
    it('should sign in with email and password', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
    });

    it('should throw error on login failure', async () => {
      const error = new Error('Invalid credentials');
      mockSignInWithEmailAndPassword.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('loginWithGoogle', () => {
    it('should sign in with Google popup', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithGoogle();
      });

      expect(mockSignInWithPopup).toHaveBeenCalled();
    });

    it('should handle popup blocked error', async () => {
      const error = { code: 'auth/popup-blocked' };
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.loginWithGoogle()).rejects.toThrow(/popup.*blocked/i);
    });

    it('should handle popup closed by user', async () => {
      const error = { code: 'auth/popup-closed-by-user' };
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.loginWithGoogle()).rejects.toThrow(/cancelled/i);
    });

    it('should handle network error', async () => {
      const error = { code: 'auth/network-request-failed' };
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.loginWithGoogle()).rejects.toThrow(/network/i);
    });

    it('should handle unauthorized domain error', async () => {
      const error = { code: 'auth/unauthorized-domain' };
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.loginWithGoogle()).rejects.toThrow(/not authorized/i);
    });

    it('should handle generic error', async () => {
      const error = { message: 'Unknown error' };
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.loginWithGoogle()).rejects.toThrow(/Unknown error/i);
    });
  });

  describe('logout', () => {
    it('should sign out user', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    });

    it('should throw error on logout failure', async () => {
      const error = new Error('Logout failed');
      mockSignOut.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('Auth State Listener', () => {
    it('should subscribe to auth state changes', () => {
      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should update currentUser when auth state changes', async () => {
      let authCallback: ((user: User | null) => void) | null = null;

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(null); // Initial state: no user
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initial state
      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
      });

      // Simulate user login
      act(() => {
        authCallback?.(mockUser as User);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(mockUser);
      });

      // Simulate user logout
      act(() => {
        authCallback?.(null);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
      });
    });
  });
});
