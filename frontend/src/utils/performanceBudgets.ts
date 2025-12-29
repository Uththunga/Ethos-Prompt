/**
 * Performance Budgets System
 * Monitors and enforces performance budgets for the application
 */

interface PerformanceBudget {
  name: string;
  metric: string;
  threshold: number;
  unit: string;
  severity: 'warning' | 'error';
  description: string;
}

interface BudgetViolation {
  budget: PerformanceBudget;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'error';
  timestamp: number;
  url: string;
}

interface BudgetReport {
  passed: PerformanceBudget[];
  warnings: BudgetViolation[];
  errors: BudgetViolation[];
  score: number;
  timestamp: number;
}

class PerformanceBudgetMonitor {
  private budgets: PerformanceBudget[] = [];
  private violations: BudgetViolation[] = [];
  private listeners: Array<(violation: BudgetViolation) => void> = [];

  constructor() {
    this.initializeDefaultBudgets();
    this.startMonitoring();
  }

  /**
   * Initialize default performance budgets
   */
  private initializeDefaultBudgets(): void {
    this.budgets = [
      // Core Web Vitals Budgets
      {
        name: 'Largest Contentful Paint',
        metric: 'LCP',
        threshold: 2500,
        unit: 'ms',
        severity: 'error',
        description: 'Time until the largest content element is rendered'
      },
      {
        name: 'First Input Delay',
        metric: 'FID',
        threshold: 100,
        unit: 'ms',
        severity: 'error',
        description: 'Time from first user interaction to browser response'
      },
      {
        name: 'Cumulative Layout Shift',
        metric: 'CLS',
        threshold: 0.1,
        unit: '',
        severity: 'error',
        description: 'Visual stability of the page'
      },
      {
        name: 'First Contentful Paint',
        metric: 'FCP',
        threshold: 1800,
        unit: 'ms',
        severity: 'warning',
        description: 'Time until first content is painted'
      },
      {
        name: 'Time to First Byte',
        metric: 'TTFB',
        threshold: 800,
        unit: 'ms',
        severity: 'warning',
        description: 'Time until first byte is received from server'
      },

      // Bundle Size Budgets
      {
        name: 'Total Bundle Size',
        metric: 'BUNDLE_SIZE',
        threshold: 500,
        unit: 'KB',
        severity: 'error',
        description: 'Total size of all JavaScript bundles'
      },
      {
        name: 'Main Bundle Size',
        metric: 'MAIN_BUNDLE_SIZE',
        threshold: 250,
        unit: 'KB',
        severity: 'warning',
        description: 'Size of the main JavaScript bundle'
      },
      {
        name: 'CSS Bundle Size',
        metric: 'CSS_BUNDLE_SIZE',
        threshold: 100,
        unit: 'KB',
        severity: 'warning',
        description: 'Total size of CSS files'
      },

      // Performance Budgets
      {
        name: 'Total Blocking Time',
        metric: 'TBT',
        threshold: 200,
        unit: 'ms',
        severity: 'warning',
        description: 'Total time the main thread was blocked'
      },
      {
        name: 'Speed Index',
        metric: 'SI',
        threshold: 3000,
        unit: 'ms',
        severity: 'warning',
        description: 'How quickly content is visually displayed'
      },

      // Memory Budgets
      {
        name: 'Memory Usage',
        metric: 'MEMORY_USAGE',
        threshold: 50,
        unit: 'MB',
        severity: 'warning',
        description: 'JavaScript heap memory usage'
      },

      // API Performance Budgets
      {
        name: 'API Response Time',
        metric: 'API_RESPONSE_TIME',
        threshold: 1000,
        unit: 'ms',
        severity: 'warning',
        description: 'Average API response time'
      },
      {
        name: 'Search Response Time',
        metric: 'SEARCH_RESPONSE_TIME',
        threshold: 500,
        unit: 'ms',
        severity: 'warning',
        description: 'Search API response time'
      }
    ];
  }

  /**
   * Start monitoring performance metrics
   */
  private startMonitoring(): void {
    // Monitor Web Vitals
    this.monitorWebVitals();

    // Monitor bundle sizes
    this.monitorBundleSizes();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor API performance
    this.monitorAPIPerformance();

    // Run periodic checks
    setInterval(() => {
      this.runPeriodicChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Monitor Web Vitals metrics
   */
  private monitorWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically
    import('web-vitals').then((webVitalsModule) => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitalsModule;

      // Validate functions exist before calling
      if (getCLS && typeof getCLS === 'function') {
        getCLS((metric) => this.checkBudget('CLS', metric.value));
      }
      if (getFID && typeof getFID === 'function') {
        getFID((metric) => this.checkBudget('FID', metric.value));
      }
      if (getFCP && typeof getFCP === 'function') {
        getFCP((metric) => this.checkBudget('FCP', metric.value));
      }
      if (getLCP && typeof getLCP === 'function') {
        getLCP((metric) => this.checkBudget('LCP', metric.value));
      }
      if (getTTFB && typeof getTTFB === 'function') {
        getTTFB((metric) => this.checkBudget('TTFB', metric.value));
      }
    }).catch((error: unknown) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }

  /**
   * Monitor bundle sizes
   */
  private monitorBundleSizes(): void {
    if (typeof window === 'undefined') return;

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      let totalJSSize = 0;
      let totalCSSSize = 0;
      let mainBundleSize = 0;

      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;

        if (resource.name.endsWith('.js')) {
          const size = resource.transferSize || 0;
          totalJSSize += size;

          if (resource.name.includes('main') || resource.name.includes('index')) {
            mainBundleSize = Math.max(mainBundleSize, size);
          }
        } else if (resource.name.endsWith('.css')) {
          totalCSSSize += resource.transferSize || 0;
        }
      }

      if (totalJSSize > 0) {
        this.checkBudget('BUNDLE_SIZE', totalJSSize / 1024); // Convert to KB
      }
      if (mainBundleSize > 0) {
        this.checkBudget('MAIN_BUNDLE_SIZE', mainBundleSize / 1024);
      }
      if (totalCSSSize > 0) {
        this.checkBudget('CSS_BUNDLE_SIZE', totalCSSSize / 1024);
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (typeof window === 'undefined') return;
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (!perf.memory) return;

    const checkMemory = () => {
      const usedMB = perf.memory!.usedJSHeapSize / (1024 * 1024);
      this.checkBudget('MEMORY_USAGE', usedMB);
    };

    // Check memory usage periodically
    setInterval(checkMemory, 10000); // Every 10 seconds
  }

  /**
   * Monitor API performance
   */
  private monitorAPIPerformance(): void {
    // This would integrate with your API monitoring system
    // For now, we'll simulate with a placeholder
    const checkAPIPerformance = () => {
      // Get API metrics from your monitoring system
      // This is a placeholder - replace with actual implementation
      const avgResponseTime = this.getAverageAPIResponseTime();
      const searchResponseTime = this.getSearchResponseTime();

      if (avgResponseTime > 0) {
        this.checkBudget('API_RESPONSE_TIME', avgResponseTime);
      }
      if (searchResponseTime > 0) {
        this.checkBudget('SEARCH_RESPONSE_TIME', searchResponseTime);
      }
    };

    setInterval(checkAPIPerformance, 60000); // Every minute
  }

  /**
   * Check if a metric violates its budget
   */
  private checkBudget(metricName: string, value: number): void {
    const budget = this.budgets.find(b => b.metric === metricName);
    if (!budget) return;

    if (value > budget.threshold) {
      const violation: BudgetViolation = {
        budget,
        currentValue: value,
        threshold: budget.threshold,
        severity: budget.severity,
        timestamp: Date.now(),
        url: window.location.href
      };

      this.violations.push(violation);
      this.notifyViolation(violation);

      // Keep only last 100 violations
      if (this.violations.length > 100) {
        this.violations = this.violations.slice(-100);
      }
    }
  }

  /**
   * Notify listeners of budget violations
   */
  private notifyViolation(violation: BudgetViolation): void {
    this.listeners.forEach(listener => {
      try {
        listener(violation);
      } catch (error) {
        console.error('Error in budget violation listener:', error);
      }
    });

    // Log violation
    const message = `Performance budget violation: ${violation.budget.name} (${violation.currentValue.toFixed(2)}${violation.budget.unit} > ${violation.threshold}${violation.budget.unit})`;

    if (violation.severity === 'error') {
      console.error('🚨', message);
    } else {
      console.warn('⚠️', message);
    }

    // Send to analytics if configured
    this.sendViolationToAnalytics(violation);
  }

  /**
   * Send violation to analytics
   */
  private async sendViolationToAnalytics(violation: BudgetViolation): Promise<void> {
    try {
      const { analytics } = await import('../config/firebase');
      if (analytics) {
        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, 'performance_budget_violation', {
          event_category: 'Performance',
          event_label: violation.budget.name,
          value: Math.round(violation.currentValue),
          metric: violation.budget.metric,
          threshold: violation.threshold,
          severity: violation.severity
        });
      }
    } catch (error: unknown) {
      console.debug('Performance budget analytics tracking failed:', error);
    }

    // Send to custom analytics endpoint
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_budget_violation',
          ...violation,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
  }

  /**
   * Run periodic checks
   */
  private runPeriodicChecks(): void {
    // Check memory usage
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perf.memory) {
      const usedMB = perf.memory.usedJSHeapSize / (1024 * 1024);
      this.checkBudget('MEMORY_USAGE', usedMB);
    }
  }

  /**
   * Get current budget report
   */
  getBudgetReport(): BudgetReport {
    const now = Date.now();
    const recentViolations = this.violations.filter(v => now - v.timestamp < 300000); // Last 5 minutes

    const warnings = recentViolations.filter(v => v.severity === 'warning');
    const errors = recentViolations.filter(v => v.severity === 'error');
    const passed = this.budgets.filter(budget =>
      !recentViolations.some(v => v.budget.metric === budget.metric)
    );

    const score = Math.max(0, 100 - (warnings.length * 5) - (errors.length * 15));

    return {
      passed,
      warnings,
      errors,
      score,
      timestamp: now
    };
  }

  /**
   * Subscribe to budget violations
   */
  onViolation(callback: (violation: BudgetViolation) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Add custom budget
   */
  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  /**
   * Remove budget
   */
  removeBudget(metricName: string): void {
    this.budgets = this.budgets.filter(b => b.metric !== metricName);
  }

  /**
   * Get all budgets
   */
  getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  /**
   * Get recent violations
   */
  getViolations(since?: number): BudgetViolation[] {
    const cutoff = since || (Date.now() - 3600000); // Last hour by default
    return this.violations.filter(v => v.timestamp >= cutoff);
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  // Placeholder methods for API metrics - replace with actual implementation
  private getAverageAPIResponseTime(): number {
    // This should integrate with your API monitoring system
    return 0;
  }

  private getSearchResponseTime(): number {
    // This should integrate with your search API monitoring
    return 0;
  }
}

// Global performance budget monitor
export const performanceBudgetMonitor = new PerformanceBudgetMonitor();

// Export types
export type { BudgetReport, BudgetViolation, PerformanceBudget };
