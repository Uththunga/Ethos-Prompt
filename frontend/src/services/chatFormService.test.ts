/**
 * chatFormService Unit Tests
 * Tests backend integration, persistence, and error handling
 */

import type { ConsultationFormData, ROICalculationResult } from '@/components/marketing/forms/chatFormTypes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addFormSubmission,
    chatFormService,
    clearFormHistory,
    clearROIResult,
    getFormHistory,
    getPersistedROIResult,
    persistROIResult,
    submitConsultationRequest,
} from './chatFormService';
import { quotationService } from './quotationService';

// Mock quotationService
vi.mock('./quotationService', () => ({
  quotationService: {
    submitQuotation: vi.fn(),
  },
}));

describe('chatFormService', () => {
  beforeEach(() => {
    // Clear storage before each test
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // ========================================================================
  // Consultation Submission Tests
  // ========================================================================

  describe('submitConsultationRequest', () => {
    const mockFormData: ConsultationFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      contactPreference: 'email',
      notes: 'Looking for AI solutions',
    };

    it('should submit via quotation service successfully', async () => {
      const mockResult = {
        success: true,
        referenceNumber: 'EP-TEST-1234',
        message: 'Submitted successfully',
      };

      vi.mocked(quotationService.submitQuotation).mockResolvedValue(mockResult);

      const result = await submitConsultationRequest(mockFormData);

      expect(result.success).toBe(true);
      expect(result.referenceNumber).toBe('EP-TEST-1234');
      expect(quotationService.submitQuotation).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceContext: 'solutions',
          serviceName: 'Free Consultation',
          formData: expect.objectContaining({
            ...mockFormData,
            source: 'inline-chat',
          }),
        })
      );
    });

    it('should handle quotation service errors with fallback', async () => {
      vi.mocked(quotationService.submitQuotation).mockRejectedValue(
        new Error('Network error')
      );

      const result = await submitConsultationRequest(mockFormData);

      expect(result.success).toBe(true); // Fallback still returns success
      expect(result.referenceNumber).toMatch(/^EP-/); // Generates fallback reference
      expect(result.message).toContain('received');
    });

    it('should include metadata in submission', async () => {
      const mockResult = {
        success: true,
        referenceNumber: 'EP-TEST-1234',
        message: 'Success',
      };

      vi.mocked(quotationService.submitQuotation).mockResolvedValue(mockResult);

      await submitConsultationRequest(mockFormData);

      expect(quotationService.submitQuotation).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            submittedAt: expect.any(String),
            userAgent: expect.any(String),
            referrerUrl: expect.any(String),
          }),
        })
      );
    });
  });

  // ========================================================================
  // ROI Result Persistence Tests
  // ========================================================================

  describe('ROI Result Persistence', () => {
    const mockROIResult: ROICalculationResult = {
      monthlyTimeSavings: 700,
      monthlyMoneySavings: 35000,
      annualSavings: 420000,
      paybackPeriod: '2 months',
      calculatedAt: new Date('2024-01-01'),
    };

    it('should persist ROI result to session storage', () => {
      persistROIResult(mockROIResult);

      const stored = sessionStorage.getItem('ethos_roi_result');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.monthlyTimeSavings).toBe(700);
      expect(parsed.annualSavings).toBe(420000);
    });

    it('should retrieve persisted ROI result', () => {
      persistROIResult(mockROIResult);

      const retrieved = getPersistedROIResult();

      expect(retrieved).toBeTruthy();
      expect(retrieved?.monthlyTimeSavings).toBe(700);
      expect(retrieved?.annualSavings).toBe(420000);
      expect(retrieved?.calculatedAt).toBeInstanceOf(Date);
    });

    it('should return null when no result persisted', () => {
      const result = getPersistedROIResult();
      expect(result).toBeNull();
    });

    it('should clear persisted ROI result', () => {
      persistROIResult(mockROIResult);
      expect(getPersistedROIResult()).toBeTruthy();

      clearROIResult();
      expect(getPersistedROIResult()).toBeNull();
    });

    it('should handle corrupted storage data gracefully', () => {
      sessionStorage.setItem('ethos_roi_result', 'invalid-json');

      const result = getPersistedROIResult();
      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      // Mock sessionStorage to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => persistROIResult(mockROIResult)).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  // ========================================================================
  // Form History Tests
  // ========================================================================

  describe('Form History', () => {
    it('should add form submission to history', () => {
      const submission = {
        id: 'EP-TEST-1',
        type: 'consultation-request' as const,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          company: '',
          contactPreference: 'email' as const,
          notes: '',
        },
        referenceNumber: 'EP-TEST-1',
        submittedAt: new Date(),
      };

      addFormSubmission(submission);

      const history = getFormHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('EP-TEST-1');
      expect(history[0].type).toBe('consultation-request');
    });

    it('should maintain history of multiple submissions', () => {
      for (let i = 0; i < 5; i++) {
        addFormSubmission({
          id: `EP-TEST-${i}`,
          type: 'consultation-request' as const,
          data: {
            name: 'Test',
            email: 'test@example.com',
            company: '',
            contactPreference: 'email' as const,
            notes: '',
          },
          referenceNumber: `EP-TEST-${i}`,
          submittedAt: new Date(),
        });
      }

      const history = getFormHistory();
      expect(history).toHaveLength(5);
    });

    it('should limit history to last 10 submissions', () => {
      for (let i = 0; i < 15; i++) {
        addFormSubmission({
          id: `EP-TEST-${i}`,
          type: 'consultation-request' as const,
          data: {
            name: 'Test',
            email: 'test@example.com',
            company: '',
            contactPreference: 'email' as const,
            notes: '',
          },
          referenceNumber: `EP-TEST-${i}`,
          submittedAt: new Date(),
        });
      }

      const history = getFormHistory();
      expect(history).toHaveLength(10);

      // Should keep most recent
      expect(history[9].id).toBe('EP-TEST-14');
      expect(history[0].id).toBe('EP-TEST-5');
    });

    it('should return empty array when no history', () => {
      const history = getFormHistory();
      expect(history).toEqual([]);
    });

    it('should clear form history', () => {
      addFormSubmission({
        id: 'EP-TEST-1',
        type: 'consultation-request' as const,
        data: {
          name: 'Test',
          email: 'test@example.com',
          company: '',
          contactPreference: 'email' as const,
          notes: '',
        },
        referenceNumber: 'EP-TEST-1',
        submittedAt: new Date(),
      });

      expect(getFormHistory()).toHaveLength(1);

      clearFormHistory();
      expect(getFormHistory()).toEqual([]);
    });

    it('should handle corrupted history data gracefully', () => {
      sessionStorage.setItem('ethos_form_history', 'invalid-json');

      const history = getFormHistory();
      expect(history).toEqual([]);
    });

    it('should deserialize dates in history', () => {
      const submittedAt = new Date('2024-01-01');

      addFormSubmission({
        id: 'EP-TEST-1',
        type: 'roi-calculator' as const,
        data: {
          teamSize: 10,
          monthlyInquiries: 500,
          avgResponseTime: 2,
          hourlyEmployeeCost: 50,
        },
        referenceNumber: 'EP-TEST-1',
        submittedAt,
      });

      const history = getFormHistory();
      expect(history[0].submittedAt).toBeInstanceOf(Date);
      expect(history[0].submittedAt.toISOString()).toBe(submittedAt.toISOString());
    });
  });

  // ========================================================================
  // Service Object Tests
  // ========================================================================

  describe('chatFormService object', () => {
    it('should export all methods', () => {
      expect(chatFormService.submitConsultation).toBe(submitConsultationRequest);
      expect(chatFormService.persistROIResult).toBe(persistROIResult);
      expect(chatFormService.getPersistedROIResult).toBe(getPersistedROIResult);
      expect(chatFormService.clearROIResult).toBe(clearROIResult);
      expect(chatFormService.addFormSubmission).toBe(addFormSubmission);
      expect(chatFormService.getFormHistory).toBe(getFormHistory);
      expect(chatFormService.clearFormHistory).toBe(clearFormHistory);
    });
  });
});
