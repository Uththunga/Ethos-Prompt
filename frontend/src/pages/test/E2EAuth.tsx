import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

/**
 * E2EAuth (test-only): ensure an email/password test user exists in emulator and sign in, then redirect.
 * Guarded to run only when VITE_ENABLE_EMULATORS === 'true'.
 */
export default function E2EAuth() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<string>('initializing');
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const run = async () => {
      try {
        if (
          import.meta.env.VITE_ENABLE_EMULATORS !== 'true' &&
          import.meta.env.VITE_APP_ENVIRONMENT !== 'staging'
        ) {
          setStatus('disabled');
          return;
        }
        const redirect = params.get('redirect') || '/dashboard';
        if (currentUser) {
          setStatus('already-authenticated');
          navigate(redirect);
          return;
        }
        setStatus('creating');
        const email = 'e2e-user@example.com';
        const pwd = 'TestPwd!12345';
        try {
          await signInWithEmailAndPassword(auth, email, pwd);
        } catch (err: any) {
          if (err?.code === 'auth/user-not-found') {
            const { user } = await createUserWithEmailAndPassword(auth, email, pwd);
            await updateProfile(user, { displayName: 'E2E User' });
          } else {
            throw err;
          }
        }
        // Wait until auth state is fully available
        const start = Date.now();
        while (!auth.currentUser && Date.now() - start < 10000) {
          await new Promise((r) => setTimeout(r, 100));
        }
        // Ensure overlays are disabled and panels collapsed for deterministic E2E
        try {
          localStorage.setItem('disableOnboarding', 'true');
          localStorage.setItem('rightPanelCollapsed', 'true');
          localStorage.setItem('sidebarCollapsed', 'true');
          localStorage.setItem('e2eAuth', 'true');
        } catch {
          // Silently fail if localStorage is not available (e.g., private browsing)
        }

        setStatus('success');
        navigate(redirect);
      } catch (e) {
        const msg = (e as any)?.message || String(e);
        console.error('E2EAuth failed:', e);
        setStatus(`error: ${msg}`);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-h3 mb-4">E2E Auth Helper</h1>
        <p className="text-body mb-4" data-testid="e2e-auth-status">
          Status: {status}
        </p>
        {status === 'disabled' && (
          <p className="text-caption text-red-600 mb-4">
            E2E auth disabled: VITE_ENABLE_EMULATORS is not true.
          </p>
        )}
      </div>
    </div>
  );
}
