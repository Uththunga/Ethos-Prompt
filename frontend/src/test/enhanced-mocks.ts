 

/**
 * Enhanced Test Mocks for Complex Component Testing
 * Provides comprehensive mocking for Firebase, async operations, and state management
 */

import { vi } from 'vitest';

// Enhanced Firebase Auth Mock
export const createEnhancedAuthMock = () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
    reload: vi.fn().mockResolvedValue(undefined),
  };

  return {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      // Simulate async auth state change
      setTimeout(() => callback(null), 0);
      return vi.fn(); // unsubscribe function
    }),
    signInWithEmailAndPassword: vi.fn().mockImplementation(async (email, password) => { void password;
      if (email === 'error@test.com') {
        throw new Error('auth/user-not-found');
      }
      return { user: { ...mockUser, email } };
    }),
    createUserWithEmailAndPassword: vi.fn().mockImplementation(async (email, password) => { void password;
      if (email === 'existing@test.com') {
        throw new Error('auth/email-already-in-use');
      }
      return { user: { ...mockUser, email } };
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
    signInWithPopup: vi.fn().mockResolvedValue({ user: mockUser }),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    mockUser,
  };
};

// Enhanced Firestore Mock with realistic data
export const createEnhancedFirestoreMock = () => {
  const mockDocuments = new Map();
  const mockCollections = new Map();
  void mockCollections;

  const createMockDoc = (id: string, data: Record<string, unknown> = {}) => ({
    id,
    exists: () => Object.keys(data).length > 0,
    data: () => data,
    ref: { id, path: `collection/${id}` },
  });

  const createMockQuerySnapshot = (docs: Array<Record<string, unknown>> = []) => ({
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: { id: string }) => void) => (docs as Array<{ id: string }>).forEach(callback),
  });

  return {
    collection: vi.fn((path: string) => {
      const collectionRef = {
        doc: vi.fn((id?: string) => {
          const docId = id || `auto-${Date.now()}`;
          const docRef = {
            id: docId,
            get: vi.fn().mockImplementation(async () => {
              const data = mockDocuments.get(`${path}/${docId}`) || {};
              return createMockDoc(docId, data);
            }),
            set: vi.fn().mockImplementation(async (data: any) => {
              mockDocuments.set(`${path}/${docId}`, data);
              return undefined;
            }),
            update: vi.fn().mockImplementation(async (data: any) => {
              const existing = mockDocuments.get(`${path}/${docId}`) || {};
              mockDocuments.set(`${path}/${docId}`, { ...existing, ...data });
              return undefined;
            }),
            delete: vi.fn().mockImplementation(async () => {
              mockDocuments.delete(`${path}/${docId}`);
              return undefined;
            }),
            onSnapshot: vi.fn((callback) => {
              // Simulate real-time updates
              const data = mockDocuments.get(`${path}/${docId}`) || {};
              setTimeout(() => callback(createMockDoc(docId, data)), 0);
              return vi.fn(); // unsubscribe
            }),
          };
          return docRef;
        }),
        add: vi.fn().mockImplementation(async (data: any) => {
          const docId = `auto-${Date.now()}`;
          mockDocuments.set(`${path}/${docId}`, data);
          return { id: docId };
        }),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(async () => {
          const docs = Array.from(mockDocuments.entries())
            .filter(([key]) => key.startsWith(path))
            .map(([key, data]) => {
              const id = key.split('/').pop() || '';
              return createMockDoc(id, data);
            });
          return createMockQuerySnapshot(docs);
        }),
        onSnapshot: vi.fn((callback) => {
          const docs = Array.from(mockDocuments.entries())
            .filter(([key]) => key.startsWith(path))
            .map(([key, data]) => {
              const id = key.split('/').pop() || '';
              return createMockDoc(id, data);
            });
          setTimeout(() => callback(createMockQuerySnapshot(docs)), 0);
          return vi.fn(); // unsubscribe
        }),
      };
      return collectionRef;
    }),
    doc: vi.fn((path: string) => {
      const [, docId] = path.split('/');
      return {
        id: docId,
        get: vi.fn().mockImplementation(async () => {
          const data = mockDocuments.get(path) || {};
          return createMockDoc(docId, data);
        }),
        set: vi.fn().mockImplementation(async (data: Record<string, unknown>) => {
          mockDocuments.set(path, data);
          return undefined;
        }),
        update: vi.fn().mockImplementation(async (data: any) => {
          const existing = mockDocuments.get(path) || {};
          mockDocuments.set(path, { ...existing, ...data });
          return undefined;
        }),
        delete: vi.fn().mockImplementation(async () => {
          mockDocuments.delete(path);
          return undefined;
        }),
      };
    }),
    // Utility methods for testing
    _setMockData: (path: string, data: any) => mockDocuments.set(path, data),
    _getMockData: (path: string) => mockDocuments.get(path),
    _clearMockData: () => mockDocuments.clear(),
  };
};

// Enhanced Storage Mock
export const createEnhancedStorageMock = () => {
  const mockFiles = new Map();

  return {
    ref: vi.fn((path?: string) => ({
      uploadBytes: vi.fn().mockImplementation(async (file: File) => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('storage/file-too-large');
        }
        mockFiles.set(path || file.name, {
          name: file.name,
          size: file.size,
          type: file.type,
          url: `https://mock-storage.com/${file.name}`,
        });
        return {
          metadata: {
            name: file.name,
            size: file.size,
            contentType: file.type,
          },
        };
      }),
      getDownloadURL: vi.fn().mockImplementation(async () => {
        const file = mockFiles.get(path);
        if (!file) throw new Error('storage/object-not-found');
        return file.url;
      }),
      delete: vi.fn().mockImplementation(async () => {
        if (!mockFiles.has(path)) throw new Error('storage/object-not-found');
        mockFiles.delete(path);
        return undefined;
      }),
    })),
    _setMockFile: (path: string, file: any) => mockFiles.set(path, file),
    _getMockFile: (path: string) => mockFiles.get(path),
    _clearMockFiles: () => mockFiles.clear(),
  };
};

// Enhanced Functions Mock
export const createEnhancedFunctionsMock = () => {
  const mockResponses = new Map();

  return {
    httpsCallable: vi.fn((name: string) => {
      return vi.fn().mockImplementation(async (data: unknown) => { void data;
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check for mock responses
        if (mockResponses.has(name)) {
          const response = mockResponses.get(name);
          if (response.error) {
            throw new Error(response.error);
          }
          return { data: response.data };
        }

        // Default responses
        switch (name) {
          case 'executePrompt':
            return {
              data: {
                result: 'Mock AI response',
                usage: { tokens: 100, cost: 0.01 },
                model: 'gpt-3.5-turbo',
              },
            };
          case 'generatePrompt':
            return {
              data: {
                prompt: 'Generated mock prompt',
                variables: ['input', 'context'],
                metadata: { quality: 0.9 },
              },
            };
          case 'processDocument':
            return {
              data: {
                chunks: 5,
                status: 'completed',
                processingTime: 1500,
              },
            };
          default:
            return { data: { success: true } };
        }
      });
    }),
    _setMockResponse: (functionName: string, response: any) =>
      mockResponses.set(functionName, response),
    _clearMockResponses: () => mockResponses.clear(),
  };
};

// Async Operation Helpers
export const createAsyncTestHelpers = () => ({
  waitForAsync: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),

  waitForCondition: async (condition: () => boolean, timeout: number = 5000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },

  mockTimers: () => {
    vi.useFakeTimers();
    return {
      advance: (ms: number) => vi.advanceTimersByTime(ms),
      runAll: () => vi.runAllTimers(),
      restore: () => vi.useRealTimers(),
    };
  },
});

// State Management Test Helpers
export const createStateTestHelpers = () => ({
  createMockContext: <T>(initialValue: T) => {
    let currentValue = initialValue;
    const listeners = new Set<(value: T) => void>();

    return {
      getValue: () => currentValue,
      setValue: (value: T) => {
        currentValue = value;
        listeners.forEach(listener => listener(value));
      },
      subscribe: (listener: (value: T) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      reset: () => {
        currentValue = initialValue;
        listeners.clear();
      },
    };
  },

  mockLocalStorage: () => {
    const storage = new Map();
    return {
      getItem: vi.fn((key: string) => storage.get(key) || null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      _getStorage: () => storage,
    };
  },
});

// Export all enhanced mocks
export const enhancedMocks = {
  auth: createEnhancedAuthMock(),
  firestore: createEnhancedFirestoreMock(),
  storage: createEnhancedStorageMock(),
  functions: createEnhancedFunctionsMock(),
  async: createAsyncTestHelpers(),
  state: createStateTestHelpers(),
};
