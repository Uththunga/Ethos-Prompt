/**
 * quotationAdminService Tests
 * Tests for admin API service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quotationAdminService } from '../quotationAdminService';

// Mock firebase auth
vi.mock('@/config/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-token-123'),
    },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('quotationAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listQuotations', () => {
    it('fetches quotations with default params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotations: [] }),
      });

      const result = await quotationAdminService.listQuotations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/adminListQuotations'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token-123',
          }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('includes status filter in query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotations: [] }),
      });

      await quotationAdminService.listQuotations({ status: 'pending' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
        expect.any(Object)
      );
    });

    it('includes service filter in query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotations: [] }),
      });

      await quotationAdminService.listQuotations({ serviceContext: 'smart-assistant' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('service=smart-assistant'),
        expect.any(Object)
      );
    });

    it('includes date range filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotations: [] }),
      });

      await quotationAdminService.listQuotations({ dateRange: '7d' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('dateRange=7d'),
        expect.any(Object)
      );
    });

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      await expect(quotationAdminService.listQuotations()).rejects.toThrow(
        /failed to list quotations/i
      );
    });
  });

  describe('getQuotation', () => {
    it('fetches single quotation by ID', async () => {
      const mockQuotation = { id: 'test-123', referenceNumber: 'QR-2025-001' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotation: mockQuotation }),
      });

      const result = await quotationAdminService.getQuotation('test-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/adminGetQuotation?id=test-123'),
        expect.any(Object)
      );
      expect(result.quotation).toEqual(mockQuotation);
    });

    it('throws on not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not found'),
      });

      await expect(quotationAdminService.getQuotation('invalid')).rejects.toThrow(
        /failed to get quotation/i
      );
    });
  });

  describe('updateQuotation', () => {
    it('updates quotation status', async () => {
      const updatedQuotation = { id: 'test-123', status: 'quoted' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotation: updatedQuotation }),
      });

      const result = await quotationAdminService.updateQuotation('test-123', {
        status: 'quoted',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/adminUpdateQuotation'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ id: 'test-123', status: 'quoted' }),
        })
      );
      expect(result.quotation.status).toBe('quoted');
    });

    it('updates internal notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, quotation: {} }),
      });

      await quotationAdminService.updateQuotation('test-123', {
        internalNotes: 'Follow up next week',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Follow up next week'),
        })
      );
    });

    it('throws on update failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid status'),
      });

      await expect(
        quotationAdminService.updateQuotation('test-123', { status: 'invalid' as any })
      ).rejects.toThrow(/failed to update quotation/i);
    });
  });

  describe('getStats', () => {
    it('fetches quotation statistics', async () => {
      const mockStats = { total: 100, pending: 25, quoted: 40, converted: 30, conversionRate: 30 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const result = await quotationAdminService.getStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/adminQuotationStats'),
        expect.any(Object)
      );
      expect(result).toEqual(mockStats);
    });

    it('returns zeros on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await quotationAdminService.getStats();

      expect(result.total).toBe(0);
      expect(result.conversionRate).toBe(0);
    });
  });
});
