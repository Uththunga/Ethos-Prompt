/**
 * API Performance Monitoring System
 * Tracks response times, error rates, and success metrics for all API calls
 */

interface APIMetric {
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  error?: string;
  size?: number;
  timestamp: number;
}

interface APIStats {
  endpoint: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  successRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

interface PerformanceAlert {
  type: 'slow_response' | 'high_error_rate' | 'timeout' | 'server_error';
  endpoint: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class APIPerformanceMonitor {
  private metrics: APIMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private maxMetrics = 10000;
  private alertThresholds = {
    slowResponseTime: 2000, // 2 seconds
    highErrorRate: 0.1, // 10%
    timeoutThreshold: 30000, // 30 seconds
  };

  private listeners: Array<(stats: APIStats[]) => void> = [];
  private alertListeners: Array<(alert: PerformanceAlert) => void> = [];

  constructor() {
    // Cleanup old metrics periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Start monitoring an API request
   */
  startRequest(endpoint: string, method: string): string {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startTime = performance.now();

    // Store start time for this request
    type RequestInfoMap = Record<string, { endpoint: string; method: string; startTime: number; timestamp: number }>;
    const win = window as unknown as { __apiRequests?: RequestInfoMap };
    win.__apiRequests = win.__apiRequests || {};
    win.__apiRequests[requestId] = {
      endpoint,
      method,
      startTime,
      timestamp: Date.now()
    };

    return requestId;
  }

  /**
   * End monitoring an API request
   */
  endRequest(
    requestId: string,
    status: number,
    error?: string,
    responseSize?: number
  ): void {
    type RequestInfoMap = Record<string, { endpoint: string; method: string; startTime: number; timestamp: number }>;
    const win = window as unknown as { __apiRequests?: RequestInfoMap };
    const requests = win.__apiRequests || {};
    const requestData = requests[requestId];

    if (!requestData) return;

    const endTime = performance.now();
    const duration = endTime - requestData.startTime;
    const success = status >= 200 && status < 400;

    const metric: APIMetric = {
      endpoint: requestData.endpoint,
      method: requestData.method,
      startTime: requestData.startTime,
      endTime,
      duration,
      status,
      success,
      error,
      size: responseSize,
      timestamp: Date.now()
    };

    this.recordMetric(metric);

    // Clean up request data
    delete requests[requestId];
  }

  /**
   * Record a metric and check for alerts
   */
  private recordMetric(metric: APIMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for performance alerts
    this.checkAlerts(metric);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metric: APIMetric): void {
    const alerts: PerformanceAlert[] = [];

    // Slow response alert
    if (metric.duration > this.alertThresholds.slowResponseTime) {
      alerts.push({
        type: 'slow_response',
        endpoint: metric.endpoint,
        message: `Slow response detected: ${metric.duration.toFixed(0)}ms`,
        value: metric.duration,
        threshold: this.alertThresholds.slowResponseTime,
        timestamp: Date.now()
      });
    }

    // Timeout alert
    if (metric.duration > this.alertThresholds.timeoutThreshold) {
      alerts.push({
        type: 'timeout',
        endpoint: metric.endpoint,
        message: `Request timeout: ${metric.duration.toFixed(0)}ms`,
        value: metric.duration,
        threshold: this.alertThresholds.timeoutThreshold,
        timestamp: Date.now()
      });
    }

    // Server error alert
    if (metric.status >= 500) {
      alerts.push({
        type: 'server_error',
        endpoint: metric.endpoint,
        message: `Server error: ${metric.status}`,
        value: metric.status,
        threshold: 500,
        timestamp: Date.now()
      });
    }

    // High error rate alert (check last 10 requests for this endpoint)
    const recentRequests = this.metrics
      .filter(m => m.endpoint === metric.endpoint)
      .slice(-10);

    if (recentRequests.length >= 5) {
      const errorRate = recentRequests.filter(m => !m.success).length / recentRequests.length;
      if (errorRate > this.alertThresholds.highErrorRate) {
        alerts.push({
          type: 'high_error_rate',
          endpoint: metric.endpoint,
          message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
          value: errorRate,
          threshold: this.alertThresholds.highErrorRate,
          timestamp: Date.now()
        });
      }
    }

    // Store and notify about alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.alertListeners.forEach(listener => listener(alert));
    });

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Get statistics for all endpoints
   */
  getStats(): APIStats[] {
    const endpointGroups = this.groupMetricsByEndpoint();

    return Object.entries(endpointGroups).map(([endpoint, metrics]) => {
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const successCount = metrics.filter(m => m.success).length;
      const errorCount = metrics.length - successCount;

      return {
        endpoint,
        totalRequests: metrics.length,
        successCount,
        errorCount,
        averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        minResponseTime: durations[0] || 0,
        maxResponseTime: durations[durations.length - 1] || 0,
        errorRate: errorCount / metrics.length,
        successRate: successCount / metrics.length,
        p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
        p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
      };
    });
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(minutes: number = 10): PerformanceAlert[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Group metrics by endpoint
   */
  private groupMetricsByEndpoint(): Record<string, APIMetric[]> {
    return this.metrics.reduce((groups, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(metric);
      return groups;
    }, {} as Record<string, APIMetric[]>);
  }

  /**
   * Subscribe to stats updates
   */
  onStatsUpdate(callback: (stats: APIStats[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertListeners.push(callback);
    return () => {
      const index = this.alertListeners.indexOf(callback);
      if (index > -1) this.alertListeners.splice(index, 1);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * Clean up old metrics and alerts
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      stats: this.getStats(),
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Clear all metrics and alerts
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
    this.notifyListeners();
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }
}

// Global instance
export const apiPerformanceMonitor = new APIPerformanceMonitor();

// Fetch interceptor for automatic monitoring
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';

  const requestId = apiPerformanceMonitor.startRequest(url, method);

  try {
    const response = await originalFetch(input, init);
    const responseSize = parseInt(response.headers.get('content-length') || '0');

    apiPerformanceMonitor.endRequest(
      requestId,
      response.status,
      response.ok ? undefined : `HTTP ${response.status}`,
      responseSize
    );

    return response;
  } catch (error) {
    apiPerformanceMonitor.endRequest(
      requestId,
      0,
      error instanceof Error ? error.message : 'Network error'
    );
    throw error;
  }
};

// Export types
export type { APIMetric, APIStats, PerformanceAlert };
