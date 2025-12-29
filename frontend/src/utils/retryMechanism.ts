/**
 * Retry Mechanism Utilities
 * Provides robust retry logic for API calls and async operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  // New: simple delay option (ms). If provided, supersedes baseDelay for initial delay
  delay?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  // New: enable/disable exponential backoff (default: true)
  exponentialBackoff?: boolean;
  // New: add jitter to delays (default: false for testability)
  jitter?: boolean;
  retryCondition?: (error: unknown) => boolean;
  // onRetry(error, attempt, delayMs)
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalTime: number;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    delay,
    baseDelay = typeof delay === 'number' ? delay : 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    exponentialBackoff = true,
    jitter = false,
    // Default behavior: retry on any error unless caller constrains via retryCondition
    retryCondition = () => true,
    onRetry
  } = options;

  const startTime = Date.now();
  let lastError: unknown;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await operation();
      attemptsMade = attempt;
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };
    } catch (error: unknown) {
      lastError = error;
      attemptsMade = attempt;

      // Check if we should retry
      if (attempt === maxAttempts || !retryCondition(error)) {
        break;
      }

      // Calculate delay with optional exponential backoff
      const intendedDelay = Math.min(
        (exponentialBackoff ? baseDelay * Math.pow(backoffFactor, attempt - 1) : baseDelay),
        maxDelay
      );

      // Call retry callback with (error, attempt, delay)
      if (onRetry) {
        onRetry(error, attempt, intendedDelay);
      }

      // Optionally add jitter to prevent thundering herd (disabled in tests by default)
      const waitMs = jitter ? intendedDelay + Math.random() * 1000 : intendedDelay;

      await sleep(waitMs);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attemptsMade || 0,
    totalTime: Date.now() - startTime
  };
}

/**
 * Default retry condition - retry on network errors and 5xx status codes
 */
export function defaultRetryCondition(error: unknown): boolean {
  const err = (error ?? {}) as { name?: string; message?: string; status?: number; code?: string };
  const messageLc = err.message?.toLowerCase() ?? '';
  // Network errors
  if (err.name === 'NetworkError' || messageLc.includes('network')) {
    return true;
  }

  // Timeout errors
  if (err.name === 'TimeoutError' || messageLc.includes('timeout')) {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (typeof err.status === 'number' && err.status >= 500 && err.status < 600) {
    return true;
  }

  // HTTP 429 (rate limit)
  if (err.status === 429) {
    return true;
  }

  // Firebase specific errors
  if ((err as { code?: string }).code === 'unavailable' || (err as { code?: string }).code === 'deadline-exceeded') {
    return true;
  }

  return false;
}

/**
 * Retry condition for authentication errors
 */
export function authRetryCondition(error: unknown): boolean {
  const err = (error ?? {}) as { status?: number };
  // Don't retry auth errors (401, 403)
  if (err.status === 401 || err.status === 403) {
    return false;
  }

  return defaultRetryCondition(error);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for Firebase Functions calls
 */
export async function retryFirebaseFunction<T>(
  functionCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await retryAsync(functionCall, {
    maxAttempts: 3,
    delay: 1000,
    retryCondition: (error) => {
      const code = (error as { code?: string })?.code;
      // Retry on Firebase-specific errors
      if (code === 'unavailable' || code === 'deadline-exceeded') {
        return true;
      }
      return defaultRetryCondition(error);
    },
    ...options
  });

  if (result.success) {
    return result.data!;
  } else {
    throw result.error;
  }
}

/**
 * Retry wrapper for API calls with fetch
 */
export async function retryFetch(
  url: string,
  optionsOrRetry: RequestInit & Partial<RetryOptions> = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  // Allow passing retry controls inside the second parameter for convenience
  const {
    maxAttempts,
    delay,
    baseDelay,
    maxDelay,
    backoffFactor,
    exponentialBackoff,
    jitter,
    retryCondition,
    onRetry,
    ...requestInit
  } = optionsOrRetry as RequestInit & Partial<RetryOptions>;

  const mergedRetry: RetryOptions = {
    maxAttempts,
    delay,
    baseDelay,
    maxDelay,
    backoffFactor,
    exponentialBackoff,
    jitter,
    retryCondition,
    onRetry,
    ...retryOptions,
  };

  const result = await retryAsync(
    async () => {
      const response = await fetch(url, requestInit);

      // Throw error for non-ok responses to trigger retry logic
      if (!response.ok) {
        const httpError = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status?: number };
        httpError.status = response.status;
        throw httpError;
      }

      return response;
    },
    {
      maxAttempts: 3,
      delay: 1000,
      ...mergedRetry
    }
  );

  if (result.success) {
    return result.data!;
  } else {
    throw result.error;
  }
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  private failureThreshold: number;
  private recoveryTimeout: number;

  constructor(
    failureThreshold = 5,
    recoveryTimeout = 60000 // 1 minute
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Debounced retry - useful for user input scenarios
 */
export function createDebouncedRetry<T extends unknown[]>(
  operation: (...args: T) => Promise<unknown>,
  delay = 300,
  retryOptions: RetryOptions = {}
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  // Coalesce multiple calls: resolve all pending promises with the same result
  let pendingResolves: Array<(value: unknown) => void> = [];
  let pendingRejects: Array<(reason?: unknown) => void> = [];

  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise<unknown>((resolve, reject) => {
      pendingResolves.push(resolve);
      pendingRejects.push(reject);

      timeoutId = setTimeout(async () => {
        try {
          const result = await retryAsync(() => operation(...args), retryOptions);
          if (result.success) {
            pendingResolves.forEach(r => r(result.data));
          } else {
            pendingRejects.forEach(r => r(result.error));
          }
        } catch (error) {
          pendingRejects.forEach(r => r(error));
        } finally {
          pendingResolves = [];
          pendingRejects = [];
          timeoutId = undefined;
        }
      }, delay);
    });
  };
}

/**
 * Batch retry - retry multiple operations with shared configuration
 */
export async function retryBatch<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<RetryResult<T>[]> {
  const promises = operations.map(op => retryAsync(op, options));
  return Promise.all(promises);
}

/**
 * Progressive retry - increase retry attempts for more important operations
 */
export async function progressiveRetry<T>(
  operation: () => Promise<T>,
  importance: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<T> {
  const configs = {
    low: { maxAttempts: 2, baseDelay: 500 },
    medium: { maxAttempts: 3, baseDelay: 1000 },
    high: { maxAttempts: 5, baseDelay: 1000 },
    critical: { maxAttempts: 10, baseDelay: 500, maxDelay: 5000 }
  };

  const result = await retryAsync(operation, configs[importance]);

  if (result.success) {
    return result.data!;
  } else {
    throw result.error;
  }
}
