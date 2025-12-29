/**
 * Performance Profiling Utilities
 * Tools for measuring and tracking React component performance
 */

import React from 'react';

interface PerformanceMetric {
  componentName: string;
  renderTime: number;
  timestamp: number;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

interface ProfilerData {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<{ id: number; name: string; timestamp: number }>;
}

class PerformanceProfiler {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';
  private maxMetrics: number = 1000;

  constructor() {
    // Clear old metrics periodically
    if (this.isEnabled) {
      setInterval(() => this.cleanup(), 60000); // Every minute
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow renders
    if (metric.renderTime > 16) { // > 16ms is potentially problematic
      console.warn(`Slow render detected in ${metric.componentName}: ${metric.renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * React Profiler callback
   */
  onRender = (id: string, phase: 'mount' | 'update', actualDuration: number, baseDuration: number, startTime: number, commitTime: number, interactions: Set<{ id: number; name: string; timestamp: number }>) => {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      componentName: id,
      renderTime: actualDuration,
      timestamp: commitTime,
      props: { phase, baseDuration, startTime, interactions: interactions ? interactions.size : 0 }
    };

    this.recordMetric(metric);

    // Log performance warnings
    if (actualDuration > 16) {
      console.warn(`Performance warning: ${id} took ${actualDuration.toFixed(2)}ms to render (${phase})`);
    }

    if (phase === 'update' && actualDuration > baseDuration * 2) {
      console.warn(`Performance warning: ${id} update took ${actualDuration.toFixed(2)}ms, much longer than base duration of ${baseDuration.toFixed(2)}ms`);
    }
  };

  /**
   * Get performance metrics for a specific component
   */
  getMetricsForComponent(componentName: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.componentName === componentName);
  }

  /**
   * Get average render time for a component
   */
  getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.getMetricsForComponent(componentName);
    if (componentMetrics.length === 0) return 0;
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / componentMetrics.length;
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit: number = 10): Array<{ name: string; avgTime: number; count: number }> {
    const componentStats = new Map<string, { total: number; count: number }>();
    
    this.metrics.forEach(metric => {
      const existing = componentStats.get(metric.componentName) || { total: 0, count: 0 };
      componentStats.set(metric.componentName, {
        total: existing.total + metric.renderTime,
        count: existing.count + 1
      });
    });

    return Array.from(componentStats.entries())
      .map(([name, stats]) => ({
        name,
        avgTime: stats.count > 0 ? stats.total / stats.count : 0,
        count: stats.count
      }))
      .filter(comp => comp.avgTime > 0) // Filter out components with no valid timing
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (!this.isEnabled) return 'Performance profiling is disabled in production';

    const slowestComponents = this.getSlowestComponents();
    const totalMetrics = this.metrics.length;
    const slowRenders = this.metrics.filter(m => m.renderTime > 16).length;

    let report = `Performance Report\n`;
    report += `==================\n`;
    report += `Total renders tracked: ${totalMetrics}\n`;

    if (totalMetrics > 0) {
      report += `Slow renders (>16ms): ${slowRenders} (${((slowRenders / totalMetrics) * 100).toFixed(1)}%)\n\n`;
    } else {
      report += `Slow renders (>16ms): 0 (0.0%)\n\n`;
    }

    report += `Slowest Components:\n`;
    report += `-------------------\n`;

    if (slowestComponents.length > 0) {
      slowestComponents.forEach((comp, index) => {
        const avgTime = isNaN(comp.avgTime) ? 0 : comp.avgTime;
        report += `${index + 1}. ${comp.name}: ${avgTime.toFixed(2)}ms avg (${comp.count} renders)\n`;
      });
    } else {
      report += `No component data available\n`;
    }

    return report;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Cleanup old metrics
   */
  private cleanup() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > fiveMinutesAgo);
  }

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Check if profiling is enabled
   */
  get enabled() {
    return this.isEnabled;
  }
}

// Global profiler instance
export const performanceProfiler = new PerformanceProfiler();

/**
 * HOC for profiling component performance
 */
export function withPerformanceProfiler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const ProfiledComponent = React.forwardRef<HTMLElement, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';

    return React.createElement(
      React.Profiler,
      { id: name, onRender: performanceProfiler.onRender },
      React.createElement(WrappedComponent, { ...props, ref })
    );
  });

  ProfiledComponent.displayName = `withPerformanceProfiler(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return ProfiledComponent;
}

/**
 * Hook for measuring custom performance metrics
 */
export function usePerformanceMetric(metricName: string) {
  const startTime = React.useRef<number>();

  const start = React.useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = React.useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      performanceProfiler.recordMetric({
        componentName: metricName,
        renderTime: duration,
        timestamp: Date.now()
      });
      startTime.current = undefined;
      return duration;
    }
    return 0;
  }, [metricName]);

  return { start, end };
}

// Export types
export type { PerformanceMetric, ProfilerData };
