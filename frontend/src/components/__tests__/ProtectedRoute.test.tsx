import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// We will mock react-router-dom's Navigate to verify redirects
vi.mock('react-router-dom', async (orig) => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    // Capture the redirect target for assertions
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

// Helper to dynamically import the SUT after (re)mocking useAuth
async function importSUT() {
  const mod = await import('@/App');
  return { ProtectedRoute: mod.ProtectedRoute };
}

// Reset modules between tests so different mocks apply cleanly
beforeEach(() => {
  vi.resetModules();
  // Default: ensure no runtime bypass unless the test sets it
  try {
    localStorage.removeItem('e2eAuth');
  } catch {
    /* noop */
  }
  // Default: clear build-time E2E flag; tests will set as needed
  (import.meta as any).env = { ...(import.meta as any).env, VITE_E2E_MODE: 'false' };
});

afterEach(() => {
  vi.clearAllMocks();
});

// Factory to mock useAuth states
function mockUseAuth({ currentUser, loading }: { currentUser: any; loading: boolean }) {
  vi.doMock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ currentUser, loading }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /auth', async () => {
    mockUseAuth({ currentUser: null, loading: false });
    const { ProtectedRoute } = await importSUT();

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const nav = await screen.findByTestId('navigate');
    expect(nav).toHaveAttribute('data-to', '/auth');
  });

  it('allows authenticated users to access protected content', async () => {
    mockUseAuth({ currentUser: { uid: '123' }, loading: false });
    const { ProtectedRoute } = await importSUT();

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('shows LoadingSpinner while loading (no bypass)', async () => {
    mockUseAuth({ currentUser: null, loading: true });
    const { ProtectedRoute } = await importSUT();

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // The spinner has role="status" and aria-label="Loading"
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('bypasses auth when VITE_E2E_MODE=true (build-time E2E)', async () => {
    // Set build-time E2E flag via both Vitest env helper and import.meta override
    // Note: vi.stubEnv also updates import.meta.env in Vitest's Vite environment
    // @ts-expect-error - vitest helper
    vi.stubEnv('VITE_E2E_MODE', 'true');
    (import.meta as any).env = { ...(import.meta as any).env, VITE_E2E_MODE: 'true' };

    mockUseAuth({ currentUser: null, loading: false });
    const { ProtectedRoute } = await importSUT();

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('bypasses auth when localStorage.e2eAuth === "true" (runtime E2E)', async () => {
    // Set runtime override
    localStorage.setItem('e2eAuth', 'true');

    mockUseAuth({ currentUser: null, loading: false });
    const { ProtectedRoute } = await importSUT();

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
