/**
 * ConsultationRequestForm Unit Tests
 * Tests form validation, submission, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsultationRequestForm } from './ConsultationRequestForm';
import * as chatFormService from '@/services/chatFormService';

// Mock the chatFormService
vi.mock('@/services/chatFormService', () => ({
  chatFormService: {
    submitConsultation: vi.fn(),
    addFormSubmission: vi.fn(),
  },
}));

describe('ConsultationRequestForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Rendering Tests
  // ========================================================================

  describe('Rendering', () => {
    it('should render all required fields', () => {
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      expect(screen.getByText(/Request a Consultation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Preferred Contact Method/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Additional Notes/i)).toBeInTheDocument();
    });

    it('should render contact preference radio group', () => {
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Video/i)).toBeInTheDocument();
    });

    it('should have submit and cancel buttons', () => {
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Validation Tests
  // ========================================================================

  describe('Validation', () => {
    it('should validate required name field', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate name minimum length', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.type(nameInput, 'A');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate required contact preference', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      // Fill required fields except contact preference
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a contact method/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user fixes field', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.type(nameInput, 'A');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
      });

      // Fix the error
      await user.clear(nameInput);
      await user.type(nameInput, 'John Doe');

      await waitFor(() => {
        expect(screen.queryByText(/at least 2 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // Submission Tests
  // ========================================================================

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        referenceNumber: 'EP-TEST-1234',
        message: 'Success',
      };

      vi.mocked(chatFormService.chatFormService.submitConsultation).mockResolvedValue(mockResult);

      render(
        <ConsultationRequestForm
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill all required fields
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.click(screen.getByLabelText(/Email/i)); // Select contact preference

      // Submit
      await user.click(screen.getByRole('button', { name: /Submit Request/i }));

      await waitFor(() => {
        expect(chatFormService.chatFormService.submitConsultation).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          company: '',
          contactPreference: 'email',
          notes: '',
        });
      });
    });

    it('should show success message after submission', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        referenceNumber: 'EP-TEST-1234',
        message: 'Success',
      };

      vi.mocked(chatFormService.chatFormService.submitConsultation).mockResolvedValue(mockResult);

      render(<ConsultationRequestForm onClose={mockOnClose} />);

      // Fill and submit
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.click(screen.getByLabelText(/Email/i));
      await user.click(screen.getByRole('button', { name: /Submit Request/i }));

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText(/Thank You, John Doe!/i)).toBeInTheDocument();
        expect(screen.getByText(/Reference: EP-TEST-1234/i)).toBeInTheDocument();
      });
    });

    it('should track submission in history', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        referenceNumber: 'EP-TEST-1234',
        message: 'Success',
      };

      vi.mocked(chatFormService.chatFormService.submitConsultation).mockResolvedValue(mockResult);

      render(<ConsultationRequestForm onClose={mockOnClose} />);

      // Fill and submit
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.click(screen.getByLabelText(/Phone/i));
      await user.click(screen.getByRole('button', { name: /Submit Request/i }));

      await waitFor(() => {
        expect(chatFormService.chatFormService.addFormSubmission).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'consultation-request',
            referenceNumber: 'EP-TEST-1234',
            data: expect.objectContaining({
              name: 'John Doe',
              email: 'john@example.com',
              contactPreference: 'phone',
            }),
          })
        );
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: false,
        referenceNumber: '',
        message: 'Error',
        error: 'Network error',
      };

      vi.mocked(chatFormService.chatFormService.submitConsultation).mockResolvedValue(mockResult);

      render(<ConsultationRequestForm onClose={mockOnClose} />);

      // Fill and submit
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.click(screen.getByLabelText(/Email/i));
      await user.click(screen.getByRole('button', { name: /Submit Request/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();

      vi.mocked(chatFormService.chatFormService.submitConsultation).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          referenceNumber: 'EP-TEST-1234',
          message: 'Success',
        }), 1000))
      );

      render(<ConsultationRequestForm onClose={mockOnClose} />);

      // Fill and submit
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.click(screen.getByLabelText(/Email/i));

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Submitting.../i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Prefill Data Tests
  // ========================================================================

  describe('Prefill Data', () => {
    it('should prefill form with provided data', () => {
      const prefillData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Acme Corp',
      };

      render(
        <ConsultationRequestForm
          onClose={mockOnClose}
          prefillData={prefillData}
        />
      );

      expect(screen.getByLabelText(/Your Name/i)).toHaveValue('Jane Smith');
      expect(screen.getByLabelText(/Email Address/i)).toHaveValue('jane@example.com');
      expect(screen.getByLabelText(/Company Name/i)).toHaveValue('Acme Corp');
    });
  });

  // ========================================================================
  // Interaction Tests
  // ========================================================================

  describe('User Interactions', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      await user.click(screen.getByLabelText(/Close form/i));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSubmit callback after successful submission', async () => {
      const user = userEvent.setup();
      const mockResult = {
        success: true,
        referenceNumber: 'EP-TEST-1234',
        message: 'Success',
      };

      vi.mocked(chatFormService.chatFormService.submitConsultation).mockResolvedValue(mockResult);

      render(
        <ConsultationRequestForm
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill and submit
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.click(screen.getByLabelText(/Video/i));
      await user.click(screen.getByRole('button', { name: /Submit Request/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            contactPreference: 'video',
          }),
          'EP-TEST-1234'
        );
      });
    });

    it('should handle keyboard navigation (ESC to close)', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels for required fields', () => {
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      expect(nameInput).toHaveAttribute('aria-invalid', 'false');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.type(nameInput, 'A');
      await user.tab();

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should connect error messages with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.type(nameInput, 'A');
      await user.tab();

      await waitFor(() => {
        const errorId = nameInput.getAttribute('aria-describedby');
        expect(errorId).toBeTruthy();
        expect(document.getElementById(errorId!)).toBeInTheDocument();
      });
    });

    it('should have radiogroup role for contact preferences', () => {
      render(<ConsultationRequestForm onClose={mockOnClose} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });
  });
});
