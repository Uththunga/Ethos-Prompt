/**
 * Performance tracing utilities for Firebase Performance Monitoring
 * Provides custom traces for key operations
 */

import { perfRef } from '../config/firebase';

/**
 * Start a custom trace
 */
export function startTrace(traceName: string): (() => void) | null {
  try {
    const perf = perfRef.current;
    if (!perf) return null;

    // Dynamically import trace function
    import('firebase/performance')
      .then(({ trace }) => {
        const customTrace = trace(perf, traceName);
        customTrace.start();
        return () => customTrace.stop();
      })
      .catch(() => null);

    return null;
  } catch {
    return null;
  }
}

/**
 * Measure an async operation
 */
export async function measureAsync<T>(traceName: string, operation: () => Promise<T>): Promise<T> {
  const stopTrace = startTrace(traceName);
  try {
    const result = await operation();
    stopTrace?.();
    return result;
  } catch (err) {
    stopTrace?.();
    throw err;
  }
}

/**
 * Measure a synchronous operation
 */
export function measureSync<T>(traceName: string, operation: () => T): T {
  const stopTrace = startTrace(traceName);
  try {
    const result = operation();
    stopTrace?.();
    return result;
  } catch (err) {
    stopTrace?.();
    throw err;
  }
}

/**
 * Record a custom metric
 */
export function recordMetric(traceName: string, metricName: string, value: number): void {
  try {
    const perf = perfRef.current;
    if (!perf) return;

    import('firebase/performance')
      .then(({ trace }) => {
        const customTrace = trace(perf, traceName);
        customTrace.putMetric(metricName, value);
      })
      .catch(() => {});
  } catch {
    // Silently fail
  }
}

/**
 * Track component render performance
 */
export function trackComponentRender(componentName: string, renderTime: number): void {
  recordMetric('component_render', componentName, renderTime);
}

/**
 * Track API call performance
 */
export function trackAPICall(endpoint: string, duration: number, success: boolean): void {
  recordMetric('api_call', `${endpoint}_duration`, duration);
  recordMetric('api_call', `${endpoint}_success`, success ? 1 : 0);
}

/**
 * Track user interaction
 */
export function trackInteraction(action: string, duration: number): void {
  recordMetric('user_interaction', action, duration);
}

/**
 * Track page load metrics
 */
export function trackPageLoad(): void {
  if (typeof window === 'undefined') return;

  // Wait for page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      const firstPaintTime = perfData.responseEnd - perfData.fetchStart;

      recordMetric('page_load', 'total_load_time', pageLoadTime);
      recordMetric('page_load', 'dom_ready_time', domReadyTime);
      recordMetric('page_load', 'first_paint_time', firstPaintTime);
    }, 0);
  });
}

/**
 * Track Web Vitals
 */
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Track LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    recordMetric('web_vitals', 'lcp', lastEntry.startTime);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Track FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      const fid = entry.processingStart - entry.startTime;
      recordMetric('web_vitals', 'fid', fid);
    });
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  // Track CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        recordMetric('web_vitals', 'cls', clsValue);
      }
    }
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });
}
