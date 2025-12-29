import { logEvent } from 'firebase/analytics';
import { analyticsRef } from '../config/firebase';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface HybridSearchMetrics {
  searchId: string;
  query: string;
  searchType: 'semantic' | 'keyword' | 'hybrid';
  totalLatency: number;
  semanticLatency: number;
  keywordLatency: number;
  fusionLatency: number;
  resultsCount: number;
  relevanceScore: number;
  userSatisfaction?: number;
}

export interface AnalyticsDashboardMetrics {
  dashboardId: string;
  loadTime: number;
  updateLatency: number;
  dataPoints: number;
  refreshRate: number;
  userInteractions: number;
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly BATCH_SIZE = 50;

  /**
   * Track hybrid search performance metrics
   */
  trackHybridSearch(metrics: HybridSearchMetrics): void {
    const performanceMetric: PerformanceMetric = {
      name: 'hybrid_search_performance',
      value: metrics.totalLatency,
      timestamp: Date.now(),
      metadata: {
        searchId: metrics.searchId,
        query: metrics.query,
        searchType: metrics.searchType,
        semanticLatency: metrics.semanticLatency,
        keywordLatency: metrics.keywordLatency,
        fusionLatency: metrics.fusionLatency,
        resultsCount: metrics.resultsCount,
        relevanceScore: metrics.relevanceScore,
        userSatisfaction: metrics.userSatisfaction,
      },
    };

    this.addMetric(performanceMetric);

    // Log to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'hybrid_search_performed', {
        search_type: metrics.searchType,
        total_latency: metrics.totalLatency,
        results_count: metrics.resultsCount,
        relevance_score: metrics.relevanceScore,
      });
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(metrics);
  }

  /**
   * Track analytics dashboard performance
   */
  trackAnalyticsDashboard(metrics: AnalyticsDashboardMetrics): void {
    const performanceMetric: PerformanceMetric = {
      name: 'analytics_dashboard_performance',
      value: metrics.loadTime,
      timestamp: Date.now(),
      metadata: {
        dashboardId: metrics.dashboardId,
        loadTime: metrics.loadTime,
        updateLatency: metrics.updateLatency,
        dataPoints: metrics.dataPoints,
        refreshRate: metrics.refreshRate,
        userInteractions: metrics.userInteractions,
      },
    };

    this.addMetric(performanceMetric);

    // Log to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'analytics_dashboard_loaded', {
        dashboard_id: metrics.dashboardId,
        load_time: metrics.loadTime,
        update_latency: metrics.updateLatency,
        data_points: metrics.dataPoints,
      });
    }
  }

  /**
   * Track A/B testing performance
   */
  trackABTestPerformance(
    testId: string,
    variant: string,
    conversionTime: number,
    success: boolean
  ): void {
    const performanceMetric: PerformanceMetric = {
      name: 'ab_test_performance',
      value: conversionTime,
      timestamp: Date.now(),
      metadata: {
        testId,
        variant,
        conversionTime,
        success,
      },
    };

    this.addMetric(performanceMetric);

    // Log to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'ab_test_conversion', {
        test_id: testId,
        variant: variant,
        conversion_time: conversionTime,
        success: success,
      });
    }
  }

  /**
   * Track cost optimization metrics
   */
  trackCostOptimization(
    provider: string,
    cost: number,
    tokensUsed: number,
    optimizationSavings: number
  ): void {
    const performanceMetric: PerformanceMetric = {
      name: 'cost_optimization',
      value: cost,
      timestamp: Date.now(),
      metadata: {
        provider,
        cost,
        tokensUsed,
        optimizationSavings,
        costPerToken: cost / tokensUsed,
      },
    };

    this.addMetric(performanceMetric);

    // Log to Firebase Analytics
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'cost_optimization_tracked', {
        provider: provider,
        cost: cost,
        tokens_used: tokensUsed,
        optimization_savings: optimizationSavings,
      });
    }
  }

  /**
   * Get performance summary for a specific time period
   */
  getPerformanceSummary(hours: number = 24): {
    hybridSearch: {
      averageLatency: number;
      totalSearches: number;
      averageRelevance: number;
      searchTypeDistribution: Record<string, number>;
    };
    analyticsDashboard: {
      averageLoadTime: number;
      averageUpdateLatency: number;
      totalLoads: number;
    };
    abTesting: {
      totalTests: number;
      averageConversionTime: number;
      successRate: number;
    };
    costOptimization: {
      totalCost: number;
      totalSavings: number;
      providerDistribution: Record<string, number>;
    };
  } {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoffTime);

    // Hybrid Search Metrics
    const hybridSearchMetrics = recentMetrics.filter((m) => m.name === 'hybrid_search_performance');
    const hybridSearch = {
      averageLatency: this.calculateAverage(hybridSearchMetrics.map((m) => m.value)),
      totalSearches: hybridSearchMetrics.length,
      averageRelevance: this.calculateAverage(
        hybridSearchMetrics.map((m) => m.metadata?.relevanceScore || 0)
      ),
      searchTypeDistribution: this.calculateDistribution(hybridSearchMetrics, 'searchType'),
    };

    // Analytics Dashboard Metrics
    const dashboardMetrics = recentMetrics.filter(
      (m) => m.name === 'analytics_dashboard_performance'
    );
    const analyticsDashboard = {
      averageLoadTime: this.calculateAverage(dashboardMetrics.map((m) => m.value)),
      averageUpdateLatency: this.calculateAverage(
        dashboardMetrics.map((m) => m.metadata?.updateLatency || 0)
      ),
      totalLoads: dashboardMetrics.length,
    };

    // A/B Testing Metrics
    const abTestMetrics = recentMetrics.filter((m) => m.name === 'ab_test_performance');
    const abTesting = {
      totalTests: abTestMetrics.length,
      averageConversionTime: this.calculateAverage(abTestMetrics.map((m) => m.value)),
      successRate:
        abTestMetrics.filter((m) => m.metadata?.success).length / Math.max(abTestMetrics.length, 1),
    };

    // Cost Optimization Metrics
    const costMetrics = recentMetrics.filter((m) => m.name === 'cost_optimization');
    const costOptimization = {
      totalCost: costMetrics.reduce((sum, m) => sum + m.value, 0),
      totalSavings: costMetrics.reduce((sum, m) => sum + (m.metadata?.optimizationSavings || 0), 0),
      providerDistribution: this.calculateDistribution(costMetrics, 'provider'),
    };

    return {
      hybridSearch,
      analyticsDashboard,
      abTesting,
      costOptimization,
    };
  }

  /**
   * Check for performance alerts and warnings
   */
  private checkPerformanceAlerts(metrics: HybridSearchMetrics): void {
    const alerts: string[] = [];

    // Check latency thresholds
    if (metrics.totalLatency > 5000) {
      // 5 seconds
      alerts.push(`High search latency detected: ${metrics.totalLatency}ms`);
    }

    // Check relevance score
    if (metrics.relevanceScore < 0.7) {
      alerts.push(`Low relevance score detected: ${metrics.relevanceScore}`);
    }

    // Check for performance degradation
    const recentSearches = this.metrics
      .filter((m) => m.name === 'hybrid_search_performance')
      .slice(-10);

    if (recentSearches.length >= 5) {
      const averageLatency = this.calculateAverage(recentSearches.map((m) => m.value));
      if (metrics.totalLatency > averageLatency * 1.5) {
        alerts.push(
          `Performance degradation detected: Current latency ${
            metrics.totalLatency
          }ms vs average ${averageLatency.toFixed(0)}ms`
        );
      }
    }

    // Log alerts
    if (alerts.length > 0) {
      console.warn('Performance Alerts:', alerts);

      // Send to monitoring service
      if (analyticsRef.current) {
        logEvent(analyticsRef.current, 'performance_alert', {
          alert_count: alerts.length,
          search_id: metrics.searchId,
          total_latency: metrics.totalLatency,
        });
      }
    }
  }

  /**
   * Add metric to collection with automatic cleanup
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Cleanup old metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Batch send to backend if needed
    if (this.metrics.length % this.BATCH_SIZE === 0) {
      this.sendMetricsBatch();
    }
  }

  /**
   * Calculate average of numeric array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate distribution of categorical values
   */
  private calculateDistribution(
    metrics: PerformanceMetric[],
    field: string
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    metrics.forEach((metric) => {
      const value = metric.metadata?.[field] || 'unknown';
      distribution[value] = (distribution[value] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Send metrics batch to backend
   */
  private async sendMetricsBatch(): Promise<void> {
    try {
      // In a real implementation, this would send to your backend
      console.log(`Sending ${this.BATCH_SIZE} metrics to backend`);

      // For now, just log the summary
      const summary = this.getPerformanceSummary(1); // Last hour
      console.log('Performance Summary (Last Hour):', summary);
    } catch (error) {
      console.error('Failed to send metrics batch:', error);
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['name', 'value', 'timestamp', 'metadata'];
      const rows = this.metrics.map((m) => [
        m.name,
        m.value,
        m.timestamp,
        JSON.stringify(m.metadata || {}),
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();
