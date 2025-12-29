 

import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, expect, vi } from 'vitest';

// Ensure React runs in development mode for tests
process.env.NODE_ENV = 'development';
(globalThis as any).__DEV__ = true;

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Global test setup and cleanup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  // Reset any timers
  vi.clearAllTimers();
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  // Clear any remaining timers
  vi.clearAllTimers();
});

// Ensure localStorage is available in test environment (some jsdom setups restrict it)
try {
  const testKey = '__vitest_localstorage_check__';
  window.localStorage.setItem(testKey, 'ok');
  window.localStorage.removeItem(testKey);
} catch {
  const store = new Map<string, string>();
  const memoryStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;

  Object.defineProperty(global, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
}

// Ensure DOM environment is properly set up
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Ensure HTMLElement.prototype.focus is configurable/writable for libraries that patch it
try {
  const originalFocus = HTMLElement.prototype.focus;
  Object.defineProperty(HTMLElement.prototype, 'focus', {
    configurable: true,
    writable: true,
    value: function focus(this: HTMLElement) {
      if (typeof originalFocus === 'function') {
        try {
          // Call original if available; swallow jsdom-specific errors
          return originalFocus.call(this);
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
  });
} catch {
  // ignore if jsdom/environment disallows redefinition
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement.getContext to satisfy axe-core color-contrast in jsdom
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    // minimal stub
    canvas: {},
  })),
  configurable: true,
});

// Mock performance.memory for memory tests
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
    totalJSHeapSize: 50 * 1024 * 1024, // 50MB
    jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
  },
});

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

global.cancelIdleCallback = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.alert for JSDOM
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

// Mock window.confirm for JSDOM
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

// Mock window.prompt for JSDOM
Object.defineProperty(window, 'prompt', {
  writable: true,
  value: vi.fn(() => 'test'),
});

// Import Firebase mocks
import {
  mockAnalytics,
  mockAuth,
  mockFirestore,
  mockFunctions,
  mockStorage,
} from './firebase-mocks';

// Enhanced Firebase module mocking with proper async handling
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: mockAuth.onAuthStateChanged,
  signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockAuth.createUserWithEmailAndPassword,
  signOut: mockAuth.signOut,
  signInWithPopup: mockAuth.signInWithPopup,
  sendPasswordResetEmail: mockAuth.sendPasswordResetEmail,
  updateProfile: mockAuth.updateProfile,
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: mockFunctions.httpsCallable,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
  collection: mockFirestore.collection,
  doc: mockFirestore.doc,
  query: mockFirestore.query,
  where: mockFirestore.where,
  orderBy: mockFirestore.orderBy,
  limit: mockFirestore.limit,
  onSnapshot: mockFirestore.onSnapshot,
  getDocs: mockFirestore.getDocs,
  getDoc: mockFirestore.getDoc,
  addDoc: mockFirestore.addDoc,
  updateDoc: mockFirestore.updateDoc,
  deleteDoc: mockFirestore.deleteDoc,
  serverTimestamp: mockFirestore.serverTimestamp,
}));

vi.mock('firebase/storage', () => ({
  ref: mockStorage.ref,
  deleteObject: mockStorage.deleteObject,
  uploadBytesResumable: mockStorage.uploadBytesResumable,
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => mockAnalytics),
  logEvent: mockAnalytics.logEvent,
  setUserId: mockAnalytics.setUserId,
  setUserProperties: mockAnalytics.setUserProperties,
  setCurrentScreen: mockAnalytics.setCurrentScreen,
}));

// Enhanced Firebase config mock with realistic behavior
vi.mock('../config/firebase', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      setTimeout(() => callback(null), 0);
      return vi.fn();
    }),
  };

  const mockDb = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  const mockAnalytics = {
    app: { name: 'test-app' },
    config: { measurementId: 'test-measurement-id' },
  };

  return {
    auth: mockAuth,
    db: mockDb,
    storage: {},
    functions: {},
    analytics: mockAnalytics,
    app: { name: 'test-app' },
  };
});

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => {
  const mockAuthValue = {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    userProfile: null,
    loading: false,
    signup: vi.fn(() => Promise.resolve()),
    login: vi.fn(() => Promise.resolve()),
    loginWithGoogle: vi.fn(() => Promise.resolve()),
    logout: vi.fn(() => Promise.resolve()),
    updateUserProfile: vi.fn(() => Promise.resolve()),
  };

  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => mockAuthValue,
  };
});

// Mock WorkspaceContext
vi.mock('../contexts/WorkspaceContext', () => {
  const mockWorkspaceValue = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null,
    createWorkspace: vi.fn(() => Promise.resolve('mock-workspace-id')),
    updateWorkspace: vi.fn(() => Promise.resolve()),
    deleteWorkspace: vi.fn(() => Promise.resolve()),
    joinWorkspace: vi.fn(() => Promise.resolve()),
    leaveWorkspace: vi.fn(() => Promise.resolve()),
    setCurrentWorkspace: vi.fn(),
    getUserRole: vi.fn(() => 'owner'),
    canUserEdit: vi.fn(() => true),
    canUserManage: vi.fn(() => true),
    canUserDelete: vi.fn(() => true),
    refreshWorkspaces: vi.fn(() => Promise.resolve()),
    clearError: vi.fn(),
  };

  return {
    WorkspaceProvider: ({ children }: { children: React.ReactNode }) => children,
    useWorkspace: () => mockWorkspaceValue,
  };
});

// Don't mock Toast component - we'll use our test implementation

// Mock File and FileReader for document upload tests
global.File = class MockFile {
  constructor(public bits: any[], public name: string, public options: any = {}) {
    this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
  size: number;
  type: string;
  lastModified: number;
} as any;

global.FileReader = class MockFileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onloadend: ((event: any) => void) | null = null;

  readAsText(file: any) {
    void file;
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'Mock file content';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 10);
  }

  readAsDataURL(file: any) {
    void file;
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,TW9jayBmaWxlIGNvbnRlbnQ=';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 10);
  }
} as any;

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: vi.fn(() => 'mock-object-url'),
  revokeObjectURL: vi.fn(),
} as any;

// Mock Blob
global.Blob = class MockBlob {
  constructor(public parts: any[], public options: any = {}) {
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
    this.type = options.type || '';
  }
  size: number;
  type: string;
} as any;

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: 'test-app-id',
  },
  writable: true,
});

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides,
});

export const createMockDocument = (overrides = {}) => ({
  id: 'test-doc-id',
  filename: 'test.pdf',
  originalName: 'test.pdf',
  filePath: 'documents/test-user/test.pdf',
  downloadURL: 'https://example.com/test.pdf',
  uploadedBy: 'test-user-id',
  uploadedAt: { seconds: Date.now() / 1000, toDate: () => new Date() },
  size: 1024,
  type: 'application/pdf',
  status: 'completed' as const,
  chunks: [],
  metadata: {
    originalSize: 1024,
    contentType: 'application/pdf',
  },
  ...overrides,
});

export const createMockPrompt = (overrides = {}) => ({
  id: 'test-prompt-id',
  title: 'Test Prompt',
  content: 'This is a test prompt',
  description: 'A test prompt for testing',
  variables: [],
  tags: ['test'],
  category: 'General',
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user-id',
  version: 1,
  ...overrides,
});

// Suppress console warnings in tests but keep errors visible
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)') ||
      args[0].includes('Warning: validateDOMNesting') ||
      args[0].includes('Warning: Each child in a list should have a unique "key" prop'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Keep errors visible but filter out known test-related ones
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)') ||
      args[0].includes('Warning: validateDOMNesting'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};
