/**
 * QuotationDetailPage Tests
 * Tests for individual quotation view and editing
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QuotationDetailPage } from '../QuotationDetailPage';
import { quotationAdminService } from '@/services/quotationAdminService';
import { AuthContext } from '@/contexts/AuthContext';
import type { QuotationDocument } from '@/types/quotation';

// Mock the admin service
vi.mock('@/services/quotationAdminService', () => ({
  quotationAdminService: {
    getQuotation: vi.fn(),
    updateQuotation: vi.fn(),
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
const mockQuotation: QuotationDocument = {
  id: 'quot-test-123',
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
  packageName: 'Standard Package',
  status: 'pending',
  assignedTo: null,
  internalNotes: '',
  createdAt: new Date('2025-12-20'),
  updatedAt: new Date('2025-12-20'),
  formData: {
    companyName: 'Acme Corp',
    contactName: 'John Smith',
    contactEmail: 'john@example.com',
    contactPhone: '+61 400 123 456',
    industry: 'Technology',
    companySize: '51-200',
    projectDescription: 'AI chatbot for customer support with natural language understanding',
    primaryGoals: ['24/7 support', 'Lead qualification'],
    specificFeatures: ['Multi-channel', 'CRM integration'],
    existingSystems: ['Salesforce', 'Zendesk'],
    integrationNeeds: 'Need to integrate with existing CRM and ticketing system',
    dataVolume: 'medium',
    securityRequirements: ['SOC 2', 'GDPR'],
    desiredTimeline: '3-6 months',
    budgetRange: '$50K-$100K',
    flexibility: 'some',
    needsConsultation: true,
    consultationFormat: 'video',
    preferredTimeSlots: ['Morning', 'Afternoon'],
    timezone: 'Australia/Sydney',
  },
  roiSnapshot: {
    serviceType: 'smart-assistant',
    monthlySavings: 15000,
    annualSavings: 180000,
    calculatedAt: '2025-12-20T10:00:00Z',
  },
};

// Wrapper component for testing with route params
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContext as any}>
      <Routes>
        <Route path="/admin/quotations/:id" element={children} />
      </Routes>
    </AuthContext.Provider>
  </BrowserRouter>
);

// Helper to render with specific route
const renderWithRoute = (quotationId: string = 'quot-test-123') => {
  window.history.pushState({}, '', `/admin/quotations/${quotationId}`);
  return render(<QuotationDetailPage />, { wrapper: TestWrapper });
};

describe('QuotationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (quotationAdminService.getQuotation as any).mockResolvedValue({
      success: true,
      quotation: mockQuotation,
    });
    (quotationAdminService.updateQuotation as any).mockResolvedValue({
      success: true,
      quotation: { ...mockQuotation, status: 'quoted' },
    });
  });

  it('renders the reference number as title', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('QR-2025-123456')).toBeInTheDocument();
    });
  });

  it('displays company and service info', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
      expect(screen.getByText(/Smart Business Assistant/)).toBeInTheDocument();
    });
  });

  it('displays contact information section', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('displays project scope section', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Project Scope')).toBeInTheDocument();
      expect(screen.getByText(/AI chatbot for customer support/)).toBeInTheDocument();
    });
  });

  it('displays primary goals', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('24/7 support')).toBeInTheDocument();
      expect(screen.getByText('Lead qualification')).toBeInTheDocument();
    });
  });

  it('displays timeline and budget', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Timeline & Budget')).toBeInTheDocument();
      expect(screen.getByText('3-6 months')).toBeInTheDocument();
      expect(screen.getByText('$50K-$100K')).toBeInTheDocument();
    });
  });

  it('displays ROI snapshot when available', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('ROI Calculator Data')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('$180,000')).toBeInTheDocument();
    });
  });

  it('allows status change', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'quoted' } });

    expect(statusSelect).toHaveValue('quoted');
  });

  it('saves changes when save button clicked', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    // Change status
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'quoted' } });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(quotationAdminService.updateQuotation).toHaveBeenCalledWith(
        'quot-test-123',
        expect.objectContaining({ status: 'quoted' })
      );
    });
  });

  it('displays internal notes textarea', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/add internal notes/i)).toBeInTheDocument();
    });
  });

  it('shows error on load failure', async () => {
    (quotationAdminService.getQuotation as any).mockRejectedValue(
      new Error('Failed to load')
    );

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quotation/i)).toBeInTheDocument();
    });
  });

  it('has back navigation button', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText(/back to quotations/i)).toBeInTheDocument();
    });
  });

  it('displays consultation preferences when user wants consultation', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Consultation')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('video')).toBeInTheDocument();
    });
  });
});
