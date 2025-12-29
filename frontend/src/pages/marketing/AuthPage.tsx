import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthModal } from '@/components/auth/AuthModal';

/**
 * AuthPage: Dedicated route to display the AuthModal deterministically for E2E.
 * - Always opens the auth modal on mount
 * - Optional redirect param will be used after successful auth
 * - Provides visual feedback while modal loads
 */
export default function AuthPage() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleClose = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // No history, go to home
      navigate('/');
    }
  };

  // Debug logging for staging
  useEffect(() => {
    if (import.meta.env.VITE_APP_ENVIRONMENT === 'staging') {
      console.log('🔐 AuthPage mounted - Modal should be visible');
      console.log('Modal isOpen:', isOpen);
    }
  }, [isOpen]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white relative">
      {/* Visual indicator that auth page is loaded */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center opacity-10">
          <h1 className="text-6xl font-bold text-ethos-navy">EthosPrompt</h1>
          <p className="text-xl text-ethos-gray mt-2">Authentication</p>
        </div>
      </div>

      {/* Auth Modal - rendered with high z-index to ensure visibility */}
      <div className="relative z-50 w-full">
        <AuthModal isOpen={isOpen} onClose={handleClose} defaultMode="login" />
      </div>
    </div>
  );
}
