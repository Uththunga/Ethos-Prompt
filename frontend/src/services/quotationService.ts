import type { QuotationFormData } from '@/components/marketing/quotation/types';
import type { UtmParams } from '@/utils/utmTracking';

export type QuotationSubmissionPayload = {
  serviceContext: 'intelligent-applications' | 'solutions' | 'smart-assistant' | 'system-integration';
  serviceName: string;
  packageType?: 'basic' | 'standard' | 'enterprise';
  packageName?: string;
  // GAP-004 FIX: Type-safe formData - accepts QuotationFormData or consultation form data
  formData: QuotationFormData | Record<string, unknown>;
  metadata: {
    submittedAt: string;
    userAgent: string;
    referrerUrl: string;
    // GAP-009: UTM parameters for marketing attribution
    utmParams?: UtmParams;
  };
  // GAP-005: Include ROI calculation data if user completed calculator before quotation
  roiSnapshot?: {
    serviceType: string;
    monthlySavings: number;
    annualSavings: number;
    calculatedAt: string;
    [key: string]: unknown; // Allow additional service-specific fields
  };
};

export type QuotationSubmissionResponse = {
  success: boolean;
  referenceNumber?: string;
  message?: string;
  error?: string;
  contactId?: string;
};

const getBaseUrl = () => {
  // Configure base URL to your Functions HTTP endpoint, e.g. https://<region>-<project>.cloudfunctions.net
  // For local dev without backend, leave undefined to simulate success.
  const envUrl = (import.meta as any).env?.VITE_QUOTATION_API_BASE_URL as string | undefined;
  return envUrl && envUrl.trim().length > 0 ? envUrl.replace(/\/$/, '') : undefined;
};

export const quotationService = {
  async submitQuotation(payload: QuotationSubmissionPayload): Promise<QuotationSubmissionResponse> {
    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      // Frontend-only simulation: mimic network delay and generate a reference number
      const ref = `QR-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, referenceNumber: ref }), 800));
    }

    // Directly call the Cloud Function by its exported name: submitQuotationRequest
    const res = await fetch(`${baseUrl}/submitQuotationRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Quotation submission failed: HTTP ${res.status} ${text}`);
    }

    return res.json();
  },
};
