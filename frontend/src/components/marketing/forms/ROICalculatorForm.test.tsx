/**
 * ROICalculatorForm Unit Tests
 * Tests calculation accuracy, validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROICalculatorForm } from './ROICalculatorForm';
import type { ROICalculationResult } from './chatFormTypes';

describe('ROICalculatorForm', () => {
  const mockOnClose = vi.fn();
  const mockOnCalculate = vi.fn();
  const mockOnRequestConsultation = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Rendering Tests
  // ========================================================================

  describe('Rendering', () => {
    it('should render service selection initially', () => {
      render(<ROICalculatorForm onClose={mockOnClose} />);

      expect(screen.getByText(/Which service are you interested in\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Smart Business Assistant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /System Integration/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Intelligent Applications/i })).toBeInTheDocument();
    });

    it('should render form fields after selecting service', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      expect(screen.getByLabelText(/Team Size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Customer Inquiries/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    });

    it('should show step indicators for multi-step form', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      const stepIndicators = screen.getAllByRole('progressbar');
      expect(stepIndicators).toHaveLength(1);
    });

    it('should have close button', () => {
      render(<ROICalculatorForm onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText(/Close form/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Navigation Tests
  // ========================================================================

  describe('Step Navigation', () => {
    it('should advance to step 2 with valid step 1 data', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Fill step 1
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');

      // Click Next
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Should show step 2 fields
      await waitFor(() => {
        expect(screen.getByLabelText(/Avg. Response Time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Hourly Employee Cost/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });
    });

    it('should not advance with invalid step 1 data', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Click Next without filling fields
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getAllByRole('alert')).toHaveLength(2);
      });

      // Should still be on step 1
      expect(screen.getByLabelText(/Team Size/i)).toBeInTheDocument();
    });

    it('should navigate back from step 2 to step 1', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Fill and advance to step 2
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');
      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });

      // Click Back
      await user.click(screen.getByRole('button', { name: /Back/i }));

      // Should be back on step 1
      await waitFor(() => {
        expect(screen.getByLabelText(/Team Size/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // Validation Tests
  // ========================================================================

  describe('Validation', () => {
    it('should validate team size minimum', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      const teamSizeInput = screen.getByLabelText(/Team Size/i);
      await user.type(teamSizeInput, '0');
      fireEvent.blur(teamSizeInput);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument();
      });
    });

    it('should validate monthly inquiries required', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      const inquiriesInput = screen.getByLabelText(/Monthly Customer Inquiries/i);
      fireEvent.blur(inquiriesInput);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      const teamSizeInput = screen.getByLabelText(/Team Size/i);
      await user.type(teamSizeInput, '0');
      fireEvent.blur(teamSizeInput);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument();
      });

      // Clear and type valid value
      await user.clear(teamSizeInput);
      await user.type(teamSizeInput, '10');

      await waitFor(() => {
        expect(screen.queryByText(/must be at least 1/i)).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // Calculation Tests
  // ========================================================================

  describe('ROI Calculation', () => {
    it('should calculate ROI correctly', async () => {
      const user = userEvent.setup();
      render(
        <ROICalculatorForm
          onClose={mockOnClose}
          onCalculate={mockOnCalculate}
        />
      );

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Fill step 1
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Fill step 2
      await waitFor(() => {
        expect(screen.getByLabelText(/Avg. Response Time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Avg. Response Time/i), '2');
      await user.type(screen.getByLabelText(/Hourly Employee Cost/i), '50');

      // Calculate
      await user.click(screen.getByRole('button', { name: /Calculate ROI/i }));

      // Verify calculation
      // Expected: 500 inquiries * 2 hours * 0.7 efficiency * $50/hour = $35,000/month
      await waitFor(() => {
        expect(mockOnCalculate).toHaveBeenCalledWith(
          expect.objectContaining({
            monthlyTimeSavings: 700, // 500 * 2 * 0.7
            monthlyMoneySavings: 35000, // 700 * 50
            annualSavings: 420000, // 35000 * 12
          })
        );
      });
    });

    it('should display results after calculation', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Fill all fields
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');
      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Avg. Response Time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Avg. Response Time/i), '2');
      await user.type(screen.getByLabelText(/Hourly Employee Cost/i), '50');
      await user.click(screen.getByRole('button', { name: /Calculate ROI/i }));

      // Should show results
      await waitFor(() => {
        expect(screen.getByText(/Annual Savings/i)).toBeInTheDocument();
        expect(screen.getByText(/\$420,000/i)).toBeInTheDocument(); // AUD format
      });
    });

    it('should show Schedule Consultation button after results', async () => {
      const user = userEvent.setup();
      render(
        <ROICalculatorForm
          onClose={mockOnClose}
          onRequestConsultation={mockOnRequestConsultation}
        />
      );

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Complete calculation
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');
      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Avg. Response Time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Avg. Response Time/i), '2');
      await user.type(screen.getByLabelText(/Hourly Employee Cost/i), '50');
      await user.click(screen.getByRole('button', { name: /Calculate ROI/i }));

      // Should show consultation button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Schedule Consultation/i })).toBeInTheDocument();
      });
    });

    it('should trigger consultation callback when clicking Schedule', async () => {
      const user = userEvent.setup();
      render(
        <ROICalculatorForm
          onClose={mockOnClose}
          onRequestConsultation={mockOnRequestConsultation}
        />
      );

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Complete calculation and click Schedule
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');
      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Avg. Response Time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Avg. Response Time/i), '2');
      await user.type(screen.getByLabelText(/Hourly Employee Cost/i), '50');
      await user.click(screen.getByRole('button', { name: /Calculate ROI/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Schedule Consultation/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Schedule Consultation/i }));

      expect(mockOnRequestConsultation).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Interaction Tests
  // ========================================================================

  describe('User Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      await user.click(screen.getByLabelText(/Close form/i));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onComplete with result', async () => {
      const user = userEvent.setup();
      render(
        <ROICalculatorForm
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      // Complete calculation
      await user.type(screen.getByLabelText(/Team Size/i), '10');
      await user.type(screen.getByLabelText(/Monthly Customer Inquiries/i), '500');
      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Avg. Response Time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Avg. Response Time/i), '2');
      await user.type(screen.getByLabelText(/Hourly Employee Cost/i), '50');
      await user.click(screen.getByRole('button', { name: /Calculate ROI/i }));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining<ROICalculationResult>({
            serviceType: 'smart-assistant',
            monthlySavings: 35000,
            monthlyTimeSavings: 700,
            monthlyMoneySavings: 35000,
            annualSavings: 420000,
            paybackPeriod: expect.any(String),
            calculatedAt: expect.any(Date),
          })
        );
      });
    });

    it('should handle keyboard navigation (ESC to close)', async () => {
      const user = userEvent.setup();
      const { container } = render(<ROICalculatorForm onClose={mockOnClose} />);

      // Focus the form container first
      const formContainer = container.querySelector('.chat-form-container') as HTMLElement;
      formContainer?.focus();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      expect(screen.getByLabelText(/Team Size/i)).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByLabelText(/Close form/i)).toBeInTheDocument();
    });

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      const teamSizeInput = screen.getByLabelText(/Team Size/i);
      await user.type(teamSizeInput, '0');
      fireEvent.blur(teamSizeInput);

      await waitFor(() => {
        expect(teamSizeInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should connect error messages with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<ROICalculatorForm onClose={mockOnClose} />);

      // Select Service
      await user.click(screen.getByRole('button', { name: /Smart Business Assistant/i }));

      const teamSizeInput = screen.getByLabelText(/Team Size/i);
      await user.type(teamSizeInput, '0');
      fireEvent.blur(teamSizeInput);

      await waitFor(() => {
        const errorId = teamSizeInput.getAttribute('aria-describedby');
        expect(errorId).toBeTruthy();
        expect(document.getElementById(errorId!)).toBeInTheDocument();
      });
    });
  });
});
