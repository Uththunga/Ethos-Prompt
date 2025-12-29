/**
 * Tests for Rating Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import {
  submitRating,
  getRatings,
  getRatingAggregates,
  getUserRatingForExecution,
  getTopRatedPrompts,
  getRatingTrends,
  getModelRatingComparison,
} from '../ratingService';

// Mock Firebase
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => date),
  },
}));

vi.mock('../../config/firebase', () => ({
  functions: {},
  db: {},
}));

describe('Rating Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitRating', () => {
    it('should submit rating successfully', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratingId: 'rating-123',
          message: 'Rating submitted successfully',
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await submitRating({
        executionId: 'exec-123',
        rating: 5,
        thumbsUpDown: true,
      });

      expect(result).toEqual({
        success: true,
        ratingId: 'rating-123',
      });
      expect(mockCallable).toHaveBeenCalledWith({
        executionId: 'exec-123',
        rating: 5,
        thumbsUpDown: true,
      });
    });

    it('should handle submission errors', async () => {
      const mockCallable = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(
        submitRating({
          executionId: 'exec-123',
          rating: 5,
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: false,
          message: 'Invalid rating',
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(
        submitRating({
          executionId: 'exec-123',
          rating: 10, // Invalid
        })
      ).rejects.toThrow('Invalid rating');
    });

    it('should submit rating with all optional fields', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratingId: 'rating-123',
          message: 'Rating submitted successfully',
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await submitRating({
        executionId: 'exec-123',
        rating: 4,
        thumbsUpDown: true,
        textFeedback: 'Great response!',
        promptId: 'prompt-456',
        modelUsed: 'gpt-4',
      });

      expect(result.success).toBe(true);
      expect(mockCallable).toHaveBeenCalledWith({
        executionId: 'exec-123',
        rating: 4,
        thumbsUpDown: true,
        textFeedback: 'Great response!',
        promptId: 'prompt-456',
        modelUsed: 'gpt-4',
      });
    });
  });

  describe('getRatings', () => {
    it('should fetch ratings successfully', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          executionId: 'exec-123',
          userId: 'user-1',
          rating: 5,
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          id: 'rating-2',
          executionId: 'exec-456',
          userId: 'user-1',
          rating: 4,
          timestamp: '2024-01-02T00:00:00Z',
        },
      ];

      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratings: mockRatings,
          count: 2,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getRatings({ userId: 'user-1' });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('rating-1');
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty results', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratings: [],
          count: 0,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getRatings({ executionId: 'nonexistent' });

      expect(result).toHaveLength(0);
    });

    it('should apply filters correctly', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratings: [],
          count: 0,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await getRatings({
        executionId: 'exec-123',
        promptId: 'prompt-456',
        userId: 'user-1',
        limit: 10,
      });

      expect(mockCallable).toHaveBeenCalledWith({
        executionId: 'exec-123',
        promptId: 'prompt-456',
        userId: 'user-1',
        limit: 10,
      });
    });
  });

  describe('getRatingAggregates', () => {
    it('should fetch aggregates successfully', async () => {
      const mockAggregates = {
        totalRatings: 100,
        averageRating: 4.5,
        ratingDistribution: {
          1: 5,
          2: 10,
          3: 15,
          4: 30,
          5: 40,
        },
        thumbsUpCount: 70,
        thumbsDownCount: 15,
        feedbackCount: 25,
      };

      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          aggregates: mockAggregates,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getRatingAggregates({ promptId: 'prompt-123' });

      expect(result).toEqual(mockAggregates);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalRatings).toBe(100);
    });

    it('should handle zero ratings', async () => {
      const mockAggregates = {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        thumbsUpCount: 0,
        thumbsDownCount: 0,
        feedbackCount: 0,
      };

      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          aggregates: mockAggregates,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getRatingAggregates({ promptId: 'new-prompt' });

      expect(result.totalRatings).toBe(0);
      expect(result.averageRating).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockCallable = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(getRatings()).rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: false,
          message: 'Internal server error',
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(getRatingAggregates()).rejects.toThrow();
    });
  });

  describe('Data Transformation', () => {
    it('should convert timestamp strings to Date objects', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          executionId: 'exec-123',
          userId: 'user-1',
          rating: 5,
          timestamp: '2024-01-01T12:00:00Z',
        },
      ];

      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratings: mockRatings,
          count: 1,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getRatings();

      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[0].timestamp.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle missing timestamps', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          executionId: 'exec-123',
          userId: 'user-1',
          rating: 5,
          timestamp: null,
        },
      ];

      const mockCallable = vi.fn().mockResolvedValue({
        data: {
          success: true,
          ratings: mockRatings,
          count: 1,
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getRatings();

      expect(result[0].timestamp).toBeInstanceOf(Date);
    });
  });
});

