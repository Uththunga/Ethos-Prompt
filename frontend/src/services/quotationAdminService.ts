/**
 * Quotation Admin Service
 * Provides CRUD operations for quotation management in admin panel
 *
 * For MVP: Uses authenticated API calls to backend
 * Backend needs to expose quotation list/update endpoints
 */

import { auth } from '@/config/firebase';
import type {
    QuotationListParams,
    QuotationListResponse,
    QuotationResponse,
    QuotationUpdatePayload
} from '@/types/quotation';

// Build base URL from environment
const buildBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_QUOTATION_API_BASE_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }
  // Fallback for development
  return 'http://localhost:5001';
};

const baseUrl = buildBaseUrl();

// Get auth header for authenticated requests
const getAuthHeader = async (): Promise<Record<string, string>> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// Build query string from params
const buildQuery = (params: QuotationListParams): string => {
  const parts: string[] = [];
  if (params.status && params.status !== 'all') parts.push(`status=${params.status}`);
  if (params.serviceContext && params.serviceContext !== 'all') parts.push(`service=${params.serviceContext}`);
  if (params.assignedTo && params.assignedTo !== 'all') parts.push(`assignedTo=${params.assignedTo}`);
  if (params.dateRange && params.dateRange !== 'all') parts.push(`dateRange=${params.dateRange}`);
  if (params.page) parts.push(`page=${params.page}`);
  if (params.pageSize) parts.push(`pageSize=${params.pageSize}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
};

export const quotationAdminService = {
  /**
   * List quotations with optional filters
   */
  async listQuotations(params: QuotationListParams = {}): Promise<QuotationListResponse> {
    const headers = await getAuthHeader();
    const query = buildQuery(params);

    const res = await fetch(`${baseUrl}/adminListQuotations${query}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to list quotations: ${res.status} ${text}`);
    }

    return res.json();
  },

  /**
   * Get a single quotation by ID
   */
  async getQuotation(id: string): Promise<QuotationResponse> {
    const headers = await getAuthHeader();

    const res = await fetch(`${baseUrl}/adminGetQuotation?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to get quotation: ${res.status} ${text}`);
    }

    return res.json();
  },

  /**
   * Update quotation status, assignment, or notes
   */
  async updateQuotation(id: string, updates: QuotationUpdatePayload): Promise<QuotationResponse> {
    const headers = await getAuthHeader();

    const res = await fetch(`${baseUrl}/adminUpdateQuotation`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id, ...updates }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to update quotation: ${res.status} ${text}`);
    }

    return res.json();
  },

  /**
   * Get quotation statistics for dashboard
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    quoted: number;
    converted: number;
    conversionRate: number;
  }> {
    const headers = await getAuthHeader();

    const res = await fetch(`${baseUrl}/adminQuotationStats`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      // Return zeros if stats endpoint not available
      return {
        total: 0,
        pending: 0,
        quoted: 0,
        converted: 0,
        conversionRate: 0,
      };
    }

    return res.json();
  },
};

export default quotationAdminService;
