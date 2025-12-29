# 🔌 API Integration Guide - React Prompt Library

**Version:** 3.0  
**Last Updated:** January 27, 2025  
**Team Readiness Score:** 9.1/10 → Target: 9.5/10

---

## 📋 Table of Contents

1. [Firebase Service Integration](#firebase-service-integration)
2. [Authentication Flows](#authentication-flows)
3. [Data Fetching Strategies](#data-fetching-strategies)
4. [Real-time Updates](#real-time-updates)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Caching & Performance](#caching--performance)
7. [API Service Layer](#api-service-layer)
8. [Testing API Integration](#testing-api-integration)

---

## 🔥 Firebase Service Integration

### Firebase Configuration

**Centralized Firebase setup** with proper environment handling:

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'australia-southeast1');

// Enable offline persistence for Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export const enableOfflineSupport = () => disableNetwork(db);
export const enableOnlineSupport = () => enableNetwork(db);
```

### Cloud Functions Integration

**Firebase Callable Functions** for secure API communication:

```typescript
// src/services/apiService.ts
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export class ApiService {
  private static apiFunction = httpsCallable(functions, 'api');

  /**
   * Generic API call wrapper with error handling
   */
  private static async callFunction<T>(
    endpoint: string, 
    data: Record<string, any> = {}
  ): Promise<T> {
    try {
      const result: HttpsCallableResult<ApiResponse<T>> = await this.apiFunction({
        endpoint,
        ...data
      });

      const response = result.data;
      
      if (!response.success) {
        throw new Error(response.error || 'API call failed');
      }

      return response.data as T;
    } catch (error) {
      console.error(`API call failed for endpoint: ${endpoint}`, error);
      
      // Handle specific Firebase errors
      if (error.code === 'functions/unauthenticated') {
        throw new Error('Authentication required. Please sign in.');
      } else if (error.code === 'functions/permission-denied') {
        throw new Error('Permission denied. Check your access rights.');
      } else if (error.code === 'functions/unavailable') {
        throw new Error('Service temporarily unavailable. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(): Promise<{ status: string; region: string }> {
    return this.callFunction('health');
  }

  /**
   * Execute prompt with AI model
   */
  static async executePrompt(promptData: {
    prompt: string;
    model?: string;
    context?: string;
    parameters?: Record<string, any>;
  }): Promise<{
    response: string;
    model: string;
    usage: { tokens: number; cost: number };
    executionTime: number;
  }> {
    return this.callFunction('execute_prompt', promptData);
  }

  /**
   * Generate AI-powered prompt
   */
  static async generatePrompt(data: {
    description: string;
    category: string;
    complexity?: 'simple' | 'medium' | 'complex';
  }): Promise<{
    title: string;
    content: string;
    tags: string[];
    category: string;
  }> {
    return this.callFunction('generate_prompt', data);
  }

  /**
   * Get available AI models
   */
  static async getAvailableModels(): Promise<{
    models: Array<{
      id: string;
      name: string;
      provider: string;
      pricing: { input: number; output: number };
      context_length: number;
    }>;
  }> {
    return this.callFunction('get_available_models');
  }

  /**
   * Test OpenRouter connection
   */
  static async testConnection(): Promise<{
    status: string;
    latency: number;
    models_available: number;
  }> {
    return this.callFunction('test_openrouter_connection');
  }
}
```

### Firestore Service Layer

**Type-safe Firestore operations** with proper error handling:

```typescript
// src/services/firestoreService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Prompt, Document, Execution } from '../types';

export class FirestoreService {
  /**
   * Generic document operations
   */
  static async createDocument<T>(
    collectionPath: string, 
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionPath), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  static async updateDocument<T>(
    collectionPath: string,
    documentId: string,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  static async deleteDocument(
    collectionPath: string,
    documentId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  static async getDocument<T>(
    collectionPath: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get document:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  /**
   * Paginated query with cursor-based pagination
   */
  static async getPaginatedDocuments<T>(
    collectionPath: string,
    options: {
      orderByField?: string;
      orderDirection?: 'asc' | 'desc';
      limitCount?: number;
      startAfterDoc?: DocumentSnapshot;
      filters?: Array<{ field: string; operator: any; value: any }>;
    } = {}
  ): Promise<{
    documents: T[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      const {
        orderByField = 'createdAt',
        orderDirection = 'desc',
        limitCount = 20,
        startAfterDoc,
        filters = [],
      } = options;

      let q = query(collection(db, collectionPath));

      // Apply filters
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Apply ordering
      q = query(q, orderBy(orderByField, orderDirection));

      // Apply pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      q = query(q, limit(limitCount + 1)); // Get one extra to check if there are more

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];
      let lastDoc: DocumentSnapshot | null = null;
      let hasMore = false;

      querySnapshot.docs.forEach((doc, index) => {
        if (index < limitCount) {
          documents.push({ id: doc.id, ...doc.data() } as T);
          lastDoc = doc;
        } else {
          hasMore = true;
        }
      });

      return { documents, lastDoc, hasMore };
    } catch (error) {
      console.error('Failed to get paginated documents:', error);
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }

  /**
   * Real-time subscription with automatic cleanup
   */
  static subscribeToCollection<T>(
    collectionPath: string,
    callback: (documents: T[]) => void,
    options: {
      orderByField?: string;
      orderDirection?: 'asc' | 'desc';
      limitCount?: number;
      filters?: Array<{ field: string; operator: any; value: any }>;
    } = {}
  ): Unsubscribe {
    const {
      orderByField = 'createdAt',
      orderDirection = 'desc',
      limitCount = 50,
      filters = [],
    } = options;

    let q = query(collection(db, collectionPath));

    // Apply filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });

    // Apply ordering and limit
    q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));

    return onSnapshot(
      q,
      (snapshot) => {
        const documents: T[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        callback(documents);
      },
      (error) => {
        console.error('Real-time subscription error:', error);
        // You might want to call an error callback here
      }
    );
  }

  /**
   * Batch operations for better performance
   */
  static async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collectionPath: string;
    documentId?: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      operations.forEach(operation => {
        const { type, collectionPath, documentId, data } = operation;

        switch (type) {
          case 'create':
            const newDocRef = doc(collection(db, collectionPath));
            batch.set(newDocRef, {
              ...data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            break;

          case 'update':
            if (!documentId) throw new Error('Document ID required for update');
            const updateDocRef = doc(db, collectionPath, documentId);
            batch.update(updateDocRef, {
              ...data,
              updatedAt: serverTimestamp(),
            });
            break;

          case 'delete':
            if (!documentId) throw new Error('Document ID required for delete');
            const deleteDocRef = doc(db, collectionPath, documentId);
            batch.delete(deleteDocRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Batch write failed:', error);
      throw new Error(`Batch operation failed: ${error.message}`);
    }
  }

  /**
   * Transaction for atomic operations
   */
  static async runAtomicTransaction<T>(
    transactionFn: (transaction: any) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(db, transactionFn);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
}
```

---

## 🔐 Authentication Flows

### Firebase Auth Integration

**Comprehensive authentication service** with multiple providers:

```typescript
// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export class AuthService {
  private static googleProvider = new GoogleAuthProvider();

  static {
    // Configure Google provider
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  /**
   * Email/Password Registration
   */
  static async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile
      await updateProfile(userCredential.user, { displayName });

      // Create user document
      await this.createUserDocument(userCredential.user);

      return userCredential;
    } catch (error) {
      console.error('Registration failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Email/Password Sign In
   */
  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLastLogin(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Google OAuth Sign In
   */
  static async signInWithGoogle(): Promise<UserCredential> {
    try {
      const userCredential = await signInWithPopup(auth, this.googleProvider);
      await this.createUserDocument(userCredential.user);
      await this.updateLastLogin(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign Out
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Password Reset
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update Password (requires recent authentication)
   */
  static async updateUserPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No authenticated user');

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Password update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Auth State Observer
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get Current User
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get ID Token for API calls
   */
  static async getIdToken(forceRefresh = false): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  /**
   * Create user document in Firestore
   */
  private static async createUserDocument(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          preferences: {
            theme: 'light',
            notifications: true,
            defaultModel: 'gpt-3.5-turbo',
          },
          subscription: {
            plan: 'free',
            status: 'active',
            usage: {
              prompts: 0,
              executions: 0,
              documents: 0,
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to create user document:', error);
    }
  }

  /**
   * Update last login timestamp
   */
  private static async updateLastLogin(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Handle authentication errors with user-friendly messages
   */
  private static handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('No account found with this email address.');
      case 'auth/wrong-password':
        return new Error('Incorrect password. Please try again.');
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters long.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later.');
      case 'auth/popup-closed-by-user':
        return new Error('Sign-in was cancelled. Please try again.');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection.');
      default:
        return new Error(error.message || 'Authentication failed. Please try again.');
    }
  }
}
```

### Protected Route Implementation

**Route protection** with authentication checks:

```tsx
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireEmailVerification = false,
  fallbackPath = '/auth',
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to auth page with return URL
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (requireEmailVerification && !currentUser.emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
};
```

---

## 📡 Data Fetching Strategies

### React Query Integration

**Optimized data fetching** with React Query patterns:

```typescript
// src/hooks/usePrompts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FirestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Prompt } from '../types';

export const usePrompts = (filters?: {
  category?: string;
  tags?: string[];
  search?: string;
}) => {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['prompts', currentUser?.uid, filters],
    queryFn: async () => {
      if (!currentUser) throw new Error('User not authenticated');

      const firestoreFilters = [];

      if (filters?.category) {
        firestoreFilters.push({
          field: 'category',
          operator: '==',
          value: filters.category,
        });
      }

      if (filters?.tags?.length) {
        firestoreFilters.push({
          field: 'tags',
          operator: 'array-contains-any',
          value: filters.tags,
        });
      }

      const result = await FirestoreService.getPaginatedDocuments<Prompt>(
        `users/${currentUser.uid}/prompts`,
        {
          filters: firestoreFilters,
          orderByField: 'updatedAt',
          orderDirection: 'desc',
          limitCount: 20,
        }
      );

      return result.documents;
    },
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreatePrompt = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!currentUser) throw new Error('User not authenticated');

      const promptId = await FirestoreService.createDocument<Prompt>(
        `users/${currentUser.uid}/prompts`,
        {
          ...promptData,
          userId: currentUser.uid,
          createdBy: currentUser.displayName || currentUser.email || 'Unknown',
        }
      );

      return { id: promptId, ...promptData };
    },
    onSuccess: (newPrompt) => {
      // Optimistic update
      queryClient.setQueryData(
        ['prompts', currentUser?.uid],
        (old: Prompt[] | undefined) => old ? [newPrompt as Prompt, ...old] : [newPrompt as Prompt]
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['prompts', currentUser?.uid] });
    },
    onError: (error) => {
      console.error('Failed to create prompt:', error);
    },
  });
};

export const useUpdatePrompt = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promptId,
      updates
    }: {
      promptId: string;
      updates: Partial<Prompt>
    }) => {
      if (!currentUser) throw new Error('User not authenticated');

      await FirestoreService.updateDocument<Prompt>(
        `users/${currentUser.uid}/prompts`,
        promptId,
        updates
      );

      return { promptId, updates };
    },
    onMutate: async ({ promptId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prompts', currentUser?.uid] });

      // Snapshot previous value
      const previousPrompts = queryClient.getQueryData(['prompts', currentUser?.uid]);

      // Optimistically update
      queryClient.setQueryData(
        ['prompts', currentUser?.uid],
        (old: Prompt[] | undefined) =>
          old?.map(prompt =>
            prompt.id === promptId
              ? { ...prompt, ...updates, updatedAt: new Date() }
              : prompt
          )
      );

      return { previousPrompts };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPrompts) {
        queryClient.setQueryData(['prompts', currentUser?.uid], context.previousPrompts);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['prompts', currentUser?.uid] });
    },
  });
};
```

### Infinite Queries for Pagination

**Infinite scrolling** with cursor-based pagination:

```typescript
// src/hooks/useInfinitePrompts.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { FirestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Prompt } from '../types';

export const useInfinitePrompts = (filters?: {
  category?: string;
  search?: string;
}) => {
  const { currentUser } = useAuth();

  return useInfiniteQuery({
    queryKey: ['prompts', 'infinite', currentUser?.uid, filters],
    queryFn: async ({ pageParam }) => {
      if (!currentUser) throw new Error('User not authenticated');

      const firestoreFilters = [];

      if (filters?.category) {
        firestoreFilters.push({
          field: 'category',
          operator: '==',
          value: filters.category,
        });
      }

      return await FirestoreService.getPaginatedDocuments<Prompt>(
        `users/${currentUser.uid}/prompts`,
        {
          filters: firestoreFilters,
          orderByField: 'updatedAt',
          orderDirection: 'desc',
          limitCount: 10,
          startAfterDoc: pageParam,
        }
      );
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastDoc : undefined;
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Usage in component
export const InfinitePromptList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfinitePrompts();

  const prompts = data?.pages.flatMap(page => page.documents) ?? [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {prompts.map(prompt => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}

      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full mt-4"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
};
```

---

## 🔄 Real-time Updates

### Firestore Real-time Subscriptions

**Live data synchronization** with automatic cleanup:

```typescript
// src/hooks/useRealtimePrompts.ts
import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Prompt } from '../types';

export const useRealtimePrompts = (filters?: {
  category?: string;
  limit?: number;
}) => {
  const { currentUser } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setPrompts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const firestoreFilters = [];

    if (filters?.category) {
      firestoreFilters.push({
        field: 'category',
        operator: '==',
        value: filters.category,
      });
    }

    const unsubscribe = FirestoreService.subscribeToCollection<Prompt>(
      `users/${currentUser.uid}/prompts`,
      (updatedPrompts) => {
        setPrompts(updatedPrompts);
        setLoading(false);
      },
      {
        filters: firestoreFilters,
        orderByField: 'updatedAt',
        orderDirection: 'desc',
        limitCount: filters?.limit || 50,
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, filters?.category, filters?.limit]);

  return { prompts, loading, error };
};
```

### Real-time Collaboration Features

**Multi-user collaboration** with conflict resolution:

```typescript
// src/hooks/useCollaborativePrompt.ts
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { debounce } from 'lodash';

interface CollaborativePrompt {
  id: string;
  content: string;
  lastModified: Date;
  lastModifiedBy: string;
  collaborators: string[];
  version: number;
}

export const useCollaborativePrompt = (promptId: string) => {
  const { currentUser } = useAuth();
  const [prompt, setPrompt] = useState<CollaborativePrompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: string, version: number) => {
      if (!currentUser || !promptId) return;

      try {
        const promptRef = doc(db, 'collaborative_prompts', promptId);

        await updateDoc(promptRef, {
          content,
          lastModified: serverTimestamp(),
          lastModifiedBy: currentUser.uid,
          version: version + 1,
        });
      } catch (error) {
        console.error('Failed to save collaborative prompt:', error);
        setConflicts(prev => [...prev, 'Save failed']);
      }
    }, 1000),
    [currentUser, promptId]
  );

  // Real-time subscription
  useEffect(() => {
    if (!promptId) return;

    const promptRef = doc(db, 'collaborative_prompts', promptId);

    const unsubscribe = onSnapshot(promptRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as CollaborativePrompt;

        // Check for conflicts
        if (prompt && data.version > prompt.version + 1) {
          setConflicts(prev => [...prev, 'Content was modified by another user']);
        }

        setPrompt({ id: doc.id, ...data });
      }
    });

    return unsubscribe;
  }, [promptId]);

  const updateContent = useCallback((content: string) => {
    if (!prompt) return;

    setPrompt(prev => prev ? { ...prev, content } : null);
    debouncedSave(content, prompt.version);
  }, [prompt, debouncedSave]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    // Add current user to collaborators list
    if (currentUser && prompt && !prompt.collaborators.includes(currentUser.uid)) {
      const promptRef = doc(db, 'collaborative_prompts', promptId);
      updateDoc(promptRef, {
        collaborators: [...prompt.collaborators, currentUser.uid],
      });
    }
  }, [currentUser, prompt, promptId]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    // Remove current user from collaborators list
    if (currentUser && prompt) {
      const promptRef = doc(db, 'collaborative_prompts', promptId);
      updateDoc(promptRef, {
        collaborators: prompt.collaborators.filter(id => id !== currentUser.uid),
      });
    }
  }, [currentUser, prompt, promptId]);

  const resolveConflict = useCallback((conflictIndex: number) => {
    setConflicts(prev => prev.filter((_, index) => index !== conflictIndex));
  }, []);

  return {
    prompt,
    isEditing,
    conflicts,
    updateContent,
    startEditing,
    stopEditing,
    resolveConflict,
  };
};
```

---

## ⚠️ Error Handling Patterns

### Comprehensive Error Handling

**Centralized error management** with user-friendly messages:

```typescript
// src/utils/errorHandler.ts
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  code?: string;
  details?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Convert various error types to standardized AppError
   */
  static handleError(error: any): AppError {
    // Firebase Auth errors
    if (error.code?.startsWith('auth/')) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: this.getAuthErrorMessage(error.code),
        originalError: error,
        code: error.code,
      };
    }

    // Firebase Functions errors
    if (error.code?.startsWith('functions/')) {
      return {
        type: this.getFunctionsErrorType(error.code),
        message: this.getFunctionsErrorMessage(error.code),
        originalError: error,
        code: error.code,
      };
    }

    // Firestore errors
    if (error.code?.startsWith('firestore/')) {
      return {
        type: this.getFirestoreErrorType(error.code),
        message: this.getFirestoreErrorMessage(error.code),
        originalError: error,
        code: error.code,
      };
    }

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network connection failed. Please check your internet connection.',
        originalError: error,
      };
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return {
        type: ErrorType.VALIDATION,
        message: error.message || 'Invalid input data',
        originalError: error,
        details: error.details,
      };
    }

    // Default unknown error
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred',
      originalError: error,
    };
  }

  private static getAuthErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    return messages[code] || 'Authentication failed. Please try again.';
  }

  private static getFunctionsErrorType(code: string): ErrorType {
    switch (code) {
      case 'functions/unauthenticated':
        return ErrorType.AUTHENTICATION;
      case 'functions/permission-denied':
        return ErrorType.AUTHORIZATION;
      case 'functions/not-found':
        return ErrorType.NOT_FOUND;
      case 'functions/resource-exhausted':
        return ErrorType.RATE_LIMIT;
      case 'functions/unavailable':
      case 'functions/deadline-exceeded':
        return ErrorType.SERVER;
      default:
        return ErrorType.UNKNOWN;
    }
  }

  private static getFunctionsErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'functions/unauthenticated': 'Please sign in to continue.',
      'functions/permission-denied': 'You don\'t have permission to perform this action.',
      'functions/not-found': 'The requested resource was not found.',
      'functions/resource-exhausted': 'Rate limit exceeded. Please try again later.',
      'functions/unavailable': 'Service temporarily unavailable. Please try again.',
      'functions/deadline-exceeded': 'Request timed out. Please try again.',
    };
    return messages[code] || 'Server error. Please try again.';
  }

  private static getFirestoreErrorType(code: string): ErrorType {
    switch (code) {
      case 'firestore/permission-denied':
        return ErrorType.AUTHORIZATION;
      case 'firestore/not-found':
        return ErrorType.NOT_FOUND;
      case 'firestore/resource-exhausted':
        return ErrorType.RATE_LIMIT;
      case 'firestore/unavailable':
        return ErrorType.SERVER;
      default:
        return ErrorType.UNKNOWN;
    }
  }

  private static getFirestoreErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'firestore/permission-denied': 'Access denied. Check your permissions.',
      'firestore/not-found': 'Document not found.',
      'firestore/resource-exhausted': 'Database quota exceeded. Please try again later.',
      'firestore/unavailable': 'Database temporarily unavailable.',
    };
    return messages[code] || 'Database error. Please try again.';
  }
}
```

### Error Boundary Implementation

**React Error Boundary** for graceful error handling:

```tsx
// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, AppError, ErrorType } from '../../utils/errorHandler';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = ErrorHandler.handleError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorHandler.handleError(error);

    // Log error to monitoring service
    console.error('Error Boundary caught an error:', appError, errorInfo);

    // Call custom error handler
    this.props.onError?.(appError, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {this.state.error.message}
            </p>
            <div className="space-x-4">
              <Button onClick={this.retry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error.code && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(this.state.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🚀 Caching & Performance

### React Query Caching Strategy

**Optimized caching configuration** for different data types:

```typescript
// src/lib/queryClient.ts - Enhanced caching configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache configuration
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Cache configuration by data type
export const cacheConfig = {
  // Frequently changing data
  realtime: {
    staleTime: 30 * 1000,      // 30 seconds
    gcTime: 2 * 60 * 1000,     // 2 minutes
  },

  // User-specific data
  user: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },

  // Static/reference data
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  },

  // Analytics data
  analytics: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  },
};

// Query key factory for consistent cache keys
export const queryKeys = {
  prompts: {
    all: ['prompts'] as const,
    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (userId: string, filters?: any) =>
      [...queryKeys.prompts.lists(), userId, filters] as const,
    details: () => [...queryKeys.prompts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.prompts.details(), id] as const,
  },

  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.documents.lists(), userId] as const,
    detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
  },

  executions: {
    all: ['executions'] as const,
    lists: () => [...queryKeys.executions.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.executions.lists(), userId] as const,
    detail: (id: string) => [...queryKeys.executions.all, 'detail', id] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    dashboard: (userId: string, dateRange: string) =>
      [...queryKeys.analytics.all, 'dashboard', userId, dateRange] as const,
    usage: (userId: string) =>
      [...queryKeys.analytics.all, 'usage', userId] as const,
  },
};
```

### Background Sync & Offline Support

**Service Worker integration** for offline functionality:

```typescript
// src/utils/backgroundSync.ts
export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private syncQueue: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    collection: string;
    data: any;
    timestamp: number;
  }> = [];

  static getInstance(): BackgroundSyncManager {
    if (!this.instance) {
      this.instance = new BackgroundSyncManager();
    }
    return this.instance;
  }

  /**
   * Add operation to sync queue
   */
  addToQueue(operation: {
    operation: 'create' | 'update' | 'delete';
    collection: string;
    data: any;
  }): string {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.syncQueue.push({
      id,
      ...operation,
      timestamp: Date.now(),
    });

    // Save to localStorage for persistence
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    return id;
  }

  /**
   * Process sync queue when back online
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        await this.executeSync(item);
        console.log(`Synced operation: ${item.id}`);
      } catch (error) {
        console.error(`Failed to sync operation: ${item.id}`, error);
        // Re-add to queue for retry
        this.syncQueue.push(item);
      }
    }

    // Update localStorage
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  private async executeSync(item: any): Promise<void> {
    switch (item.operation) {
      case 'create':
        await FirestoreService.createDocument(item.collection, item.data);
        break;
      case 'update':
        await FirestoreService.updateDocument(
          item.collection,
          item.data.id,
          item.data
        );
        break;
      case 'delete':
        await FirestoreService.deleteDocument(item.collection, item.data.id);
        break;
    }
  }

  /**
   * Initialize background sync
   */
  initialize(): void {
    // Load queue from localStorage
    const savedQueue = localStorage.getItem('syncQueue');
    if (savedQueue) {
      this.syncQueue = JSON.parse(savedQueue);
    }

    // Listen for online events
    window.addEventListener('online', () => {
      console.log('Back online, processing sync queue...');
      this.processSyncQueue();
    });

    // Register service worker for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered for background sync');
      });
    }
  }
}

// Initialize on app start
BackgroundSyncManager.getInstance().initialize();
```

---

## 🧪 Testing API Integration

### API Service Testing

**Comprehensive testing** for API services:

```typescript
// src/services/__tests__/apiService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiService } from '../apiService';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  functions: {},
}));

describe('ApiService', () => {
  const mockCallable = vi.fn();

  beforeEach(() => {
    vi.mocked(httpsCallable).mockReturnValue(mockCallable);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { status: 'healthy', region: 'australia-southeast1' },
        },
      };
      mockCallable.mockResolvedValue(mockResponse);

      const result = await ApiService.healthCheck();

      expect(mockCallable).toHaveBeenCalledWith({ endpoint: 'health' });
      expect(result).toEqual({ status: 'healthy', region: 'australia-southeast1' });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Service unavailable',
        },
      };
      mockCallable.mockResolvedValue(mockResponse);

      await expect(ApiService.healthCheck()).rejects.toThrow('Service unavailable');
    });

    it('should handle Firebase function errors', async () => {
      const mockError = {
        code: 'functions/unauthenticated',
        message: 'Unauthenticated',
      };
      mockCallable.mockRejectedValue(mockError);

      await expect(ApiService.healthCheck()).rejects.toThrow(
        'Authentication required. Please sign in.'
      );
    });
  });

  describe('executePrompt', () => {
    it('should execute prompt successfully', async () => {
      const promptData = {
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
        context: 'Test context',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            response: 'AI response',
            model: 'gpt-3.5-turbo',
            usage: { tokens: 100, cost: 0.001 },
            executionTime: 1500,
          },
        },
      };
      mockCallable.mockResolvedValue(mockResponse);

      const result = await ApiService.executePrompt(promptData);

      expect(mockCallable).toHaveBeenCalledWith({
        endpoint: 'execute_prompt',
        ...promptData,
      });
      expect(result.response).toBe('AI response');
      expect(result.usage.tokens).toBe(100);
    });
  });
});
```

### React Query Hook Testing

**Testing custom hooks** with React Query:

```typescript
// src/hooks/__tests__/usePrompts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrompts } from '../usePrompts';
import { FirestoreService } from '../../services/firestoreService';
import { AuthContext } from '../../contexts/AuthContext';

// Mock services
vi.mock('../../services/firestoreService');

const createWrapper = (user = { uid: 'test-user' }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          currentUser: user,
          loading: false,
          signup: vi.fn(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          logout: vi.fn(),
        }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('usePrompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch prompts successfully', async () => {
    const mockPrompts = [
      { id: '1', title: 'Test Prompt 1', content: 'Content 1' },
      { id: '2', title: 'Test Prompt 2', content: 'Content 2' },
    ];

    vi.mocked(FirestoreService.getPaginatedDocuments).mockResolvedValue({
      documents: mockPrompts,
      lastDoc: null,
      hasMore: false,
    });

    const { result } = renderHook(() => usePrompts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPrompts);
    expect(FirestoreService.getPaginatedDocuments).toHaveBeenCalledWith(
      'users/test-user/prompts',
      expect.objectContaining({
        orderByField: 'updatedAt',
        orderDirection: 'desc',
        limitCount: 20,
      })
    );
  });

  it('should handle filters correctly', async () => {
    const filters = { category: 'coding', tags: ['javascript'] };

    vi.mocked(FirestoreService.getPaginatedDocuments).mockResolvedValue({
      documents: [],
      lastDoc: null,
      hasMore: false,
    });

    renderHook(() => usePrompts(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(FirestoreService.getPaginatedDocuments).toHaveBeenCalledWith(
        'users/test-user/prompts',
        expect.objectContaining({
          filters: [
            { field: 'category', operator: '==', value: 'coding' },
            { field: 'tags', operator: 'array-contains-any', value: ['javascript'] },
          ],
        })
      );
    });
  });

  it('should not fetch when user is not authenticated', () => {
    const { result } = renderHook(() => usePrompts(), {
      wrapper: createWrapper(null),
    });

    expect(result.current.isIdle).toBe(true);
    expect(FirestoreService.getPaginatedDocuments).not.toHaveBeenCalled();
  });
});
```

### Integration Testing

**End-to-end API integration tests**:

```typescript
// src/test/integration/apiIntegration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { ApiService } from '../../services/apiService';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize Firebase with emulator
    const app = initializeApp({
      projectId: 'demo-project',
      apiKey: 'demo-key',
      authDomain: 'demo-project.firebaseapp.com',
    });

    const auth = getAuth(app);
    const functions = getFunctions(app);

    // Connect to emulators
    connectFunctionsEmulator(functions, 'localhost', 5001);

    // Sign in anonymously for testing
    await signInAnonymously(auth);
  });

  it('should perform health check', async () => {
    const result = await ApiService.healthCheck();

    expect(result).toHaveProperty('status');
    expect(result.status).toBe('success');
  });

  it('should execute prompt end-to-end', async () => {
    const promptData = {
      prompt: 'Write a hello world function in JavaScript',
      model: 'gpt-3.5-turbo',
    };

    const result = await ApiService.executePrompt(promptData);

    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('usage');
    expect(result.usage).toHaveProperty('tokens');
    expect(result.usage).toHaveProperty('cost');
  });

  it('should handle rate limiting gracefully', async () => {
    // Make multiple rapid requests to test rate limiting
    const promises = Array.from({ length: 10 }, () =>
      ApiService.executePrompt({ prompt: 'Test prompt' })
    );

    const results = await Promise.allSettled(promises);

    // Some requests should succeed, others might be rate limited
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful.length + failed.length).toBe(10);

    // Check that rate limit errors are handled properly
    failed.forEach(result => {
      if (result.status === 'rejected') {
        expect(result.reason.message).toMatch(/rate limit|too many requests/i);
      }
    });
  });
});
```

---

## 📚 Best Practices Summary

### API Integration Checklist

- ✅ **Authentication**: Implement proper Firebase Auth integration
- ✅ **Error Handling**: Use centralized error handling with user-friendly messages
- ✅ **Caching**: Configure React Query with appropriate cache strategies
- ✅ **Real-time**: Implement Firestore subscriptions with cleanup
- ✅ **Offline Support**: Add background sync for offline functionality
- ✅ **Type Safety**: Use TypeScript interfaces for all API responses
- ✅ **Testing**: Write comprehensive tests for services and hooks
- ✅ **Performance**: Implement pagination, debouncing, and optimization
- ✅ **Security**: Validate inputs and handle sensitive data properly
- ✅ **Monitoring**: Add logging and error tracking for production

### Performance Optimization Tips

1. **Use React Query's built-in optimizations**
2. **Implement proper cache invalidation strategies**
3. **Use background refetching for critical data**
4. **Implement optimistic updates for better UX**
5. **Use infinite queries for large datasets**
6. **Debounce user inputs and API calls**
7. **Implement proper loading and error states**
8. **Use service workers for offline support**

---

*This API Integration Guide provides comprehensive patterns and best practices for integrating with Firebase services in the React Prompt Library. For specific implementation details, refer to the individual service documentation and code examples.*
```
