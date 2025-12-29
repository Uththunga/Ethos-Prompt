/**
 * Error state component for Help Center
 * Displays user-friendly error messages with retry options
 */

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@/components/icons';

interface HelpCenterErrorProps {
  error: Error | null;
  onRetry: () => void;
}

export const HelpCenterError: React.FC<HelpCenterErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <ExclamationTriangleIcon className="h-16 w-16 text-destructive mx-auto mb-4" />

          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Unable to Load Help Center
          </h2>

          <p className="text-muted-foreground mb-6">
            {error?.message || 'An unexpected error occurred while loading help articles.'}
          </p>

          <div>
            <button
              onClick={onRetry}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Return to Dashboard
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please{' '}
              <a
                href="mailto:support@ragpromptlibrary.com"
                className="text-primary hover:text-primary/80 underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterError;
