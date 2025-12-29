import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import { SignupFormModal } from '../SignupFormModal';

// Mock the auth context
const mockSignup = vi.fn();
const mockLoginWithGoogle = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    loginWithGoogle: mockLoginWithGoogle,
    currentUser: null,
    userProfile: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
  }),
}));

describe('SignupFormModal', () => {
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form correctly', () => {
    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation error for password mismatch', async () => {
    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const displayNameInput = screen.getByPlaceholderText(/enter your full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const displayNameInput = screen.getByPlaceholderText(/enter your full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('calls onSwitchToLogin when login link is clicked', () => {
    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const loginLink = screen.getByText(/sign in/i);
    fireEvent.click(loginLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility', () => {
    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const toggleButtons = screen.getAllByLabelText(/toggle password visibility/i);
    const passwordToggle = toggleButtons[0];

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('toggles confirm password visibility', () => {
    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i);

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('calls signup with valid data', async () => {
    mockSignup.mockResolvedValue(undefined);

    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const displayNameInput = screen.getByPlaceholderText(/enter your full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    });
  });

  it('shows loading state during signup', async () => {
    mockSignup.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const displayNameInput = screen.getByPlaceholderText(/enter your full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it('handles signup errors', async () => {
    mockSignup.mockRejectedValue(new Error('Email already in use'));

    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const displayNameInput = screen.getByPlaceholderText(/enter your full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
    });
  });

  it('calls loginWithGoogle when Google button is clicked', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);

    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
  });

  it('handles Google sign in errors', async () => {
    mockLoginWithGoogle.mockRejectedValue(new Error('Google sign in failed'));

    renderWithProviders(<SignupFormModal onSwitchToLogin={mockOnSwitchToLogin} />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText(/google sign in failed/i)).toBeInTheDocument();
    });
  });
});
