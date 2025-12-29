import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { navigateBackToCoreServices } from '@/utils/navigationUtils';

interface BackToServicesProps {
  className?: string;
  variant?: 'button' | 'link';
}

export const BackToServices: React.FC<BackToServicesProps> = ({
  className = '',
  variant = 'link'
}) => {
  const navigate = useNavigate();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateBackToCoreServices(navigate);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleBackClick}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ethos-purple hover:text-ethos-purple-dark transition-colors duration-200 bg-white border border-ethos-purple/20 rounded-lg hover:bg-ethos-purple/5 ${className}`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Our Services
      </button>
    );
  }

  return (
    <button
      onClick={handleBackClick}
      className={`inline-flex items-center gap-2 text-sm font-medium text-ethos-purple hover:text-ethos-purple-dark transition-colors duration-200 hover:underline ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Our Services
    </button>
  );
};
