import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsService } from '../services/analyticsService';

// Hoisted Firebase mocks to avoid vi.mock hoisting issues
const { mockGetDocs, mockQuery, mockWhere, mockCollection } = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockCollection: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: mockGetDocs,
  Timestamp: {
    fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000) })),
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000) })),
  },
}));

vi.mock('../config/firebase', () => ({ db: {} }));

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
  });

  describe('getUserAnalytics', () => {
    it('should handle empty collections gracefully', async () => {
      // Mock empty collection responses
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });

      const result = await analyticsService.getUserAnalytics('test-user');

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalPrompts).toBe(0);
      expect(result.metrics.totalExecutions).toBe(0);
      expect(result.metrics.totalDocuments).toBe(0);
      expect(result.metrics.successRate).toBe(0); // With no executions, success rate defaults to 0
      expect(Array.isArray(result.recentActivity)).toBe(true);
      expect(Array.isArray(result.topPrompts)).toBe(true);
    });

    it('should handle Firebase errors gracefully', async () => {
      // Mock Firebase error
      mockGetDocs.mockRejectedValue(new Error('Firebase connection failed'));

      const result = await analyticsService.getUserAnalytics('test-user');

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.recentActivity).toEqual([]);
      expect(result.topPrompts).toEqual([]);
    });

    it('should return proper structure with mock data', async () => {
      // Provide generic mock response; internal calculations are covered elsewhere
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });

      const result = await analyticsService.getUserAnalytics('test-user');

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.recentActivity)).toBe(true);
      expect(Array.isArray(result.topPrompts)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should not throw errors when Firebase is unavailable', async () => {
      mockGetDocs.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(analyticsService.getUserAnalytics('test-user')).resolves.toBeDefined();
    });

    it('should return consistent data structure even on errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await analyticsService.getUserAnalytics('test-user');

      // Verify structure matches service contract
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('topPrompts');

      // Verify metrics structure
      expect(result.metrics).toHaveProperty('totalPrompts');
      expect(result.metrics).toHaveProperty('totalExecutions');
      expect(result.metrics).toHaveProperty('totalDocuments');
      expect(result.metrics).toHaveProperty('avgExecutionTime');
      expect(result.metrics).toHaveProperty('successRate');
      expect(result.metrics).toHaveProperty('totalCost');
    });
  });
});
