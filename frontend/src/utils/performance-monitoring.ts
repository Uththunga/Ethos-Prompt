/**
 * Performance Monitoring System
 * Comprehensive performance tracking and analytics for the RAG Prompt Library
 */

// Performance Metrics Types
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface UserJourneyMetric {
  userId: string;
  sessionId: string;
  journey: string;
  step: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

interface ErrorMetric {
  type: 'javascript' | 'network' | 'api' | 'user';
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Performance Monitor Class
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private userJourneys: UserJourneyMetric[] = [];
  private errors: ErrorMetric[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring() {
    // Monitor page load performance
    this.trackPageLoad();

    // Monitor JavaScript errors
    this.trackJavaScriptErrors();

    // Monitor network requests
    this.trackNetworkRequests();

    // Monitor user interactions
    this.trackUserInteractions();

    // Monitor Core Web Vitals
    this.trackCoreWebVitals();
  }

  // Set user ID for tracking
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Track page load performance
  private trackPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      this.recordMetric('first_byte', navigation.responseStart - navigation.fetchStart);
      this.recordMetric('dom_interactive', navigation.domInteractive - navigation.fetchStart);
    });
  }

  // Track JavaScript errors
  private trackJavaScriptErrors() {
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        timestamp: Date.now(),
        userId: this.userId,
        metadata: {
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        url: window.location.href,
        timestamp: Date.now(),
        userId: this.userId,
        metadata: {
          reason: event.reason,
        },
      });
    });
  }

  // Track network requests
  private trackNetworkRequests() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        this.recordMetric('api_request_time', endTime - startTime, {
          url,
          status: response.status,
          method: args[1]?.method || 'GET',
        });

        if (!response.ok) {
          this.recordError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: url.toString(),
            timestamp: Date.now(),
            userId: this.userId,
            metadata: {
              status: response.status,
              method: args[1]?.method || 'GET',
            },
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.recordMetric('api_request_time', endTime - startTime, {
          url,
          error: true,
          method: args[1]?.method || 'GET',
        });

        this.recordError({
          type: 'network',
          message: `Network Error: ${error}`,
          url: url.toString(),
          timestamp: Date.now(),
          userId: this.userId,
          metadata: {
            method: args[1]?.method || 'GET',
          },
        });

        throw error;
      }
    };
  }

  // Track user interactions
  private trackUserInteractions() {
    // Track click events
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const elementInfo = this.getElementInfo(target);

      this.recordMetric('user_click', 1, {
        element: elementInfo,
        timestamp: Date.now(),
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;

      this.recordMetric('form_submission', 1, {
        formId: form.id,
        formAction: form.action,
        timestamp: Date.now(),
      });
    });
  }

  // Track Core Web Vitals
  private trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('largest_contentful_paint', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const e = entry as PerformanceEntry & { processingStart?: number; startTime: number };
        if (typeof e.processingStart === 'number') {
          this.recordMetric('first_input_delay', e.processingStart - e.startTime);
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!e.hadRecentInput && typeof e.value === 'number') {
          clsValue += e.value;
        }
      });
      this.recordMetric('cumulative_layout_shift', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Helper method to get element information
  private getElementInfo(element: HTMLElement) {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 50),
      dataset: element.dataset,
    };
  }

  // Record performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.sendMetricToAnalytics(metric);
  }

  // Record user journey step
  recordUserJourney(journey: string, step: string, success: boolean = true, metadata?: Record<string, unknown>) {
    const journeyMetric: UserJourneyMetric = {
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      journey,
      step,
      timestamp: Date.now(),
      success,
      metadata,
    };

    this.userJourneys.push(journeyMetric);
    this.sendJourneyToAnalytics(journeyMetric);
  }

  // Record error
  private recordError(error: ErrorMetric) {
    this.errors.push(error);
    this.sendErrorToAnalytics(error);
  }

  // Send metric to analytics service
  private async sendMetricToAnalytics(metric: PerformanceMetric) {
    try {
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metric,
          sessionId: this.sessionId,
          userId: this.userId,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.warn('Failed to send metric to analytics:', error);
    }
  }

  // Send journey to analytics service
  private async sendJourneyToAnalytics(journey: UserJourneyMetric) {
    try {
      await fetch('/api/analytics/journeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...journey,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.warn('Failed to send journey to analytics:', error);
    }
  }

  // Send error to analytics service
  private async sendErrorToAnalytics(error: ErrorMetric) {
    try {
      await fetch('/api/analytics/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          sessionId: this.sessionId,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.warn('Failed to send error to analytics:', error);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      metrics: this.metrics,
      userJourneys: this.userJourneys,
      errors: this.errors,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  // Clear stored data
  clearData() {
    this.metrics = [];
    this.userJourneys = [];
    this.errors = [];
  }
}

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for specific tracking
export const trackPromptCreation = (success: boolean, duration?: number) => {
  performanceMonitor.recordUserJourney('prompt_management', 'create_prompt', success, { duration });
};

export const trackPromptExecution = (success: boolean, duration?: number, modelUsed?: string) => {
  performanceMonitor.recordUserJourney('prompt_execution', 'execute_prompt', success, {
    duration,
    modelUsed
  });
};

export const trackDocumentUpload = (success: boolean, fileSize?: number, fileType?: string) => {
  performanceMonitor.recordUserJourney('document_management', 'upload_document', success, {
    fileSize,
    fileType
  });
};

export const trackUserOnboarding = (step: string, success: boolean) => {
  performanceMonitor.recordUserJourney('user_onboarding', step, success);
};

export const trackFeatureUsage = (feature: string, action: string, metadata?: Record<string, unknown>) => {
  performanceMonitor.recordMetric(`feature_usage_${feature}_${action}`, 1, metadata);
};

// React Hook for performance tracking
export const usePerformanceTracking = () => {
  const trackPageView = (pageName: string) => {
    performanceMonitor.recordUserJourney('navigation', 'page_view', true, { pageName });
  };

  const trackUserAction = (action: string, metadata?: Record<string, unknown>) => {
    performanceMonitor.recordMetric(`user_action_${action}`, 1, metadata);
  };

  const trackError = (error: Error, context?: string) => {
    performanceMonitor.recordError({
      type: 'user',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      metadata: { context },
    });
  };

  return {
    trackPageView,
    trackUserAction,
    trackError,
    setUserId: (userId: string) => performanceMonitor.setUserId(userId),
  };
};

export default performanceMonitor;
