/* eslint-disable react-refresh/only-export-components */

import { Button } from '@/components/marketing/ui/button';
import { AlertCircle, LogIn, RefreshCw, X } from '@/components/icons';
import React, { useEffect, useState } from 'react';

interface ErrorHandlerProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showLogin?: boolean;
  onLogin?: () => void;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showLogin = false,
  onLogin,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getErrorType = (error: Error) => {
    const message = error.message.toLowerCase();

    if (message.includes('auth') || message.includes('login') || message.includes('sign in')) {
      return 'auth';
    } else if (message.includes('network') || message.includes('connection')) {
      return 'network';
    } else if (message.includes('permission') || message.includes('denied')) {
      return 'permission';
    } else if (message.includes('unavailable') || message.includes('timeout')) {
      return 'service';
    } else {
      return 'general';
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return <LogIn className="w-5 h-5" />;
      case 'network':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'auth':
        return 'bg-ethos-purple-light border-ethos-purple-light text-ethos-purple-dark dark:bg-ethos-purple/20 dark:border-ethos-purple dark:text-ethos-purple-light';
      case 'network':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'permission':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      default:
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    }
  };

  const getSuggestion = (type: string) => {
    switch (type) {
      case 'auth':
        return 'Please sign in to your account to continue.';
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'permission':
        return 'You may need to sign out and sign in again to refresh your permissions.';
      case 'service':
        return 'The service is temporarily unavailable. Please try again in a few moments.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  const errorType = getErrorType(error);
  const colorClasses = getErrorColor(errorType);
  const icon = getErrorIcon(errorType);
  const suggestion = getSuggestion(errorType);

  return (
    <div className={`rounded-lg border p-4 mb-4 ${colorClasses}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {errorType === 'auth'
              ? 'Authentication Required'
              : errorType === 'network'
              ? 'Connection Error'
              : errorType === 'permission'
              ? 'Permission Error'
              : errorType === 'service'
              ? 'Service Unavailable'
              : 'Error'}
          </h3>
          <div className="mt-2 text-sm">
            <p>{error.message}</p>
            <p className="mt-1 opacity-75">{suggestion}</p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {showLogin && errorType === 'auth' && onLogin && (
              <Button variant="outline" size="sm" onClick={onLogin} className="flex items-center">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
            {showRetry && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <button onClick={handleDismiss} className="text-sm underline hover:no-underline">
              Dismiss
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing error state
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    console.error('Error handled:', errorObj);
    setError(errorObj);
  };

  const clearError = () => {
    setError(null);
  };

  const retryWithErrorHandling = async (operation: () => Promise<void>) => {
    try {
      clearError();
      await operation();
    } catch (error) {
      handleError(error as Error);
    }
  };

  return {
    error,
    handleError,
    clearError,
    retryWithErrorHandling,
  };
};

// Global error boundary for unhandled errors
export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full">
            <ErrorHandler
              error={this.state.error}
              onRetry={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              showRetry={true}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
