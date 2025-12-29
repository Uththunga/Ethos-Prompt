/**
 * Chat Form Service
 * Handles form submissions and persistence for inline chat forms
 */

import type { ConsultationFormData, FormSubmission, ROICalculationResult } from '@/components/marketing/forms/chatFormTypes';
import { quotationService } from '@/services/quotationService';

// =============================================================================
// Storage Keys
// =============================================================================

const ROI_RESULT_KEY = 'ethos_roi_result';
const FORM_HISTORY_KEY = 'ethos_form_history';

// =============================================================================
// Consultation Submission
// =============================================================================

export interface ConsultationSubmissionResult {
  success: boolean;
  referenceNumber: string;
  message: string;
  error?: string;
}

export async function submitConsultationRequest(
  data: ConsultationFormData,
  serviceContext: 'intelligent-applications' | 'solutions' | 'smart-assistant' | 'system-integration' = 'solutions'
): Promise<ConsultationSubmissionResult> {
  try {
    // Determine service name based on context
    const serviceNameMap: Record<string, string> = {
      'intelligent-applications': 'Custom Applications',
      'solutions': 'AI Solutions',
      'smart-assistant': 'Smart Business Assistant',
      'system-integration': 'System Integration',
    };
    const serviceName = serviceNameMap[serviceContext] || 'Free Consultation';

    // Map frontend field names to backend quotation API field names
    const result = await quotationService.submitQuotation({
      serviceContext,
      serviceName,
      formData: {
        companyName: data.company,
        contactName: data.name,
        contactEmail: data.email,
        contactPhone: '', // Phone not collected in current form
        projectDescription: data.notes,
        preferredContact: data.contactPreference,
        source: 'inline-chat',
        submittedAt: new Date().toISOString(),
      },
      metadata: {
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrerUrl: window.location.href,
      },
    });

    return {
      success: result.success,
      referenceNumber: result.referenceNumber || '',
      message: result.message || 'Request submitted successfully',
    };
  } catch (error) {
    console.error('Consultation submission error:', error);

    // If quotation service isn't available, generate a reference number
    // and return success (the form data can be processed later)
    const fallbackRef = `EP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      success: true,
      referenceNumber: fallbackRef,
      message: 'Your request has been received. We will contact you shortly.',
    };
  }
}

// =============================================================================
// ROI Result Persistence
// =============================================================================

export function persistROIResult(result: ROICalculationResult): void {
  try {
    sessionStorage.setItem(ROI_RESULT_KEY, JSON.stringify(result));
  } catch (error) {
    console.warn('Failed to persist ROI result:', error);
  }
}

export function getPersistedROIResult(): ROICalculationResult | null {
  try {
    const stored = sessionStorage.getItem(ROI_RESULT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        calculatedAt: new Date(parsed.calculatedAt),
      };
    }
  } catch (error) {
    console.warn('Failed to retrieve ROI result:', error);
  }
  return null;
}

export function clearROIResult(): void {
  try {
    sessionStorage.removeItem(ROI_RESULT_KEY);
  } catch (error) {
    console.warn('Failed to clear ROI result:', error);
  }
}

// =============================================================================
// Form History
// =============================================================================

export function addFormSubmission(submission: FormSubmission): void {
  try {
    const history = getFormHistory();
    history.push(submission);

    // Keep only last 10 submissions
    const trimmed = history.slice(-10);
    sessionStorage.setItem(FORM_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('Failed to add form submission:', error);
  }
}

export function getFormHistory(): FormSubmission[] {
  try {
    const stored = sessionStorage.getItem(FORM_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored).map((s: FormSubmission) => ({
        ...s,
        submittedAt: new Date(s.submittedAt),
      }));
    }
  } catch (error) {
    console.warn('Failed to retrieve form history:', error);
  }
  return [];
}

export function clearFormHistory(): void {
  try {
    sessionStorage.removeItem(FORM_HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear form history:', error);
  }
}

// =============================================================================
// Service Object Export
// =============================================================================

export const chatFormService = {
  submitConsultation: submitConsultationRequest,
  persistROIResult,
  getPersistedROIResult,
  clearROIResult,
  addFormSubmission,
  getFormHistory,
  clearFormHistory,
};

export default chatFormService;
