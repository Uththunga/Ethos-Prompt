 

/**
 * Timing Utilities Tests
 * Tests for debounce/throttle utilities and timing-sensitive functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Retry utility function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Rate limiter utility
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed * this.refillRate / 1000);

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

describe('Timing Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Debounce Function', () => {
    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      vi.advanceTimersByTime(200);

      debouncedFn('second');
      vi.advanceTimersByTime(200);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });

    it('should handle multiple arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should handle rapid successive calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedFn(`call-${i}`);
        vi.advanceTimersByTime(10);
      }

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for final debounce
      vi.advanceTimersByTime(100);

      // Should be called only once with the last value
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call-9');
    });
  });

  describe('Throttle Function', () => {
    it('should limit function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('first');
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn('second');
      expect(mockFn).toHaveBeenCalledTimes(1); // Should not call again

      vi.advanceTimersByTime(100);
      throttledFn('third');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid calls correctly', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      // First call should go through
      throttledFn('call-1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Rapid calls within throttle window
      for (let i = 2; i <= 10; i++) {
        throttledFn(`call-${i}`);
        vi.advanceTimersByTime(10);
      }

      // Should still be only 1 call
      expect(mockFn).toHaveBeenCalledTimes(1);

      // After throttle window
      vi.advanceTimersByTime(50); // Total 150ms
      throttledFn('call-11');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should preserve function arguments', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1', 42, { key: 'value' });
      expect(mockFn).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
    });
  });

  describe('Retry with Backoff', () => {
    it('should succeed on first try', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure with exponential backoff', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');

      // Use real timers for this test to avoid timing conflicts
      vi.useRealTimers();

      try {
        const result = await retryWithBackoff(mockFn, 3, 10);
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(3);
      } finally {
        // Restore fake timers
        vi.useFakeTimers();
      }
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      // Use real timers for this test to avoid timing conflicts
      vi.useRealTimers();

      try {
        await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Always fails');
        expect(mockFn).toHaveBeenCalledTimes(2);
      } finally {
        // Restore fake timers
        vi.useFakeTimers();
      }
    });
  });

  describe('Rate Limiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 1); // 5 tokens, 1 per second

      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
    });

    it('should reject requests when limit exceeded', () => {
      const limiter = new RateLimiter(2, 1); // 2 tokens, 1 per second

      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(false); // Should be rejected
    });

    it('should refill tokens over time', () => {
      // Use real timers for this test since RateLimiter uses Date.now()
      vi.useRealTimers();

      const limiter = new RateLimiter(2, 2); // 2 tokens, 2 per second

      // Consume all tokens
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(false);

      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let mockTime = originalNow();
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Advance time by 500ms (should add 1 token at 2/second rate)
      mockTime += 500;
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(false);

      // Advance time by another 500ms
      mockTime += 500;
      expect(limiter.tryConsume()).toBe(true);

      // Restore original Date.now and fake timers
      Date.now.mockRestore();
      vi.useFakeTimers();
    });

    it('should handle multiple token consumption', () => {
      const limiter = new RateLimiter(10, 1);

      expect(limiter.tryConsume(5)).toBe(true);
      expect(limiter.tryConsume(3)).toBe(true);
      expect(limiter.tryConsume(3)).toBe(false); // Only 2 tokens left
      expect(limiter.tryConsume(2)).toBe(true);
    });
  });

  describe('Timing Edge Cases', () => {
    it('should handle zero delay debounce', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should handle zero delay throttle', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 0);

      throttledFn('test1');
      throttledFn('test2');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle negative delays gracefully', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, -100);

      debouncedFn('test');
      vi.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('Memory Management', () => {
    it('should clear timeouts properly in debounce', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Create multiple pending timeouts
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      // Only the last one should execute
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should not leak memory with many throttle calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      // Make many calls
      for (let i = 0; i < 1000; i++) {
        throttledFn(`call-${i}`);
      }

      // Should only call once
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call-0');
    });
  });
});
