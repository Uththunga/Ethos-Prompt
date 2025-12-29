/* eslint-disable react-refresh/only-export-components */

import type { User } from 'firebase/auth';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../config/firebase';

// Simplified AuthContext that only handles authentication state
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = React.useCallback(async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = React.useCallback(async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      // Use signInWithPopup with better error handling for COOP issues
      const result = await signInWithPopup(auth, provider);

      // Ensure the popup is properly closed
      if (result && result.user) {
        // Success - user is authenticated
        return;
      }
    } catch (error: unknown) {
      // Handle specific authentication errors
      if ((error as { code?: string }).code === 'auth/popup-blocked') {
        throw new Error(
          'Popup was blocked by your browser. Please allow popups for this site and try again.'
        );
      } else if ((error as { code?: string }).code === 'auth/popup-closed-by-user') {
        throw new Error('Authentication was cancelled. Please try again.');
      } else if ((error as { code?: string }).code === 'auth/cancelled-popup-request') {
        throw new Error(
          'Another authentication request is in progress. Please wait and try again.'
        );
      } else if ((error as { code?: string }).code === 'auth/network-request-failed') {
        throw new Error(
          'Network error occurred. Please check your internet connection and try again.'
        );
      } else if ((error as { code?: string }).code === 'auth/unauthorized-domain') {
        throw new Error(
          'This domain is not authorized for Google sign-in. Please contact support.'
        );
      } else {
        // Log the full error for debugging but don't expose sensitive details
        debug.error('Google authentication error:', {
          code: (error as { code?: string }).code,
          message: (error as { message?: string }).message,
          stack: (error as { stack?: string }).stack,
        });
        throw new Error(
          (error as { message?: string }).message ||
            'Failed to sign in with Google. Please try again.'
        );
      }
    }
  }, []);

  const logout = React.useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      debug.log('🔐 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-login for E2E tests when emulators are enabled
  useEffect(() => {
    const isE2E = import.meta.env.VITE_E2E_MODE === 'true';
    const emulators = import.meta.env.VITE_ENABLE_EMULATORS === 'true';
    const shouldAutoLogin = isE2E && emulators;

    // Avoid spamming auth if we're still resolving initial state
    if (!shouldAutoLogin || loading || currentUser) return;

    const email = (import.meta.env.VITE_E2E_EMAIL as string) || 'e2e@test.com';
    const password = (import.meta.env.VITE_E2E_PASSWORD as string) || 'e2e12345';

    // Attempt silent sign-in
    // Some test mocks may return undefined; ensure we always have a Promise to attach catch to
    Promise.resolve(signInWithEmailAndPassword(auth, email, password)).catch((err) => {
      debug.warn('E2E auto-login failed:', (err as { code?: string; message?: string })?.code || (err as { message?: string })?.message || err);
    });
  }, [currentUser, loading]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      currentUser,
      loading,
      signup,
      login,
      loginWithGoogle,
      logout,
    }),
    [currentUser, loading, signup, login, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
