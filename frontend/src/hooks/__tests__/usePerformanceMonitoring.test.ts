import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceMonitoringService } from '../../services/performanceMonitoringService';
import {
    useABTestMonitoring,
    useAnalyticsDashboardMonitoring,
    useCostOptimizationMonitoring,
    useHybridSearchMonitoring,
    usePerformanceData,
    usePerformanceMonitoringSetup
} from '../usePerformanceMonitoring';

// Mock the performance monitoring service
vi.mock('../../services/performanceMonitoringService', () => ({
  performanceMonitoringService: {
    trackHybridSearch: vi.fn(),
    trackAnalyticsDashboard: vi.fn(),
    trackABTestPerformance: vi.fn(),
    trackCostOptimization: vi.fn(),
    getPerformanceSummary: vi.fn()
  }
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => 1000),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
  void callback;
  return {
    observe: vi.fn(),
    disconnect: vi.fn()
  };
});

describe('usePerformanceMonitoring hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useHybridSearchMonitoring', () => {
    it('should provide trackSearch function', () => {
      const { result } = renderHook(() => useHybridSearchMonitoring());

      expect(result.current.trackSearch).toBeDefined();
      expect(typeof result.current.trackSearch).toBe('function');
    });

    it('should call performanceMonitoringService.trackHybridSearch when trackSearch is called', () => {
      const { result } = renderHook(() => useHybridSearchMonitoring());

      const metrics = {
        searchId: 'test-search',
        query: 'test query',
        searchType: 'hybrid' as const,
        totalLatency: 1000,
        semanticLatency: 500,
        keywordLatency: 300,
        fusionLatency: 200,
        resultsCount: 5,
        relevanceScore: 0.8
      };

      act(() => {
        result.current.trackSearch(metrics);
      });

      expect(performanceMonitoringService.trackHybridSearch).toHaveBeenCalledWith(metrics);
    });

    it('should provide trackUserSatisfaction function', () => {
      const { result } = renderHook(() => useHybridSearchMonitoring());

      expect(result.current.trackUserSatisfaction).toBeDefined();
      expect(typeof result.current.trackUserSatisfaction).toBe('function');
    });

    it('should log user satisfaction when trackUserSatisfaction is called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useHybridSearchMonitoring());

      act(() => {
        result.current.trackUserSatisfaction('search-123', 4);
      });

      expect(consoleSpy).toHaveBeenCalledWith('User satisfaction for search search-123: 4');
      consoleSpy.mockRestore();
    });
  });

  describe('useAnalyticsDashboardMonitoring', () => {
    it('should provide trackDashboardLoad function', () => {
      const { result } = renderHook(() => useAnalyticsDashboardMonitoring());

      expect(result.current.trackDashboardLoad).toBeDefined();
      expect(typeof result.current.trackDashboardLoad).toBe('function');
    });

    it('should call performanceMonitoringService.trackAnalyticsDashboard when trackDashboardLoad is called', () => {
      const { result } = renderHook(() => useAnalyticsDashboardMonitoring());

      const metrics = {
        dashboardId: 'main-dashboard',
        loadTime: 800,
        updateLatency: 200,
        dataPoints: 100,
        refreshRate: 30,
        userInteractions: 5
      };

      act(() => {
        result.current.trackDashboardLoad(metrics);
      });

      expect(performanceMonitoringService.trackAnalyticsDashboard).toHaveBeenCalledWith(metrics);
    });

    it('should provide trackDashboardInteraction function', () => {
      const { result } = renderHook(() => useAnalyticsDashboardMonitoring());

      expect(result.current.trackDashboardInteraction).toBeDefined();
      expect(typeof result.current.trackDashboardInteraction).toBe('function');
    });

    it('should log dashboard interaction when trackDashboardInteraction is called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useAnalyticsDashboardMonitoring());

      act(() => {
        result.current.trackDashboardInteraction('dashboard-1', 'click');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Dashboard interaction: dashboard-1 - click');
      consoleSpy.mockRestore();
    });
  });

  describe('useABTestMonitoring', () => {
    it('should provide trackConversion function', () => {
      const { result } = renderHook(() => useABTestMonitoring());

      expect(result.current.trackConversion).toBeDefined();
      expect(typeof result.current.trackConversion).toBe('function');
    });

    it('should call performanceMonitoringService.trackABTestPerformance when trackConversion is called', () => {
      const { result } = renderHook(() => useABTestMonitoring());

      act(() => {
        result.current.trackConversion('test-1', 'variant-a', 2000, true);
      });

      expect(performanceMonitoringService.trackABTestPerformance).toHaveBeenCalledWith(
        'test-1',
        'variant-a',
        2000,
        true
      );
    });
  });

  describe('useCostOptimizationMonitoring', () => {
    it('should provide trackCost function', () => {
      const { result } = renderHook(() => useCostOptimizationMonitoring());

      expect(result.current.trackCost).toBeDefined();
      expect(typeof result.current.trackCost).toBe('function');
    });

    it('should call performanceMonitoringService.trackCostOptimization when trackCost is called', () => {
      const { result } = renderHook(() => useCostOptimizationMonitoring());

      act(() => {
        result.current.trackCost('openai', 0.05, 1000, 0.01);
      });

      expect(performanceMonitoringService.trackCostOptimization).toHaveBeenCalledWith(
        'openai',
        0.05,
        1000,
        0.01
      );
    });
  });

  describe('usePerformanceMonitoringSetup', () => {
    it('should set up performance monitoring on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => usePerformanceMonitoringSetup());

      // Should set up load event listener if document is not ready
      if (document.readyState !== 'complete') {
        expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
      }
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => usePerformanceMonitoringSetup());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('should set up PerformanceObserver when available', () => {
      renderHook(() => usePerformanceMonitoringSetup());

      expect(global.PerformanceObserver).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('usePerformanceData', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fetch performance data on mount', () => {
      const mockData = {
        hybridSearch: {
          averageLatency: 1000,
          totalSearches: 5,
          averageRelevance: 0.8,
          searchTypeDistribution: { hybrid: 3, semantic: 2 }
        },
        analyticsDashboard: {
          averageLoadTime: 500,
          averageUpdateLatency: 100,
          totalLoads: 10
        },
        abTesting: {
          totalTests: 3,
          averageConversionTime: 2000,
          successRate: 0.67
        },
        costOptimization: {
          totalCost: 0.15,
          totalSavings: 0.05,
          providerDistribution: { openai: 2, anthropic: 1 }
        }
      };

      (performanceMonitoringService.getPerformanceSummary as unknown as vi.Mock).mockReturnValue(mockData);

      const { result } = renderHook(() => usePerformanceData(1000));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.performanceData).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should refresh data at specified interval', () => {
      const mockData = {
        hybridSearch: { averageLatency: 1000, totalSearches: 5, averageRelevance: 0.8, searchTypeDistribution: {} },
        analyticsDashboard: { averageLoadTime: 500, averageUpdateLatency: 100, totalLoads: 10 },
        abTesting: { totalTests: 3, averageConversionTime: 2000, successRate: 0.67 },
        costOptimization: { totalCost: 0.15, totalSavings: 0.05, providerDistribution: {} }
      };

      (performanceMonitoringService.getPerformanceSummary as unknown as vi.Mock).mockReturnValue(mockData);

      renderHook(() => usePerformanceData(1000));

      expect(performanceMonitoringService.getPerformanceSummary).toHaveBeenCalledTimes(1);

      // Fast-forward time by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(performanceMonitoringService.getPerformanceSummary).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when fetching performance data', () => {
      (performanceMonitoringService.getPerformanceSummary as unknown as vi.Mock).mockImplementation(() => {
        throw new Error('Failed to fetch data');
      });

      const { result } = renderHook(() => usePerformanceData(1000));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.performanceData).toBeNull();
      expect(result.current.error).toBe('Failed to fetch data');
    });

    it('should provide refresh function', () => {
      const mockData = {
        hybridSearch: { averageLatency: 1000, totalSearches: 5, averageRelevance: 0.8, searchTypeDistribution: {} },
        analyticsDashboard: { averageLoadTime: 500, averageUpdateLatency: 100, totalLoads: 10 },
        abTesting: { totalTests: 3, averageConversionTime: 2000, successRate: 0.67 },
        costOptimization: { totalCost: 0.15, totalSavings: 0.05, providerDistribution: {} }
      };

      (performanceMonitoringService.getPerformanceSummary as unknown as vi.Mock).mockReturnValue(mockData);

      const { result } = renderHook(() => usePerformanceData(1000));

      expect(result.current.refresh).toBeDefined();
      expect(typeof result.current.refresh).toBe('function');

      act(() => {
        result.current.refresh();
      });

      expect(performanceMonitoringService.getPerformanceSummary).toHaveBeenCalledTimes(2);
    });
  });
});
