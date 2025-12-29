import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AnalyticsDashboardMetrics,
  HybridSearchMetrics,
  PerformanceMonitoringService,
} from '../performanceMonitoringService';

// Mock Firebase config to provide analyticsRef used by the service
// Note: We need to mock the entire module because Vitest doesn't support partial mocks well
vi.mock('../../config/firebase', () => ({
  analyticsRef: { current: null },
  perfRef: { current: null },
  app: {},
  auth: {},
  db: {},
  storage: {},
  functions: {},
}));

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
}));

describe('PerformanceMonitoringService', () => {
  let service: PerformanceMonitoringService;

  beforeEach(() => {
    service = new PerformanceMonitoringService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.clearMetrics();
  });

  describe('trackHybridSearch', () => {
    it('should track hybrid search metrics correctly', () => {
      const metrics: HybridSearchMetrics = {
        searchId: 'test-search-1',
        query: 'test query',
        searchType: 'hybrid',
        totalLatency: 1500,
        semanticLatency: 800,
        keywordLatency: 400,
        fusionLatency: 300,
        resultsCount: 10,
        relevanceScore: 0.85,
        userSatisfaction: 4,
      };

      service.trackHybridSearch(metrics);

      const summary = service.getPerformanceSummary(1);
      expect(summary.hybridSearch.totalSearches).toBe(1);
      expect(summary.hybridSearch.averageLatency).toBe(1500);
      expect(summary.hybridSearch.averageRelevance).toBe(0.85);
    });

    it('should track multiple search types', () => {
      const semanticSearch: HybridSearchMetrics = {
        searchId: 'semantic-1',
        query: 'semantic query',
        searchType: 'semantic',
        totalLatency: 1000,
        semanticLatency: 1000,
        keywordLatency: 0,
        fusionLatency: 0,
        resultsCount: 8,
        relevanceScore: 0.9,
      };

      const keywordSearch: HybridSearchMetrics = {
        searchId: 'keyword-1',
        query: 'keyword query',
        searchType: 'keyword',
        totalLatency: 500,
        semanticLatency: 0,
        keywordLatency: 500,
        fusionLatency: 0,
        resultsCount: 12,
        relevanceScore: 0.7,
      };

      service.trackHybridSearch(semanticSearch);
      service.trackHybridSearch(keywordSearch);

      const summary = service.getPerformanceSummary(1);
      expect(summary.hybridSearch.totalSearches).toBe(2);
      expect(summary.hybridSearch.searchTypeDistribution).toEqual({
        semantic: 1,
        keyword: 1,
      });
    });

    it('should detect performance alerts for high latency', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const slowSearch: HybridSearchMetrics = {
        searchId: 'slow-search',
        query: 'slow query',
        searchType: 'hybrid',
        totalLatency: 6000, // Above 5s threshold
        semanticLatency: 3000,
        keywordLatency: 2000,
        fusionLatency: 1000,
        resultsCount: 5,
        relevanceScore: 0.8,
      };

      service.trackHybridSearch(slowSearch);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance Alerts:',
        expect.arrayContaining([expect.stringContaining('High search latency detected: 6000ms')])
      );

      consoleSpy.mockRestore();
    });

    it('should detect performance alerts for low relevance', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const lowRelevanceSearch: HybridSearchMetrics = {
        searchId: 'low-relevance',
        query: 'poor query',
        searchType: 'hybrid',
        totalLatency: 1000,
        semanticLatency: 500,
        keywordLatency: 300,
        fusionLatency: 200,
        resultsCount: 3,
        relevanceScore: 0.5, // Below 0.7 threshold
      };

      service.trackHybridSearch(lowRelevanceSearch);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance Alerts:',
        expect.arrayContaining([expect.stringContaining('Low relevance score detected: 0.5')])
      );

      consoleSpy.mockRestore();
    });
  });

  describe('trackAnalyticsDashboard', () => {
    it('should track analytics dashboard metrics correctly', () => {
      const metrics: AnalyticsDashboardMetrics = {
        dashboardId: 'main-dashboard',
        loadTime: 800,
        updateLatency: 200,
        dataPoints: 100,
        refreshRate: 30,
        userInteractions: 5,
      };

      service.trackAnalyticsDashboard(metrics);

      const summary = service.getPerformanceSummary(1);
      expect(summary.analyticsDashboard.totalLoads).toBe(1);
      expect(summary.analyticsDashboard.averageLoadTime).toBe(800);
      expect(summary.analyticsDashboard.averageUpdateLatency).toBe(200);
    });

    it('should track multiple dashboard loads', () => {
      const dashboard1: AnalyticsDashboardMetrics = {
        dashboardId: 'dashboard-1',
        loadTime: 600,
        updateLatency: 150,
        dataPoints: 50,
        refreshRate: 30,
        userInteractions: 3,
      };

      const dashboard2: AnalyticsDashboardMetrics = {
        dashboardId: 'dashboard-2',
        loadTime: 1000,
        updateLatency: 250,
        dataPoints: 150,
        refreshRate: 60,
        userInteractions: 7,
      };

      service.trackAnalyticsDashboard(dashboard1);
      service.trackAnalyticsDashboard(dashboard2);

      const summary = service.getPerformanceSummary(1);
      expect(summary.analyticsDashboard.totalLoads).toBe(2);
      expect(summary.analyticsDashboard.averageLoadTime).toBe(800);
      expect(summary.analyticsDashboard.averageUpdateLatency).toBe(200);
    });
  });

  describe('trackABTestPerformance', () => {
    it('should track A/B test performance correctly', () => {
      service.trackABTestPerformance('test-1', 'variant-a', 2000, true);
      service.trackABTestPerformance('test-1', 'variant-b', 2500, false);

      const summary = service.getPerformanceSummary(1);
      expect(summary.abTesting.totalTests).toBe(2);
      expect(summary.abTesting.averageConversionTime).toBe(2250);
      expect(summary.abTesting.successRate).toBe(0.5);
    });

    it('should calculate success rate correctly', () => {
      service.trackABTestPerformance('test-1', 'variant-a', 1000, true);
      service.trackABTestPerformance('test-1', 'variant-b', 1200, true);
      service.trackABTestPerformance('test-1', 'variant-c', 1500, false);

      const summary = service.getPerformanceSummary(1);
      expect(summary.abTesting.successRate).toBeCloseTo(0.667, 2);
    });
  });

  describe('trackCostOptimization', () => {
    it('should track cost optimization metrics correctly', () => {
      service.trackCostOptimization('openai', 0.05, 1000, 0.01);
      service.trackCostOptimization('anthropic', 0.03, 800, 0.02);

      const summary = service.getPerformanceSummary(1);
      expect(summary.costOptimization.totalCost).toBe(0.08);
      expect(summary.costOptimization.totalSavings).toBe(0.03);
      expect(summary.costOptimization.providerDistribution).toEqual({
        openai: 1,
        anthropic: 1,
      });
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return empty summary when no metrics', () => {
      const summary = service.getPerformanceSummary(1);

      expect(summary.hybridSearch.totalSearches).toBe(0);
      expect(summary.hybridSearch.averageLatency).toBe(0);
      expect(summary.analyticsDashboard.totalLoads).toBe(0);
      expect(summary.abTesting.totalTests).toBe(0);
      expect(summary.costOptimization.totalCost).toBe(0);
    });

    it('should filter metrics by time range', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      // Mock Date.now to return old timestamp for first metric
      const originalNow = Date.now;
      Date.now = vi.fn().mockReturnValueOnce(oldTimestamp);

      service.trackHybridSearch({
        searchId: 'old-search',
        query: 'old query',
        searchType: 'hybrid',
        totalLatency: 1000,
        semanticLatency: 500,
        keywordLatency: 300,
        fusionLatency: 200,
        resultsCount: 5,
        relevanceScore: 0.8,
      });

      // Restore Date.now
      Date.now = originalNow;

      service.trackHybridSearch({
        searchId: 'new-search',
        query: 'new query',
        searchType: 'hybrid',
        totalLatency: 1500,
        semanticLatency: 800,
        keywordLatency: 400,
        fusionLatency: 300,
        resultsCount: 8,
        relevanceScore: 0.9,
      });

      const summary24h = service.getPerformanceSummary(24);
      const summary48h = service.getPerformanceSummary(48);

      expect(summary24h.hybridSearch.totalSearches).toBe(1);
      expect(summary48h.hybridSearch.totalSearches).toBe(2);
    });
  });

  describe('exportMetrics', () => {
    beforeEach(() => {
      service.trackHybridSearch({
        searchId: 'test-search',
        query: 'test query',
        searchType: 'hybrid',
        totalLatency: 1000,
        semanticLatency: 500,
        keywordLatency: 300,
        fusionLatency: 200,
        resultsCount: 5,
        relevanceScore: 0.8,
      });
    });

    it('should export metrics as JSON', () => {
      const jsonExport = service.exportMetrics('json');
      const parsed = JSON.parse(jsonExport);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0]).toMatchObject({
        name: 'hybrid_search_performance',
        value: 1000,
        metadata: expect.objectContaining({
          searchId: 'test-search',
          query: 'test query',
        }),
      });
    });

    it('should export metrics as CSV', () => {
      const csvExport = service.exportMetrics('csv');
      const lines = csvExport.split('\n');

      expect(lines[0]).toBe('name,value,timestamp,metadata');
      expect(lines[1]).toContain('hybrid_search_performance,1000');
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      service.trackHybridSearch({
        searchId: 'test-search',
        query: 'test query',
        searchType: 'hybrid',
        totalLatency: 1000,
        semanticLatency: 500,
        keywordLatency: 300,
        fusionLatency: 200,
        resultsCount: 5,
        relevanceScore: 0.8,
      });

      expect(service.getPerformanceSummary(1).hybridSearch.totalSearches).toBe(1);

      service.clearMetrics();

      expect(service.getPerformanceSummary(1).hybridSearch.totalSearches).toBe(0);
    });
  });
});
