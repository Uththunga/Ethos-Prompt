import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/marketing/ui/dialog';
import { LoginFormModal } from './LoginFormModal';
import { SignupFormModal } from './SignupFormModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

/**
 * AuthModal - Modal dialog for authentication
 *
 * Features:
 * - Toggle between login and signup modes
 * - Email/password authentication
 * - Google OAuth sign-in
 * - Automatic redirect to dashboard after successful authentication
 * - Accessible with focus trap and ESC key support (via Radix Dialog)
 * - Backdrop overlay that dims the background
 *
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback to close the modal
 * @param defaultMode - Initial mode ('login' or 'signup'), defaults to 'login'
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // Redirect to dashboard when user successfully authenticates
  useEffect(() => {
    if (currentUser && isOpen) {
      // Close modal first
      onClose();
      // Then navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
        // Staging/Mobile Safari hard-redirect fallback to handle navigation flakiness
        const isStaging = import.meta.env.VITE_APP_ENVIRONMENT === 'staging';
        const ua = navigator.userAgent || '';
        const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
        if (isStaging && isSafari) {
          setTimeout(() => {
            if (!window.location.pathname.startsWith('/dashboard')) {
              window.location.assign('/dashboard');
            }
          }, 1000);
        }
      }, 100);
    }
  }, [currentUser, isOpen, navigate, onClose]);

  const handleSwitchToSignup = () => {
    setMode('signup');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        data-testid="auth-modal"
        className="p-0 gap-0 overflow-y-auto max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === 'login' ? 'Sign In' : 'Create Account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Sign in to your account to access the Prompt Library dashboard'
              : 'Create a new account to get started with Prompt Library'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 md:p-8">
          {mode === 'login' ? (
            <LoginFormModal onSwitchToSignup={handleSwitchToSignup} />
          ) : (
            <SignupFormModal onSwitchToLogin={handleSwitchToLogin} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
