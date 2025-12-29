/**
 * Debug Utility - Conditional logging for development
 *
 * Usage:
 *   import { debug } from '@/utils/debugUtils';
 *   debug.log('Development only message');
 *   debug.error('This logs in both dev and production');
 */

export const debug = {
  /**
   * Log message - only in development
   */
  log: (...args: any[]): void => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  /**
   * Warn message - only in development
   */
  warn: (...args: any[]): void => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },

  /**
   * Error message - always logged (production + development)
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

  /**
   * Info message - only in development
   */
  info: (...args: any[]): void => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },

  /**
   * Debug message - only in development
   */
  debug: (...args: any[]): void => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },

  /**
   * Table - only in development
   */
  table: (data: any): void => {
    if (import.meta.env.DEV) {
      console.table(data);
    }
  },

  /**
   * Group - only in development
   */
  group: (label: string): void => {
    if (import.meta.env.DEV) {
      console.group(label);
    }
  },

  /**
   * Group end - only in development
   */
  groupEnd: (): void => {
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  },
};

/**
 * Performance measurement utility
 */
export const perf = {
  /**
   * Mark a performance point
   */
  mark: (name: string): void => {
    if (import.meta.env.DEV && performance.mark) {
      performance.mark(name);
    }
  },

  /**
   * Measure between two marks
   */
  measure: (name: string, startMark: string, endMark: string): void => {
    if (import.meta.env.DEV && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        debug.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (e) {
        debug.warn('Performance measurement failed:', e);
      }
    }
  },
};
