import { AlertTriangle, Home, RefreshCw } from '@/components/icons';
import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { Button } from '../marketing/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send error to Sentry (lazy load if not already loaded)
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      const sendToSentry = async () => {
        try {
          // Check if Sentry is already loaded
          const S: any = (globalThis as any)?.Sentry;
          if (S?.withScope && S?.captureException) {
            S.withScope((scope: any) => {
              scope.setContext('errorInfo', {
                componentStack: errorInfo.componentStack,
              });
              S.captureException(error);
            });
          } else {
            // Lazy load Sentry on first error
            const { initSentry } = await import('../../config/sentry');
            initSentry();
            const SentryModule: any = (globalThis as any)?.Sentry;
            if (SentryModule?.withScope && SentryModule?.captureException) {
              SentryModule.withScope((scope: any) => {
                scope.setContext('errorInfo', {
                  componentStack: errorInfo.componentStack,
                });
                SentryModule.captureException(error);
              });
            }
          }
        } catch {
          // Silently fail if Sentry loading/reporting fails
          // This is intentional to prevent error reporting from breaking the app
        }
      };
      sendToSentry();
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <h1 className="heading-subsection font-semibold text-ethos-navy text-center mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page or go
              back to the home page.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-body-small">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-red-600 dark:text-red-400 font-mono text-xs">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={this.handleRetry} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button variant="ethos" onClick={this.handleGoHome} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);

    // Send to Sentry (lazy load if not already loaded)
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      const sendToSentry = async () => {
        try {
          // Check if Sentry is already loaded
          const S: any = (globalThis as any)?.Sentry;
          if (S?.withScope && S?.captureException) {
            S.withScope((scope: any) => {
              if (errorInfo) {
                scope.setContext('errorInfo', errorInfo);
              }
              S.captureException(error);
            });
          } else {
            // Lazy load Sentry on first error
            const { initSentry } = await import('../../config/sentry');
            initSentry();
            const SentryModule: any = (globalThis as any)?.Sentry;
            if (SentryModule?.withScope && SentryModule?.captureException) {
              SentryModule.withScope((scope: any) => {
                if (errorInfo) {
                  scope.setContext('errorInfo', errorInfo);
                }
                SentryModule.captureException(error);
              });
            }
          }
        } catch {
          // Silently fail if Sentry loading/reporting fails
        }
      };
      sendToSentry();
    }
  };

  return handleError;
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
