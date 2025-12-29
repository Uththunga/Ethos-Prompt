import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-testid'?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  'data-testid': dataTestId
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-white z-50 ${className}`}>
      <img
        src="/assets/marketing/animations/brainloading.gif"
        alt="Loading..."
        className={`${sizeClasses[size]} object-contain`}
        data-testid={dataTestId}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};
