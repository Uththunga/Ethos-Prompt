/**
 * Core Web Vitals Tracking
 * Tracks LCP, FID, CLS, TTFB, and other performance metrics
 */

import { logEvent } from 'firebase/analytics';
import { analyticsRef } from '../config/firebase';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

interface NavigationTiming {
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToFirstByte: number;
  totalBlockingTime: number;
}

class WebVitalsTracker {
  private metrics: WebVitalMetric[] = [];
  private listeners: Array<(metric: WebVitalMetric) => void> = [];
  private isEnabled: boolean = true;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    // Enable in development or production with performance monitoring enabled
    this.isEnabled =
      import.meta.env.DEV ||
      import.meta.env.VITE_ENABLE_WEB_VITALS === 'true' ||
      import.meta.env.VITE_PERFORMANCE_MONITORING === 'true';

    if (this.isEnabled && typeof window !== 'undefined') {
      // Delay initialization to avoid blocking the main thread
      setTimeout(() => this.initializeTracking(), 100);
    }
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private async initializeTracking(): Promise<void> {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      // Dynamic import to avoid build issues
      const webVitalsModule = await import('web-vitals');

      // Check if the module was imported correctly
      if (!webVitalsModule || typeof webVitalsModule !== 'object') {
        if (import.meta.env.VITE_VERBOSE_PERF_LOGS === 'true') {
          console.debug('Web vitals module not available, using fallback tracking');
        }
        this.initializeFallbackTracking();
        return;
      }

      const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitalsModule;

      // Validate that functions exist
      if (!getCLS || !getFID || !getFCP || !getLCP || !getTTFB) {
        if (import.meta.env.VITE_VERBOSE_PERF_LOGS === 'true') {
          console.debug('Web vitals functions not available, using fallback tracking');
        }
        this.initializeFallbackTracking();
        return;
      }

      // Track Largest Contentful Paint (LCP)
      getLCP((metric) => {
        this.recordMetric({
          name: 'LCP',
          value: metric.value,
          rating: this.getRating('LCP', metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
        });
      });

      // Track First Input Delay (FID)
      getFID((metric) => {
        this.recordMetric({
          name: 'FID',
          value: metric.value,
          rating: this.getRating('FID', metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
        });
      });

      // Track Cumulative Layout Shift (CLS)
      getCLS((metric) => {
        this.recordMetric({
          name: 'CLS',
          value: metric.value,
          rating: this.getRating('CLS', metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
        });
      });

      // Track First Contentful Paint (FCP)
      getFCP((metric) => {
        this.recordMetric({
          name: 'FCP',
          value: metric.value,
          rating: this.getRating('FCP', metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
        });
      });

      // Track Time to First Byte (TTFB)
      getTTFB((metric) => {
        this.recordMetric({
          name: 'TTFB',
          value: metric.value,
          rating: this.getRating('TTFB', metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
        });
      });
    } catch (error) {
      if (import.meta.env.VITE_VERBOSE_PERF_LOGS === 'true') {
        console.debug('Failed to load web-vitals:', error);
      }
      this.initializeFallbackTracking();
    }

    // Track additional custom metrics
    this.trackCustomMetrics();
  }

  /**
   * Initialize fallback tracking when web-vitals is not available
   */
  private initializeFallbackTracking(): void {
    if (typeof window === 'undefined') return;

    // Use Performance Observer API as fallback
    try {
      // Track LCP using Performance Observer
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              this.recordMetric({
                name: 'LCP',
                value: entry.startTime,
                rating: this.getRating('LCP', entry.startTime),
                delta: 0,
                id: 'fallback-lcp',
                navigationType: 'navigate',
                timestamp: Date.now(),
              });
            }
          });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Track basic navigation timing
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const ttfb = timing.responseStart - timing.navigationStart;

        this.recordMetric({
          name: 'TTFB',
          value: ttfb,
          rating: this.getRating('TTFB', ttfb),
          delta: 0,
          id: 'fallback-ttfb',
          navigationType: 'navigate',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.warn('Fallback tracking also failed:', error);
    }
  }

  /**
   * Track custom performance metrics
   */
  private trackCustomMetrics(): void {
    // Track Total Blocking Time (TBT)
    this.measureTotalBlockingTime();

    // Track Time to Interactive (TTI)
    this.measureTimeToInteractive();

    // Track Resource Loading Performance
    this.trackResourcePerformance();

    // Track User Interactions
    this.trackUserInteractions();
  }

  /**
   * Measure Total Blocking Time
   */
  private measureTotalBlockingTime(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      let totalBlockingTime = 0;

      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          const blockingTime = entry.duration - 50; // Tasks over 50ms are blocking
          if (blockingTime > 0) {
            totalBlockingTime += blockingTime;
          }
        }
      }

      if (totalBlockingTime > 0) {
        this.recordMetric({
          name: 'TBT',
          value: totalBlockingTime,
          rating: this.getRating('TBT', totalBlockingTime),
          delta: totalBlockingTime,
          id: this.generateId(),
          navigationType: 'navigate',
          timestamp: Date.now(),
        });
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  /**
   * Measure Time to Interactive
   */
  private measureTimeToInteractive(): void {
    if (!('PerformanceObserver' in window)) return;

    let domContentLoadedTime = 0;
    let lastLongTaskTime = 0;

    // Get DOM Content Loaded time
    window.addEventListener('DOMContentLoaded', () => {
      domContentLoadedTime = performance.now();
    });

    // Track long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          lastLongTaskTime = entry.startTime + entry.duration;
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Calculate TTI after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const tti = Math.max(domContentLoadedTime, lastLongTaskTime);

        this.recordMetric({
          name: 'TTI',
          value: tti,
          rating: this.getRating('TTI', tti),
          delta: tti,
          id: this.generateId(),
          navigationType: 'navigate',
          timestamp: Date.now(),
        });
      }, 5000); // Wait 5 seconds to ensure all long tasks are captured
    });
  }

  /**
   * Track resource loading performance
   */
  private trackResourcePerformance(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Track slow resources (>5s for production, >10s for large bundles)
          const slowThreshold =
            resourceEntry.name.includes('chunk') || resourceEntry.name.includes('vendor')
              ? 10000
              : 5000;
          if (resourceEntry.duration > slowThreshold) {
            this.recordMetric({
              name: 'SLOW_RESOURCE',
              value: resourceEntry.duration,
              rating: 'poor',
              delta: resourceEntry.duration,
              id: this.generateId(),
              navigationType: 'resource',
              timestamp: Date.now(),
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Track user interactions
   */
  private trackUserInteractions(): void {
    const trackInteraction = () => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const interactionTime = performance.now() - startTime;

        // Track slow interactions (>100ms)
        if (interactionTime > 100) {
          this.recordMetric({
            name: 'SLOW_INTERACTION',
            value: interactionTime,
            rating: 'poor',
            delta: interactionTime,
            id: this.generateId(),
            navigationType: 'interaction',
            timestamp: Date.now(),
          });
        }
      });
    };

    // Track clicks, taps, and key presses
    ['click', 'touchstart', 'keydown'].forEach((eventType) => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: WebVitalMetric): void {
    this.metrics.push(metric);

    // Notify listeners
    this.listeners.forEach((listener) => listener(metric));

    // Send to analytics if configured
    this.sendToAnalytics(metric);

    // Log poor metrics
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name} detected:`, metric);
    }
  }

  /**
   * Get rating for a metric
   */
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
      TBT: { good: 200, poor: 600 },
      TTI: { good: 3800, poor: 7300 },
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Send metric to analytics
   */
  private async sendToAnalytics(metric: WebVitalMetric): Promise<void> {
    try {
      // Send to Firebase Analytics
      if (analyticsRef.current) {
        logEvent(analyticsRef.current, metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          metric_rating: metric.rating,
          session_id: this.sessionId,
        });
      }
    } catch (error) {
      // Silently fail - analytics should not break performance monitoring
      console.debug('Web vitals analytics tracking failed:', error);
    }

    // Send to custom analytics endpoint
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      try {
        await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...metric,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        });
      } catch (error) {
        console.debug('Custom analytics endpoint failed:', error);
      }
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): WebVitalMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): { [key: string]: { value: number; rating: string } } {
    const summary: { [key: string]: { value: number; rating: string } } = {};

    ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'TBT', 'TTI'].forEach((metricName) => {
      const metric = this.metrics.find((m) => m.name === metricName);
      if (metric) {
        summary[metricName] = {
          value: metric.value,
          rating: metric.rating,
        };
      }
    });

    return summary;
  }

  /**
   * Subscribe to metric updates
   */
  onMetric(callback: (metric: WebVitalMetric) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Generate unique metric ID
   */
  private generateId(): string {
    return Math.random().toString(36).slice(2);
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Global instance
export const webVitalsTracker = new WebVitalsTracker();

// Export types
export type { NavigationTiming, WebVitalMetric };
