 

import { RenderOptions, act, render } from '@testing-library/react';
import React, { ReactElement, createContext } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Simple test utilities without global mocks
// Individual tests should handle their own mocking

// Mock user for testing
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

// Simple test wrapper without providers
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Test wrapper with QueryClient for components using React Query
export const TestWrapperWithQuery = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Simplified render function
export const renderWithRouter = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Async utilities for handling React state updates and eliminating act() warnings
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

export const waitForAsyncUpdates = async (timeout = 5000) => {
  void timeout;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushPromises();
  });
};

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
};

export const actAsync = async (fn: () => Promise<void>) => {
  await act(async () => {
    await fn();
    await flushPromises();
  });
};

export const waitForElement = async (
  getElement: () => HTMLElement | null,
  timeout = 5000
): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const element = getElement();
      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element not found within ${timeout}ms`));
        return;
      }

      setTimeout(check, 50);
    };

    check();
  });
};

// Legacy exports for backward compatibility
export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          exists: true,
          data: () => ({}),
          id: 'test-id',
        })
      ),
      set: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      onSnapshot: vi.fn((callback) => {
        callback({
          docs: [],
          forEach: vi.fn(),
        });
        return vi.fn(); // unsubscribe function
      }),
    })),
    add: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    where: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          docs: [],
          forEach: vi.fn(),
        })
      ),
      onSnapshot: vi.fn((callback) => {
        callback({
          docs: [],
          forEach: vi.fn(),
        });
        return vi.fn();
      }),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(() =>
        Promise.resolve({
          docs: [],
          forEach: vi.fn(),
        })
      ),
      onSnapshot: vi.fn((callback) => {
        callback({
          docs: [],
          forEach: vi.fn(),
        });
        return vi.fn();
      }),
    })),
    get: vi.fn(() =>
      Promise.resolve({
        docs: [],
        forEach: vi.fn(),
      })
    ),
    onSnapshot: vi.fn((callback) => {
      callback({
        docs: [],
        forEach: vi.fn(),
      });
      return vi.fn();
    }),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(() =>
      Promise.resolve({
        exists: true,
        data: () => ({}),
        id: 'test-id',
      })
    ),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn((callback) => {
      callback({
        exists: true,
        data: () => ({}),
        id: 'test-id',
      });
      return vi.fn();
    }),
  })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
};

export const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  signInWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
      },
    })
  ),
  createUserWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
      },
    })
  ),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((callback) => {
    callback({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    });
    return vi.fn(); // unsubscribe function
  }),
};

export const mockStorage = {
  ref: vi.fn(() => ({
    put: vi.fn(() =>
      Promise.resolve({
        ref: {
          getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
        },
      })
    ),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
    delete: vi.fn(() => Promise.resolve()),
  })),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((event, progressCallback, errorCallback, completeCallback) => {
      // Simulate upload progress
      setTimeout(() => progressCallback({ bytesTransferred: 50, totalBytes: 100 }), 10);
      setTimeout(() => progressCallback({ bytesTransferred: 100, totalBytes: 100 }), 20);
      setTimeout(() => completeCallback(), 30);
    }),
    snapshot: {
      ref: {
        getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
      },
    },
  })),
};

export const mockFunctions = {
  httpsCallable: vi.fn(() =>
    vi.fn(() =>
      Promise.resolve({
        data: {
          generatedPrompt: 'Test generated prompt',
          title: 'Test Prompt',
          description: 'Test description',
        },
      })
    )
  ),
};

// Create mock contexts
const MockAuthContext = createContext({
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
});

const MockToastContext = createContext({
  toasts: [],
  addToast: vi.fn(() => 'mock-toast-id'),
  removeToast: vi.fn(),
  clearAllToasts: vi.fn(),
});

const MockWorkspaceContext = createContext({
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
});

// Mock AuthProvider
export const MockAuthProvider: React.FC<{
  children: React.ReactNode;
  user?: { id: string; email: string; displayName: string };
}> = ({
  children,
  user = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  },
}) => {
  const mockAuthValue = {
    currentUser: user,
    userProfile: null,
    loading: false,
    signup: vi.fn(() => Promise.resolve()),
    login: vi.fn(() => Promise.resolve()),
    loginWithGoogle: vi.fn(() => Promise.resolve()),
    logout: vi.fn(() => Promise.resolve()),
    updateUserProfile: vi.fn(() => Promise.resolve()),
  };

  return <MockAuthContext.Provider value={mockAuthValue}>{children}</MockAuthContext.Provider>;
};

// Mock ToastProvider with actual toast rendering for tests
export const MockToastProvider: React.FC<{ children: React.ReactNode; maxToasts?: number }> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; message: string; type?: string; duration?: number }>
  >([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: { message: string; type?: string; duration?: number }) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      // Auto-remove toast after duration (except for errors with duration 0)
      if (newToast.duration && newToast.duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id);
        }, newToast.duration);

        // Store timeout ID for potential cleanup
        (newToast as { timeoutId?: NodeJS.Timeout }).timeoutId = timeoutId;
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const mockToastValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <MockToastContext.Provider value={mockToastValue}>
      {children}
      {/* Render toasts for testing */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`border-l-4 p-4 ${
                toast.type === 'success'
                  ? 'border-green-500 bg-green-50'
                  : toast.type === 'error'
                  ? 'border-red-500 bg-red-50'
                  : toast.type === 'warning'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex">
                <div className="flex-1">
                  <p className="text-sm font-medium">{toast.title}</p>
                  {toast.message && <p className="text-sm">{toast.message}</p>}
                </div>
                {toast.action && (
                  <button onClick={toast.action.onClick} className="ml-4 text-sm underline">
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MockToastContext.Provider>
  );
};

// Mock WorkspaceProvider
export const MockWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <MockWorkspaceContext.Provider value={mockWorkspaceValue}>
      {children}
    </MockWorkspaceContext.Provider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: { id: string; email: string; displayName: string };
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { user, initialEntries = ['/'], ...renderOptions }: CustomRenderOptions = {}
) {
  void initialEntries;

  // Create a new QueryClient for each test to ensure isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        cacheTime: 0, // Disable caching in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MockAuthProvider user={user}>
            <MockToastProvider>
              <MockWorkspaceProvider>{children}</MockWorkspaceProvider>
            </MockToastProvider>
          </MockAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };

// Note: Individual tests should handle their own mocking
// This file provides basic utilities only

// End of test utilities

// Mock useToast hook
export const useToast = () => {
  return {
    addToast: vi.fn(() => 'mock-toast-id'),
    removeToast: vi.fn(),
    clearAllToasts: vi.fn(),
  };
};

export const useInfoToast = () => {
  const { addToast } = useToast();
  return vi.fn((title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  });
};
