/**
 * Application Monitoring and Analytics
 * Provides comprehensive monitoring, error tracking, and performance analytics
 */

import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analyticsRef } from '../config/firebase';

// Performance monitoring interface
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Error tracking interface
interface ErrorEvent {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// User action tracking interface
interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

// API performance tracking interface
interface APIMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Performance Monitoring Class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Core Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entries) => {
        const lcpEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lcpEntry.startTime, {
          element: lcpEntry.element?.tagName,
          url: lcpEntry.url,
        });
      });

      // First Input Delay (FID)
      this.observeMetric('first-input', (entries) => {
        const fidEntry = entries[0];
        this.recordMetric('FID', fidEntry.processingStart - fidEntry.startTime, {
          eventType: fidEntry.name,
        });
      });

      // Cumulative Layout Shift (CLS)
      this.observeMetric('layout-shift', (entries) => {
        let clsValue = 0;
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });

      // Navigation timing
      this.observeMetric('navigation', (entries) => {
        const navEntry = entries[0] as PerformanceNavigationTiming;
        this.recordMetric('Page Load Time', navEntry.loadEventEnd - navEntry.fetchStart);
        this.recordMetric(
          'DOM Content Loaded',
          navEntry.domContentLoadedEventEnd - navEntry.fetchStart
        );
        this.recordMetric('Time to First Byte', navEntry.responseStart - navEntry.fetchStart);
      });
    }
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Send to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'performance_metric', {
        metric_name: name,
        metric_value: value,
        ...metadata,
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`📊 Performance: ${name} = ${value}ms`, metadata);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Error Tracking Class
 */
class ErrorTracker {
  private errors: ErrorEvent[] = [];

  constructor() {
    this.initializeErrorHandlers();
  }

  private initializeErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        component: 'Global',
        timestamp: Date.now(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        component: 'Promise',
        timestamp: Date.now(),
        metadata: {
          reason: event.reason,
        },
      });
    });
  }

  trackError(error: Omit<ErrorEvent, 'timestamp'> & { timestamp?: number }): void {
    const errorEvent: ErrorEvent = {
      ...error,
      timestamp: error.timestamp || Date.now(),
    };

    this.errors.push(errorEvent);

    // Send to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'error_occurred', {
        error_message: errorEvent.message,
        error_component: errorEvent.component,
        error_stack: errorEvent.stack?.substring(0, 500), // Limit stack trace length
        ...errorEvent.metadata,
      });
    }

    // Log to console
    console.error('🚨 Error tracked:', errorEvent);
  }

  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

/**
 * User Analytics Class
 */
class UserAnalytics {
  private actions: UserAction[] = [];

  setUser(userId: string, properties?: Record<string, unknown>): void {
    if (analyticsRef.current) {
      setUserId(analyticsRef.current, userId);
      if (properties) {
        setUserProperties(analyticsRef.current, properties);
      }
    }
  }

  trackAction(action: UserAction): void {
    this.actions.push(action);

    // Send to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, action.action, {
        event_category: action.category,
        event_label: action.label,
        value: action.value,
        ...action.metadata,
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`👤 User Action: ${action.category}/${action.action}`, action);
    }
  }

  trackPageView(page: string, title?: string): void {
    this.trackAction({
      action: 'page_view',
      category: 'Navigation',
      label: page,
      metadata: { page_title: title },
    });
  }

  trackFeatureUsage(feature: string, metadata?: Record<string, unknown>): void {
    this.trackAction({
      action: 'feature_used',
      category: 'Feature',
      label: feature,
      metadata,
    });
  }

  getActions(): UserAction[] {
    return [...this.actions];
  }

  clearActions(): void {
    this.actions = [];
  }
}

/**
 * API Performance Tracker Class
 */
class APIPerformanceTracker {
  private apiMetrics: APIMetric[] = [];
  private readonly maxMetrics = 1000;

  trackAPICall(
    endpoint: string,
    method: string,
    startTime: number,
    endTime: number,
    status: number,
    metadata?: Record<string, unknown>
  ): void {
    const responseTime = endTime - startTime;
    const success = status >= 200 && status < 400;

    const metric: APIMetric = {
      endpoint,
      method,
      responseTime,
      status,
      timestamp: endTime,
      success,
      metadata,
    };

    this.apiMetrics.push(metric);

    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }

    // Log to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'api_call', {
        endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Normalize IDs
        method,
        response_time: responseTime,
        status,
        success,
        ...metadata,
      });
    }

    // Log slow API calls
    if (responseTime > 2000) {
      console.warn(`🐌 Slow API call: ${method} ${endpoint} took ${responseTime}ms`);
    }

    // Log failed API calls
    if (!success) {
      console.error(`❌ Failed API call: ${method} ${endpoint} returned ${status}`);
    }
  }

  getMetrics(): APIMetric[] {
    return [...this.apiMetrics];
  }

  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.apiMetrics.filter((m) => m.endpoint.includes(endpoint))
      : this.apiMetrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return total / relevantMetrics.length;
  }

  getP95ResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.apiMetrics.filter((m) => m.endpoint.includes(endpoint))
      : this.apiMetrics;

    if (relevantMetrics.length === 0) return 0;

    const sorted = relevantMetrics.map((m) => m.responseTime).sort((a, b) => a - b);

    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index] || 0;
  }

  getSuccessRate(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.apiMetrics.filter((m) => m.endpoint.includes(endpoint))
      : this.apiMetrics;

    if (relevantMetrics.length === 0) return 0;

    const successCount = relevantMetrics.filter((m) => m.success).length;
    return (successCount / relevantMetrics.length) * 100;
  }

  clearMetrics(): void {
    this.apiMetrics = [];
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const errorTracker = new ErrorTracker();
export const userAnalytics = new UserAnalytics();
export const apiTracker = new APIPerformanceTracker();

/**
 * Utility function to track API calls
 */
export async function trackAPICall<T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  let status = 0;
  let error: Error | null = null;

  try {
    const result = await apiCall();
    status = 200; // Assume success if no error
    return result;
  } catch (err: unknown) {
    error = err instanceof Error ? err : new Error(String(err));
    status =
      (err as { status?: number; code?: number }).status ||
      (err as { status?: number; code?: number }).code ||
      500;
    throw err;
  } finally {
    const endTime = performance.now();
    apiTracker.trackAPICall(endpoint, method, startTime, endTime, status, {
      ...metadata,
      error: error?.message,
    });
  }
}

/**
 * Initialize monitoring system
 */
export function initializeMonitoring(): void {
  console.log('🔍 Initializing monitoring system...');

  // Track initial page load
  userAnalytics.trackPageView(window.location.pathname, document.title);

  // Track performance metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.recordMetric('Initial Load Complete', performance.now());
    }, 0);
  });

  console.log('✅ Monitoring system initialized');
}

/**
 * Get performance summary for debugging
 */
export function getPerformanceSummary(): {
  apiMetrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    totalCalls: number;
  };
  coreWebVitals: PerformanceMetric[];
  errorCount: number;
} {
  return {
    apiMetrics: {
      averageResponseTime: apiTracker.getAverageResponseTime(),
      p95ResponseTime: apiTracker.getP95ResponseTime(),
      successRate: apiTracker.getSuccessRate(),
      totalCalls: apiTracker.getMetrics().length,
    },
    coreWebVitals: performanceMonitor
      .getMetrics()
      .filter((m) => ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(m.name)),
    errorCount: errorTracker.getErrors().length,
  };
}

/**
 * Generate monitoring report
 */
export function generateMonitoringReport(): {
  performance: PerformanceMetric[];
  errors: ErrorEvent[];
  actions: UserAction[];
  summary: Record<string, unknown>;
} {
  const performance = performanceMonitor.getMetrics();
  const errors = errorTracker.getErrors();
  const actions = userAnalytics.getActions();

  const summary = {
    totalErrors: errors.length,
    totalActions: actions.length,
    totalMetrics: performance.length,
    avgPageLoadTime: performance
      .filter((m) => m.name === 'Page Load Time')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0),
    errorRate: errors.length / Math.max(actions.length, 1),
    timestamp: Date.now(),
  };

  return { performance, errors, actions, summary };
}

/**
 * Export monitoring data for debugging
 */
export function exportMonitoringData(): string {
  const report = generateMonitoringReport();
  return JSON.stringify(report, null, 2);
}

// Cleanup function
export function cleanupMonitoring(): void {
  performanceMonitor.disconnect();
  performanceMonitor.clearMetrics();
  errorTracker.clearErrors();
  userAnalytics.clearActions();
}
