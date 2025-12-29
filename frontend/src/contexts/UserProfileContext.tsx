/* eslint-disable react-refresh/only-export-components */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '../config/firebase';
import type { User as AppUser, UserSettings } from '../types';
import { useAuth } from './AuthContext';

interface UserProfileContextType {
  userProfile: AppUser | null;
  loading: boolean;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);

  const createUserProfile = React.useCallback(async (userId: string, additionalData: Partial<AppUser> = {}) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const defaultSettings: UserSettings = {
        theme: 'auto',
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 2048,
        temperature: 0.7,
        notifications: {
          email: true,
          push: false,
          promptCompletion: true,
          systemUpdates: true
        },
        privacy: {
          shareUsageData: false,
          allowAnalytics: true
        }
      };

      const newUserProfile: AppUser = {
        uid: userId,
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || '',
        photoURL: currentUser?.photoURL || null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        settings: defaultSettings,
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false
        },
        usage: {
          promptExecutions: 0,
          tokensUsed: 0,
          documentsUploaded: 0,
          lastResetDate: new Date()
        },
        ...additionalData
      };

      await setDoc(userRef, newUserProfile);
      return newUserProfile;
    } else {
      return { id: userSnap.id, ...userSnap.data() } as AppUser;
    }
  }, [currentUser]);

  const loadUserProfile = React.useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() } as AppUser;
        setUserProfile(profile);
      } else {
        // Create new profile if it doesn't exist
        const newProfile = await createUserProfile(userId);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, [createUserProfile]);

  const updateUserProfile = React.useCallback(async (updates: Partial<AppUser>) => {
    if (!currentUser || !userProfile) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedProfile = { ...userProfile, ...updates };

      await setDoc(userRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }, [currentUser, userProfile]);

  const refreshProfile = React.useCallback(async () => {
    if (currentUser) {
      await loadUserProfile(currentUser.uid);
    }
  }, [currentUser, loadUserProfile]);

  // Load user profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadUserProfile(currentUser.uid);
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [currentUser, loadUserProfile]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    userProfile,
    loading,
    updateUserProfile,
    refreshProfile
  }), [userProfile, loading, updateUserProfile, refreshProfile]);

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
};
