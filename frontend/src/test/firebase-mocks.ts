/**
 * Firebase Mocks for Testing
 * Comprehensive mock implementations for Firebase services
 */

import { vi } from 'vitest';

// Enhanced Firestore Mock with all required methods
export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          exists: () => true,
          data: () => ({}),
          id: 'mock-doc-id',
          ref: { id: 'mock-doc-id', path: 'collection/mock-doc-id' },
        })
      ),
      set: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      onSnapshot: vi.fn((callback) => {
        callback({
          exists: () => true,
          data: () => ({}),
          id: 'mock-doc-id',
        });
        return vi.fn(); // unsubscribe function
      }),
    })),
    add: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    where: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          docs: [],
          empty: true,
          size: 0,
          forEach: vi.fn(),
        })
      ),
      onSnapshot: vi.fn((callback) => {
        callback({
          docs: [],
          empty: true,
          size: 0,
          forEach: vi.fn(),
        });
        return vi.fn();
      }),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          docs: [],
          empty: true,
          size: 0,
          forEach: vi.fn(),
        })
      ),
      limit: vi.fn(() => ({
        get: vi.fn(() =>
          Promise.resolve({
            docs: [],
            empty: true,
            size: 0,
            forEach: vi.fn(),
          })
        ),
      })),
    })),
    limit: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          docs: [],
          empty: true,
          size: 0,
          forEach: vi.fn(),
        })
      ),
    })),
    onSnapshot: vi.fn((callback) => {
      callback({
        docs: [],
        empty: true,
        size: 0,
        forEach: vi.fn(),
      });
      return vi.fn();
    }),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({}),
        id: 'mock-doc-id',
        ref: { id: 'mock-doc-id', path: 'collection/mock-doc-id' },
      })
    ),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    collection: vi.fn(() => mockFirestore.collection()),
    onSnapshot: vi.fn((callback) => {
      callback({
        exists: () => true,
        data: () => ({}),
        id: 'mock-doc-id',
      });
      return vi.fn();
    }),
  })),
  query: vi.fn(() => ({
    get: vi.fn(() =>
      Promise.resolve({
        docs: [],
        empty: true,
        size: 0,
        forEach: vi.fn(),
      })
    ),
  })),
  where: vi.fn(() => mockFirestore.query()),
  orderBy: vi.fn(() => mockFirestore.query()),
  limit: vi.fn(() => mockFirestore.query()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({}),
      id: 'mock-doc-id',
    })
  ),
  getDocs: vi.fn(() =>
    Promise.resolve({
      docs: [],
      empty: true,
      size: 0,
      forEach: vi.fn(),
    })
  ),
  onSnapshot: vi.fn((query, callback) => {
    // Handle both single callback and query + callback patterns
    const actualCallback = typeof query === 'function' ? query : callback;
    if (typeof actualCallback === 'function') {
      actualCallback({
        docs: [],
        empty: true,
        size: 0,
        forEach: vi.fn(),
      });
    }
    return vi.fn();
  }),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, toDate: () => new Date() })),
};

// Enhanced Auth Mock
export const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    getIdToken: vi.fn(() => Promise.resolve('mock-token')),
  },
  onAuthStateChanged: vi.fn((callback) => {
    setTimeout(() => callback(mockAuth.currentUser), 0);
    return vi.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockAuth.currentUser })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockAuth.currentUser })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: mockAuth.currentUser })),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  updateProfile: vi.fn(() => Promise.resolve()),
};

// Enhanced Storage Mock
export const mockStorage = {
  ref: vi.fn(() => ({
    put: vi.fn(() =>
      Promise.resolve({
        ref: {
          getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
          fullPath: 'documents/test-user/test.pdf',
        },
        metadata: {
          size: 1024,
          contentType: 'application/pdf',
        },
      })
    ),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
    delete: vi.fn(() => Promise.resolve()),
    putString: vi.fn(() =>
      Promise.resolve({
        ref: { getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')) },
      })
    ),
  })),
  deleteObject: vi.fn(() => Promise.resolve()),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((event, progress, error, complete) => {
      setTimeout(() => complete && complete(), 10);
    }),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  })),
};

// Enhanced Functions Mock
export const mockFunctions = {
  httpsCallable: vi.fn((name: string) => {
    return vi.fn().mockImplementation(async (data: unknown) => {
      void data;
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Return mock responses based on function name
      switch (name) {
        case 'generate_prompt':
          return {
            data: {
              generatedPrompt: 'Test generated prompt',
              title: 'Test Prompt',
              description: 'Test description',
            },
          };
        case 'execute_prompt_with_rag':
          return {
            data: {
              result: 'Test execution result',
              executionTime: 1500,
              tokensUsed: 100,
            },
          };
        default:
          return { data: {} };
      }
    });
  }),
};

// Enhanced Analytics Mock
export const mockAnalytics = {
  app: { name: 'test-app' },
  config: { measurementId: 'test-measurement-id' },
  logEvent: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
  setCurrentScreen: vi.fn(),
};

// Ensure global availability
declare global {
  var mockFirestore: typeof mockFirestore;
  var mockAuth: typeof mockAuth;
  var mockStorage: typeof mockStorage;
  var mockFunctions: typeof mockFunctions;
  var mockAnalytics: typeof mockAnalytics;
}

global.mockFirestore = mockFirestore;
global.mockAuth = mockAuth;
global.mockStorage = mockStorage;
global.mockFunctions = mockFunctions;
global.mockAnalytics = mockAnalytics;

// Export all mocks
export { mockFirestore as default };
