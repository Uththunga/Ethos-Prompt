/**
 * Sentry Error Tracking Configuration
 *
 * Initializes Sentry for error tracking, performance monitoring, and logging
 * in the RAG Prompt Library application.
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export function initializeSentry() {
  // Only initialize in production or when explicitly enabled
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'true') {
    console.log('📊 Sentry error reporting disabled');
    return;
  }

  const environment = import.meta.env.VITE_APP_ENVIRONMENT || 'production';
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️ Sentry DSN not configured. Error reporting disabled.');
    return;
  }

  Sentry.init({
    dsn: dsn,
    environment: environment,

    // Enable logs
    enableLogs: true,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace propagation targets
        tracePropagationTargets: [
          'localhost',
          'rag-prompt-library.web.app',
          'rag-prompt-library.firebaseapp.com',
          /^https:\/\/.*\.cloudfunctions\.net/,
          /^https:\/\/.*\.googleapis\.com/,
        ],
        // Enable automatic instrumentation
        enableInp: true,
      }),

      // Session replay for debugging
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text for privacy
        blockAllMedia: true, // Block all media for privacy
        maskAllInputs: true, // Mask all inputs for security
      }),

      // Console logging integration (commented out - not available in this Sentry version)
      // Sentry.consoleIntegration({
      //   levels: ['error'], // Only capture console.error
      // }),

      // HTTP client integration for API calls
      Sentry.httpClientIntegration({
        failedRequestStatusCodes: [400, 599], // Track 4xx and 5xx errors
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    tracePropagationTargets: [
      'localhost',
      'rag-prompt-library.web.app',
      /^https:\/\/.*\.cloudfunctions\.net/,
    ],

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // PII (Personally Identifiable Information)
    sendDefaultPii: false, // Don't send PII by default for privacy

    // Before send hook - filter and modify events
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.level === 'warning' || event.level === 'info') {
        return null;
      }

      // Filter out known non-critical errors
      const ignoredErrors = [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed', // Temporary network issues
      ];

      const errorMessage = event.exception?.values?.[0]?.value || '';
      if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
        return null;
      }

      // Strip sensitive data
      if (event.request?.headers) {
        delete (event.request.headers as Record<string, unknown>)['authorization'];
        delete (event.request.headers as Record<string, unknown>)['cookie'];
      }

      // Remove sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },

    // Before breadcrumb hook - filter breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out console breadcrumbs except errors
      if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
        return null;
      }

      // Filter out fetch breadcrumbs for analytics
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url?.includes('analytics')) {
        return null;
      }

      return breadcrumb;
    },

    // Error filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Random plugins/extensions
      'fb_xd_fragment',
      // Network errors (temporary)
      'NetworkError',
      'Failed to fetch',
      // React hydration errors (non-critical)
      'Hydration failed',
    ],

    // Deny URLs (don't track errors from these sources)
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });

  // Set user context (without PII)
  const userId = localStorage.getItem('userId');
  if (userId) {
    Sentry.setUser({
      id: userId,
      // Don't include email or other PII
    });
  }

  // Set custom tags
  Sentry.setTag('app.version', import.meta.env.VITE_APP_VERSION || '1.0.0');
  Sentry.setTag('app.environment', environment);

  // Expose Sentry globally for ErrorBoundary
  if (typeof window !== 'undefined') {
    (window as any).Sentry = Sentry;
  }

  console.log('✅ Sentry error tracking initialized');
}

// Legacy function name for backward compatibility
export const initSentry = initializeSentry;

/**
 * Sentry logger instance
 * Use this for structured logging
 */
export const { logger } = Sentry;

/**
 * Capture an exception manually
 * Use this in try-catch blocks
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a message manually
 * Use this for important events
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Start a performance span
 * Use this to track performance of specific operations
 */
export function startSpan<T>(
  options: {
    op: string;
    name: string;
    attributes?: Record<string, any>;
  },
  callback: (span: Sentry.Span) => T
): T {
  return Sentry.startSpan(options, callback);
}

/**
 * Track API call performance
 */
export async function trackApiCall<T>(
  endpoint: string,
  method: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `${method} ${endpoint}`,
      attributes: {
        'http.method': method,
        'http.url': endpoint,
      },
    },
    async (span) => {
      try {
        const result = await callback();
        span.setStatus({ code: 1, message: 'ok' }); // Success
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' }); // Error
        throw error;
      }
    }
  );
}

/**
 * Track user action performance
 */
export function trackUserAction<T>(
  actionName: string,
  callback: () => T,
  attributes?: Record<string, any>
): T {
  return Sentry.startSpan(
    {
      op: 'ui.action',
      name: actionName,
      attributes: attributes || {},
    },
    callback
  );
}

/**
 * Set user context
 */
export function setUser(userId: string, username?: string) {
  Sentry.setUser({
    id: userId,
    username: username,
    // Don't include email or other PII
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}
