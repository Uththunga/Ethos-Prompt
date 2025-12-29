/**
 * Quotation Types for Admin Management
 * Used by QuotationsPage and QuotationDetailPage
 */

import type { QuotationFormData, ServiceContext } from '@/components/marketing/quotation/types';

// Quotation status workflow
export type QuotationStatus =
  | 'pending'     // Just submitted
  | 'reviewed'    // Sales has reviewed
  | 'quoted'      // Quote sent to customer
  | 'converted'   // Customer accepted
  | 'declined';   // Customer declined or no response

// Stored quotation document structure
export interface QuotationDocument {
  id: string;
  referenceNumber: string;

  // Contact info (from Step 1)
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  industry: string;
  companySize: string;

  // Service context
  serviceContext: ServiceContext;
  serviceName: string;
  packageType?: string;
  packageName?: string;

  // Full form data
  formData: QuotationFormData;

  // Status tracking
  status: QuotationStatus;
  assignedTo?: string;
  assignedToName?: string;

  // Timestamps
  createdAt: Date | any; // Firestore Timestamp
  updatedAt: Date | any;
  quotedAt?: Date | any;
  convertedAt?: Date | any;

  // Internal notes
  internalNotes?: string;

  // ROI snapshot if available
  roiSnapshot?: {
    serviceType: string;
    monthlySavings: number;
    annualSavings: number;
    calculatedAt: string;
    [key: string]: unknown;
  };

  // Source tracking
  metadata?: {
    userAgent?: string;
    referrerUrl?: string;
    utmParams?: Record<string, string>;
  };

  // Contact ID if linked to contacts collection
  contactId?: string;
}

// List params for filtering
export interface QuotationListParams {
  status?: QuotationStatus | 'all';
  serviceContext?: ServiceContext | 'all';
  assignedTo?: string | 'all' | 'unassigned';
  dateRange?: 'today' | '7d' | '30d' | 'all';
  page?: number;
  pageSize?: number;
}

// API responses
export interface QuotationListResponse {
  success: boolean;
  quotations: QuotationDocument[];
  totalCount?: number;
}

export interface QuotationResponse {
  success: boolean;
  quotation: QuotationDocument;
}

export interface QuotationUpdatePayload {
  status?: QuotationStatus;
  assignedTo?: string;
  assignedToName?: string;
  internalNotes?: string;
}
