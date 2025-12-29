import { useCallback, useEffect, useState } from 'react';
import { AnalyticsDashboardMetrics, HybridSearchMetrics, performanceMonitoringService } from '../services/performanceMonitoringService';

/**
 * Hook for tracking hybrid search performance
 */
export const useHybridSearchMonitoring = () => {
  const trackSearch = useCallback((metrics: HybridSearchMetrics) => {
    performanceMonitoringService.trackHybridSearch(metrics);
  }, []);

  const trackUserSatisfaction = useCallback((searchId: string, satisfaction: number) => {
    // Find the search metric and update it
    // This would typically be done through a backend API
    console.log(`User satisfaction for search ${searchId}: ${satisfaction}`);
  }, []);

  return {
    trackSearch,
    trackUserSatisfaction
  };
};

/**
 * Hook for tracking analytics dashboard performance
 */
export const useAnalyticsDashboardMonitoring = () => {
  const trackDashboardLoad = useCallback((metrics: AnalyticsDashboardMetrics) => {
    performanceMonitoringService.trackAnalyticsDashboard(metrics);
  }, []);

  const trackDashboardInteraction = useCallback((dashboardId: string, interactionType: string) => {
    // Track user interactions with the dashboard
    console.log(`Dashboard interaction: ${dashboardId} - ${interactionType}`);
  }, []);

  return {
    trackDashboardLoad,
    trackDashboardInteraction
  };
};

/**
 * Hook for tracking A/B test performance
 */
export const useABTestMonitoring = () => {
  const trackConversion = useCallback((testId: string, variant: string, conversionTime: number, success: boolean) => {
    performanceMonitoringService.trackABTestPerformance(testId, variant, conversionTime, success);
  }, []);

  return {
    trackConversion
  };
};

/**
 * Hook for tracking cost optimization
 */
export const useCostOptimizationMonitoring = () => {
  const trackCost = useCallback((provider: string, cost: number, tokensUsed: number, optimizationSavings: number) => {
    performanceMonitoringService.trackCostOptimization(provider, cost, tokensUsed, optimizationSavings);
  }, []);

  return {
    trackCost
  };
};

/**
 * Hook for automatic performance monitoring setup
 */
export const usePerformanceMonitoringSetup = () => {
  useEffect(() => {
    // Set up automatic performance monitoring
    const startTime = performance.now();

    // Monitor page load performance
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;

      // Track page load performance
      performanceMonitoringService.trackAnalyticsDashboard({
        dashboardId: 'main-app',
        loadTime,
        updateLatency: 0,
        dataPoints: 0,
        refreshRate: 0,
        userInteractions: 0
      });
    };

    // Monitor navigation performance
    const handleNavigation = () => {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0];
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;

        performanceMonitoringService.trackAnalyticsDashboard({
          dashboardId: 'navigation',
          loadTime,
          updateLatency: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          dataPoints: 1,
          refreshRate: 0,
          userInteractions: 0
        });
      }
    };

    // Set up observers
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Monitor navigation timing
    handleNavigation();

    // Set up performance observer for long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            console.warn('Long task detected:', entry.duration, 'ms');
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // Long task API not supported
      }

      return () => {
        observer.disconnect();
        window.removeEventListener('load', handleLoad);
      };
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
};

/**
 * Hook for getting real-time performance data
 */
export const usePerformanceData = (refreshInterval: number = 30000) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        const data = performanceMonitoringService.getPerformanceSummary(24);
        setPerformanceData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();

    const interval = setInterval(fetchPerformanceData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    performanceData,
    isLoading,
    error,
    refresh: () => {
      const data = performanceMonitoringService.getPerformanceSummary(24);
      setPerformanceData(data);
    }
  };
};
