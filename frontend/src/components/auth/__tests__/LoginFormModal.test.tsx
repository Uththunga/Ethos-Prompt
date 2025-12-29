import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import { LoginFormModal } from '../LoginFormModal';

// Mock the auth context
const mockLogin = vi.fn();
const mockLoginWithGoogle = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
    currentUser: null,
    userProfile: null,
    loading: false,
    logout: vi.fn(),
    signup: vi.fn(),
    updateUserProfile: vi.fn(),
  }),
}));

describe('LoginFormModal', () => {
  const mockOnSwitchToSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('prevents login with invalid email', async () => {
    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Wait a bit to ensure no login call was made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('prevents login with short password', async () => {
    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    // Wait a bit to ensure no login call was made
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls onSwitchToSignup when signup link is clicked', () => {
    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const signupLink = screen.getByText(/sign up/i);
    fireEvent.click(signupLink);

    expect(mockOnSwitchToSignup).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility', () => {
    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('calls login with valid credentials', async () => {
    mockLogin.mockResolvedValue(undefined);

    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during authentication', async () => {
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it('handles authentication errors', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls loginWithGoogle when Google button is clicked', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);

    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
  });

  it('handles Google sign in errors', async () => {
    mockLoginWithGoogle.mockRejectedValue(new Error('Google sign in failed'));

    renderWithProviders(<LoginFormModal onSwitchToSignup={mockOnSwitchToSignup} />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText(/google sign in failed/i)).toBeInTheDocument();
    });
  });
});
