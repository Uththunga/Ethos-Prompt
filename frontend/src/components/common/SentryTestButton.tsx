/**
 * Sentry Test Button Component
 *
 * Use this button to test Sentry error tracking in development
 * Remove or hide this component in production
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '../marketing/ui/button';
import { AlertTriangle } from '@/components/icons';

export function SentryTestButton() {
  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleTestError = () => {
    throw new Error('This is your first Sentry error! 🎉');
  };

  const handleTestMessage = () => {
    Sentry.captureMessage('Test message from Sentry Test Button', 'info');
    alert('Test message sent to Sentry!');
  };

  const handleTestException = () => {
    try {
      // Simulate an error
      throw new Error('Test exception captured manually');
    } catch (error) {
      Sentry.captureException(error);
      alert('Test exception sent to Sentry!');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-sm">Sentry Test (Dev Only)</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleTestError} variant="destructive" size="sm" className="text-xs">
          Throw Error
        </Button>

        <Button onClick={handleTestMessage} variant="secondary" size="sm" className="text-xs">
          Send Message
        </Button>

        <Button onClick={handleTestException} variant="outline" size="sm" className="text-xs">
          Capture Exception
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Check Sentry dashboard for errors
      </p>
    </div>
  );
}

/**
 * Simple error button for testing
 */
export function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Break the world
    </button>
  );
}
