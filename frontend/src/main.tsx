import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ChunkErrorHandler } from './utils/chunkErrorHandler';
import { initializeMonitoring } from './utils/monitoring';

// Import Firebase test functions for debugging
import { testFirebaseConnection } from './test-firebase-connection.js';

// Initialize chunk error handling (prod only to avoid HMR loops)
if (import.meta.env.PROD) {
  ChunkErrorHandler.initialize();
}

// Register/unregister service worker depending on env flags to avoid stale caches in staging/E2E
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const isStaging = import.meta.env.VITE_APP_ENVIRONMENT === 'staging';
  const enableSW =
    !isStaging &&
    import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'false' &&
    import.meta.env.VITE_ENABLE_OFFLINE_SUPPORT !== 'false';

  window.addEventListener('load', async () => {
    try {
      if (!enableSW) {
        // Unregister any existing service workers and clear caches to prevent stale assets during E2E/staging
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {
          // ignore cache errors
        }
        console.log('SW disabled via env; unregistered and cleared caches');
        return;
      }

      // SW enabled: ensure latest worker is active
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) {
        await existingRegistration.update();
        console.log('SW updated: ', existingRegistration);
      } else {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered: ', registration);
      }

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('SW controller changed - reloading page');
        window.location.reload();
      });
    } catch (error) {
      console.log('SW registration/unregistration failed: ', error);
    }
  });
}

// Staging-only load event fallback for Firefox: ensure page.reload() waits do not hang
if (
  import.meta.env.PROD &&
  (import.meta.env.VITE_APP_ENVIRONMENT === 'staging' || import.meta.env.VITE_E2E_MODE === 'true')
) {
  try {
    const ua = navigator.userAgent || '';
    const isFirefox = /Firefox\//.test(ua);
    if (isFirefox) {
      // If the load event hasn't fired within 3s after initial script execution, dispatch a synthetic one.
      // This mitigates rare hangs observed only in Firefox when waiting for `load` during page.reload() in E2E.
      setTimeout(() => {
        try {
          const alreadyComplete = document.readyState === 'complete';
          if (!alreadyComplete) {
            window.dispatchEvent(new Event('load'));
            console.log('[E2E] Dispatched synthetic load event fallback for Firefox (staging)');
          }
        } catch {
          // Silently fail if event dispatch fails (browser compatibility)
        }
      }, 3000);
    }
  } catch {
    // Silently fail if E2E setup fails (not critical for production)
  }
}

// Initialize monitoring system
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_MONITORING === 'true') {
  initializeMonitoring();
}

// Lazy load Sentry only in production and when error reporting is enabled
// This reduces the initial bundle size by ~458 KB
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
  import('./config/sentry')
    .then((module) => {
      module.initSentry();
      console.log('✅ Sentry loaded and initialized');
    })
    .catch((error) => {
      console.warn('⚠️ Failed to load Sentry:', error);
    });
}

// Make test functions available globally for debugging
if (import.meta.env.DEV) {
  window.testFirebaseConnection = testFirebaseConnection;
  console.log('🧪 Firebase test functions loaded for debugging');
  console.log('🔧 Enhanced debug tools available via window.debugPromptSaving');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
