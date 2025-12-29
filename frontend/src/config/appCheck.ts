/**
 * Firebase App Check Configuration
 * Provides additional security layer for Firebase services
 */

import { getToken, initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { app } from './firebase';

// App Check configuration
const APP_CHECK_CONFIG = {
  // ReCAPTCHA v3 site key from environment variable
  // Production: 6LfkA94rAAAAADof-VEhuAkLwjETCAkEBvmQuPIS
  // Development: Test key for local testing
  recaptchaSiteKey:
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',

  // Enable automatic token refresh
  isTokenAutoRefreshEnabled: true,

  // Debug token for development (set in environment)
  debugToken: import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN,
};

/**
 * Initialize Firebase App Check
 * Call this after Firebase app initialization
 */
export function initializeFirebaseAppCheck(): void {
  try {
    // Detect staging environment by hostname
    const isStaging =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('rag-prompt-library-staging.web.app') ||
        window.location.hostname.includes('rag-prompt-library-staging.firebaseapp.com') ||
        import.meta.env.VITE_APP_ENVIRONMENT === 'staging');

    // Disable App Check for staging environment (temporary for testing)
    if (isStaging) {
      console.log('🚫 App Check disabled for staging environment (testing mode)');
      return;
    }

    // Only initialize in production or when explicitly enabled
    if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_APP_CHECK === 'true') {
      console.log('Initializing Firebase App Check...');

      // Initialize App Check with ReCAPTCHA v3
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: APP_CHECK_CONFIG.isTokenAutoRefreshEnabled,
      });

      console.log('Firebase App Check initialized successfully');

      // Get initial token to verify setup
      getToken(appCheck)
        .then((result) => {
          console.log('App Check token obtained:', result.token.substring(0, 20) + '...');
        })
        .catch((error) => {
          console.warn('Failed to get App Check token:', error);
        });
    } else {
      console.log('App Check disabled in development mode');

      // Set debug token for development if provided
      if (APP_CHECK_CONFIG.debugToken) {
        // @ts-expect-error: Assigning debug token to global scope for emulator/dev usage
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = APP_CHECK_CONFIG.debugToken;
        console.log('App Check debug token set for development');
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase App Check:', error);

    // Don't throw error to prevent app from breaking
    // App Check is an additional security layer, not critical for basic functionality
  }
}

/**
 * Get current App Check token
 * Useful for debugging and monitoring
 */
export async function getAppCheckToken(): Promise<string | null> {
  try {
    if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_APP_CHECK === 'true') {
      const { getAppCheck } = await import('firebase/app-check');
      const appCheck = getAppCheck(app);
      const result = await getToken(appCheck);
      return result.token;
    }
    return null;
  } catch (error) {
    console.error('Failed to get App Check token:', error);
    return null;
  }
}

/**
 * Monitor App Check token refresh
 * Useful for debugging token issues
 */
export function monitorAppCheckTokens(): void {
  if (import.meta.env.DEV) {
    console.log('App Check token monitoring enabled');

    // Log token refresh events
    window.addEventListener('appcheck-token-refresh', (event) => {
      console.log('App Check token refreshed:', event);
    });

    // Periodic token status check
    setInterval(async () => {
      const token = await getAppCheckToken();
      if (token) {
        console.log('App Check token status: Active');
      } else {
        console.warn('App Check token status: Inactive');
      }
    }, 60000); // Check every minute
  }
}

/**
 * App Check error handler
 * Handles common App Check errors gracefully
 */
export async function handleAppCheckError(error: unknown): Promise<void> {
  // Normalize error shape
  const err = (error ?? {}) as { code?: string; message?: string };
  console.error('App Check error:', err);

  // Common error handling
  switch (err.code) {
    case 'appCheck/fetch-status-error':
      console.warn('App Check: Network error, retrying...');
      break;
    case 'appCheck/fetch-parse-error':
      console.warn('App Check: Parse error, check configuration');
      break;
    case 'appCheck/throttled':
      console.warn('App Check: Throttled, backing off...');
      break;
    default:
      console.warn('App Check: Unknown error:', err.message);
  }

  // Report to monitoring service if available
  try {
    const { analytics } = await import('../config/firebase');
    if (analytics) {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, 'app_check_error', {
        error_code: err.code ?? 'unknown',
        error_message: err.message ?? 'unknown',
      });
    }
  } catch (analyticsError) {
    console.debug('App Check analytics tracking failed:', analyticsError);
  }
}

// Export configuration for testing
export { APP_CHECK_CONFIG };
