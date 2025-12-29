import { useState, useEffect, useCallback, useRef } from 'react';

// Types for analytics data
interface RealTimeMetrics {
  timestamp: string;
  searches_last_5min: number;
  avg_response_time: number;
  success_rate: number;
  cache_hit_rate: number;
  current_cpu_usage: number;
  current_memory_usage: number;
  search_type_distribution: Record<string, number>;
  active_sessions: number;
  error_rate: number;
}

interface SystemHealth {
  timestamp: string;
  overall_health: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  uptime_hours: number;
  error_rate: number;
  response_time_p95: number;
}

interface SearchAnalytics {
  total_searches: number;
  unique_queries: number;
  avg_results_per_search: number;
  most_popular_queries: Array<{
    query: string;
    count: number;
    avg_response_time: number;
  }>;
  search_type_breakdown: Record<string, number>;
  intent_distribution: Record<string, number>;
  spell_corrections: number;
  query_expansions: number;
}

interface PerformanceMetrics {
  period_start: string;
  period_end: string;
  total_searches: number;
  avg_response_time: number;
  p95_response_time: number;
  success_rate: number;
  cache_hit_rate: number;
  unique_users: number;
  unique_sessions: number;
  top_queries: Array<{
    query: string;
    count: number;
    avg_response_time: number;
  }>;
  search_type_distribution: Record<string, number>;
}

interface DashboardData {
  timestamp: string;
  real_time_metrics: RealTimeMetrics;
  system_health: SystemHealth;
  search_analytics: SearchAnalytics;
  performance_trends: Record<string, string>;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

interface TimeSeriesData {
  metric_name: string;
  data_points: Array<[string, number]>;
  aggregation?: string;
  granularity?: string;
  total_points: number;
}

interface AnalyticsConfig {
  baseUrl?: string;
  refreshInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useAnalytics = (config: AnalyticsConfig = {}) => {
  const {
    baseUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:8001',
    refreshInterval = 30000, // 30 seconds
    retryAttempts = 3,
    retryDelay = 1000
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generic API call function with retry logic
  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setIsConnected(true);
        setLastError(null);
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw error; // Don't retry aborted requests
        }

        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    setIsConnected(false);
    setLastError(lastError?.message || 'Failed to connect to analytics API');
    throw lastError;
  }, [baseUrl, retryAttempts, retryDelay]);

  // Fetch real-time metrics
  const fetchRealTimeMetrics = useCallback(async (): Promise<RealTimeMetrics> => {
    return apiCall<RealTimeMetrics>('/api/analytics/real-time');
  }, [apiCall]);

  // Fetch system health
  const fetchSystemHealth = useCallback(async (): Promise<SystemHealth> => {
    return apiCall<SystemHealth>('/api/analytics/system-health');
  }, [apiCall]);

  // Fetch search analytics
  const fetchSearchAnalytics = useCallback(async (hours: number = 24): Promise<SearchAnalytics> => {
    return apiCall<SearchAnalytics>(`/api/analytics/search-analytics?hours=${hours}`);
  }, [apiCall]);

  // Fetch performance metrics
  const fetchPerformanceMetrics = useCallback(async (hours: number = 24): Promise<PerformanceMetrics> => {
    return apiCall<PerformanceMetrics>(`/api/analytics/performance?hours=${hours}`);
  }, [apiCall]);

  // Fetch complete dashboard data
  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    return apiCall<DashboardData>('/api/analytics/dashboard');
  }, [apiCall]);

  // Fetch time series data
  const fetchTimeSeriesData = useCallback(async (
    metricName: string,
    startTime: Date,
    endTime: Date,
    granularity: string = 'hour',
    aggregation: string = 'avg'
  ): Promise<TimeSeriesData> => {
    const params = new URLSearchParams({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      granularity,
      aggregation
    });

    return apiCall<TimeSeriesData>(`/api/analytics/time-series/${metricName}?${params}`);
  }, [apiCall]);

  // Record search event
  const recordSearchEvent = useCallback(async (
    query: string,
    searchType: string,
    resultsCount: number,
    responseTime: number,
    success: boolean = true,
    userId?: string,
    sessionId: string = 'anonymous',
    metadata: Record<string, any> = {}
  ): Promise<{ status: string; event_id: string }> => {
    return apiCall('/api/analytics/events/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        search_type: searchType,
        results_count: resultsCount,
        response_time: responseTime,
        success,
        user_id: userId,
        session_id: sessionId,
        metadata
      })
    });
  }, [apiCall]);

  // Record user interaction
  const recordUserInteraction = useCallback(async (
    eventType: string,
    userId?: string,
    sessionId: string = 'anonymous',
    data: Record<string, any> = {}
  ): Promise<{ status: string; event_id: string }> => {
    return apiCall('/api/analytics/events/interaction', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        user_id: userId,
        session_id: sessionId,
        data
      })
    });
  }, [apiCall]);

  // Get available metrics
  const getAvailableMetrics = useCallback(async (): Promise<{
    metrics: string[];
    total_count: number;
    period: { start: string; end: string };
  }> => {
    return apiCall('/api/analytics/metrics/available');
  }, [apiCall]);

  // Generate performance report
  const generatePerformanceReport = useCallback(async (days: number = 7): Promise<any> => {
    return apiCall(`/api/analytics/report/performance?days=${days}`);
  }, [apiCall]);

  // Health check
  const checkAnalyticsHealth = useCallback(async (): Promise<{
    status: string;
    timestamp: string;
    analytics_collector: string;
    system_resources: {
      cpu_usage: number;
      memory_usage: number;
    };
    recent_metrics_available: boolean;
  }> => {
    return apiCall('/api/analytics/health');
  }, [apiCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Periodic health check
  useEffect(() => {
    const healthCheck = async () => {
      try {
        await checkAnalyticsHealth();
      } catch (error) {
        // Health check failed, but don't throw - just update connection status
        console.warn('Analytics health check failed:', error);
      }
    };

    // Initial health check
    healthCheck();

    // Periodic health checks
    const interval = setInterval(healthCheck, refreshInterval);

    return () => clearInterval(interval);
  }, [checkAnalyticsHealth, refreshInterval]);

  return {
    // Connection status
    isConnected,
    lastError,

    // Data fetching functions
    fetchRealTimeMetrics,
    fetchSystemHealth,
    fetchSearchAnalytics,
    fetchPerformanceMetrics,
    fetchDashboardData,
    fetchTimeSeriesData,

    // Event recording functions
    recordSearchEvent,
    recordUserInteraction,

    // Utility functions
    getAvailableMetrics,
    generatePerformanceReport,
    checkAnalyticsHealth,

    // Configuration
    config: {
      baseUrl,
      refreshInterval,
      retryAttempts,
      retryDelay
    }
  };
};
