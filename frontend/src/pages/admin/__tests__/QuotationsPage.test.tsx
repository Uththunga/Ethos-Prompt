/**
 * QuotationsPage Tests
 * Tests for admin quotation list view
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QuotationsPage } from '../QuotationsPage';
import { quotationAdminService } from '@/services/quotationAdminService';
import { AuthContext } from '@/contexts/AuthContext';
import type { QuotationDocument } from '@/types/quotation';

// Mock the admin service
vi.mock('@/services/quotationAdminService', () => ({
  quotationAdminService: {
    listQuotations: vi.fn(),
  },
}));

// Mock auth context
const mockUser = { uid: 'test-user-123', email: 'admin@test.com' };
const mockAuthContext = {
  currentUser: mockUser,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
};

// Mock quotation data
const mockQuotations: QuotationDocument[] = [
  {
    id: 'quot-1',
    referenceNumber: 'QR-2025-123456',
    contactName: 'John Smith',
    contactEmail: 'john@example.com',
    contactPhone: '+61 400 123 456',
    companyName: 'Acme Corp',
    industry: 'Technology',
    companySize: '51-200',
    serviceContext: 'smart-assistant',
    serviceName: 'Smart Business Assistant',
    packageType: 'standard',
    status: 'pending',
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2025-12-20'),
    formData: {
      companyName: 'Acme Corp',
      contactName: 'John Smith',
      contactEmail: 'john@example.com',
      contactPhone: '+61 400 123 456',
      industry: 'Technology',
      companySize: '51-200',
      projectDescription: 'AI chatbot for customer support',
      primaryGoals: ['24/7 support'],
      specificFeatures: ['Multi-channel'],
      existingSystems: [],
      integrationNeeds: '',
      dataVolume: 'medium',
      securityRequirements: [],
      desiredTimeline: '3-6 months',
      budgetRange: '$50K-$100K',
      flexibility: 'some',
      needsConsultation: true,
      consultationFormat: 'video',
      preferredTimeSlots: ['Morning'],
    },
  },
  {
    id: 'quot-2',
    referenceNumber: 'QR-2025-789012',
    contactName: 'Jane Doe',
    contactEmail: 'jane@startup.com',
    contactPhone: '',
    companyName: 'Startup XYZ',
    industry: 'Healthcare',
    companySize: '11-50',
    serviceContext: 'system-integration',
    serviceName: 'System Integration',
    status: 'quoted',
    createdAt: new Date('2025-12-19'),
    updatedAt: new Date('2025-12-21'),
    formData: {
      companyName: 'Startup XYZ',
      contactName: 'Jane Doe',
      contactEmail: 'jane@startup.com',
      contactPhone: '',
      industry: 'Healthcare',
      companySize: '11-50',
      projectDescription: 'ERP to CRM integration',
      primaryGoals: ['Connect systems'],
      specificFeatures: ['API integration'],
      existingSystems: ['Salesforce', 'SAP'],
      integrationNeeds: 'Bidirectional sync',
      dataVolume: 'large',
      securityRequirements: ['HIPAA'],
      desiredTimeline: '1-3 months',
      budgetRange: '$25K-$50K',
      flexibility: 'fixed',
      needsConsultation: false,
      consultationFormat: null,
      preferredTimeSlots: [],
    },
  },
];

// Wrapper component for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContext as any}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('QuotationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (quotationAdminService.listQuotations as any).mockResolvedValue({
      success: true,
      quotations: mockQuotations,
    });
  });

  it('renders the page title', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('Quotations')).toBeInTheDocument();
  });

  it('displays quotation list', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('QR-2025-123456')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
  });

  it('shows empty state when no quotations', async () => {
    (quotationAdminService.listQuotations as any).mockResolvedValue({
      success: true,
      quotations: [],
    });

    render(<QuotationsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('No quotations found.')).toBeInTheDocument();
    });
  });

  it('displays status badges correctly', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('quoted')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    await waitFor(() => {
      expect(quotationAdminService.listQuotations).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });
  });

  it('filters by service', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    const serviceFilter = screen.getByRole('combobox', { name: /service/i });
    fireEvent.change(serviceFilter, { target: { value: 'smart-assistant' } });

    await waitFor(() => {
      expect(quotationAdminService.listQuotations).toHaveBeenCalledWith(
        expect.objectContaining({ serviceContext: 'smart-assistant' })
      );
    });
  });

  it('handles search input', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    // Search is client-side, so it should filter displayed results
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    (quotationAdminService.listQuotations as any).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<QuotationsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText(/failed to load quotations/i)).toBeInTheDocument();
    });
  });

  it('pagination controls work', async () => {
    render(<QuotationsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(quotationAdminService.listQuotations).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});
