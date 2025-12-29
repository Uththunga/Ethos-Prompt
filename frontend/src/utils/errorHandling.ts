/**
 * Error handling utilities for the AI-assisted prompt generation feature
 */

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestions?: string[];
}

export class PromptGenerationError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly suggestions: string[];

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'PromptGenerationError';
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.retryable = details.retryable;
    this.suggestions = details.suggestions || [];
  }
}

/**
 * Maps Firebase function errors to user-friendly messages
 */
export function mapFirebaseError(error: { code?: string; message?: string }): ErrorDetails {
  const code = error.code || 'unknown';
  const message = error.message || 'An unknown error occurred';

  switch (code) {
    case 'unauthenticated':
      return {
        code,
        message,
        userMessage: 'Please sign in to generate prompts',
        retryable: false,
        suggestions: ['Sign in to your account', 'Refresh the page and try again']
      };

    case 'permission-denied':
      return {
        code,
        message,
        userMessage: 'You do not have permission to generate prompts',
        retryable: false,
        suggestions: [
          'Check your account permissions',
          'Contact support if you believe this is an error'
        ]
      };

    case 'unavailable':
      return {
        code,
        message,
        userMessage: 'The prompt generation service is temporarily unavailable',
        retryable: true,
        suggestions: [
          'Try again in a few minutes',
          'Check your internet connection',
          'Contact support if the problem persists'
        ]
      };

    case 'deadline-exceeded':
      return {
        code,
        message,
        userMessage: 'The request took too long to complete',
        retryable: true,
        suggestions: [
          'Try again with a simpler prompt',
          'Reduce the number of variables',
          'Check your internet connection'
        ]
      };

    case 'resource-exhausted':
      return {
        code,
        message,
        userMessage: 'API quota exceeded. Please try again later',
        retryable: true,
        suggestions: [
          'Wait a few minutes before trying again',
          'Consider upgrading your plan for higher limits',
          'Try generating a simpler prompt'
        ]
      };

    case 'invalid-argument':
      return {
        code,
        message,
        userMessage: 'Invalid request data provided',
        retryable: false,
        suggestions: [
          'Check that all required fields are filled',
          'Ensure variable names are valid',
          'Review your input and try again'
        ]
      };

    case 'failed-precondition':
      return {
        code,
        message,
        userMessage: 'Request cannot be processed in the current state',
        retryable: false,
        suggestions: [
          'Refresh the page and try again',
          'Check your account status',
          'Contact support if the problem persists'
        ]
      };

    case 'internal':
      return {
        code,
        message,
        userMessage: 'An internal server error occurred',
        retryable: true,
        suggestions: [
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ]
      };

    default:
      // Handle quota-related errors
      if (message.toLowerCase().includes('quota')) {
        return {
          code: 'quota-exceeded',
          message,
          userMessage: 'API quota exceeded. Please try again later',
          retryable: true,
          suggestions: [
            'Wait a few minutes before trying again',
            'Consider upgrading your plan for higher limits'
          ]
        };
      }

      // Handle network-related errors
      if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
        return {
          code: 'network-error',
          message,
          userMessage: 'Network connection error',
          retryable: true,
          suggestions: [
            'Check your internet connection',
            'Try again in a few moments',
            'Refresh the page if the problem persists'
          ]
        };
      }

      // Handle timeout errors
      if (message.toLowerCase().includes('timeout')) {
        return {
          code: 'timeout',
          message,
          userMessage: 'Request timed out',
          retryable: true,
          suggestions: [
            'Try again with a simpler request',
            'Check your internet connection',
            'Reduce the complexity of your prompt requirements'
          ]
        };
      }

      return {
        code: 'unknown',
        message,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        suggestions: [
          'Try again in a few moments',
          'Refresh the page if the problem persists',
          'Contact support if you continue to experience issues'
        ]
      };
  }
}

/**
 * Retry mechanism for retryable errors
 */
export class RetryManager {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    isRetryable: (error: Error) => boolean = () => true
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on the last attempt or if error is not retryable
        if (attempt === this.maxRetries || !isRetryable(error)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError;
  }
}

/**
 * Validation error handling
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function validatePromptGenerationRequest(request: {
  title?: string;
  description?: string;
  category?: string;
  inputVariables?: Array<{ name?: string; type?: string; description?: string }>;
  template?: string;
  tags?: string[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!request.purpose?.trim()) {
    errors.push({
      field: 'purpose',
      message: 'Purpose is required',
      code: 'required'
    });
  }

  if (!request.industry?.trim()) {
    errors.push({
      field: 'industry',
      message: 'Industry is required',
      code: 'required'
    });
  }

  if (!request.useCase?.trim()) {
    errors.push({
      field: 'useCase',
      message: 'Use case is required',
      code: 'required'
    });
  }

  if (request.purpose && request.purpose.length > 500) {
    errors.push({
      field: 'purpose',
      message: 'Purpose must be less than 500 characters',
      code: 'max_length'
    });
  }

  if (request.inputVariables && Array.isArray(request.inputVariables)) {
    request.inputVariables.forEach((variable: { name?: string; type?: string; description?: string }, index: number) => {
      if (!variable.name?.trim()) {
        errors.push({
          field: `inputVariables[${index}].name`,
          message: `Variable ${index + 1}: Name is required`,
          code: 'required'
        });
      }

      if (!variable.description?.trim()) {
        errors.push({
          field: `inputVariables[${index}].description`,
          message: `Variable ${index + 1}: Description is required`,
          code: 'required'
        });
      }

      if (variable.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
        errors.push({
          field: `inputVariables[${index}].name`,
          message: `Variable ${index + 1}: Name must be a valid identifier (letters, numbers, underscore)`,
          code: 'invalid_format'
        });
      }

      if (variable.name && variable.name.length > 50) {
        errors.push({
          field: `inputVariables[${index}].name`,
          message: `Variable ${index + 1}: Name must be less than 50 characters`,
          code: 'max_length'
        });
      }
    });
  }

  return errors;
}

/**
 * Error reporting utility
 */
export function reportError(error: Error, context: Record<string, unknown> = {}) {
  // In a real application, this would send error reports to a service like Sentry
  console.error('Error reported:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
}

/**
 * User-friendly error display utility
 */
export function formatErrorForUser(error: Error | { message?: string; code?: string }): {
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
} {
  const errorDetails = mapFirebaseError(error);

  return {
    title: getErrorTitle(errorDetails.code),
    message: errorDetails.userMessage,
    suggestions: errorDetails.suggestions || [],
    canRetry: errorDetails.retryable
  };
}

function getErrorTitle(code: string): string {
  switch (code) {
    case 'unauthenticated':
      return 'Authentication Required';
    case 'permission-denied':
      return 'Permission Denied';
    case 'unavailable':
      return 'Service Unavailable';
    case 'deadline-exceeded':
    case 'timeout':
      return 'Request Timeout';
    case 'resource-exhausted':
    case 'quota-exceeded':
      return 'Quota Exceeded';
    case 'invalid-argument':
      return 'Invalid Request';
    case 'network-error':
      return 'Network Error';
    case 'internal':
      return 'Server Error';
    default:
      return 'Unexpected Error';
  }
}
