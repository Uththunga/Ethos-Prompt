import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loading component for better perceived performance
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'text',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-100 border border-gray-200';

  const variantClasses = {
    text: 'rounded',
    rectangular: '',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

/**
 * Document card skeleton
 */
export const DocumentCardSkeleton: React.FC = () => (
  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton width="60%" height="1.25rem" className="mb-2" />
        <Skeleton width="40%" height="1rem" />
      </div>
    </div>

    <div className="mb-4">
      <Skeleton width="100%" height="1rem" className="mb-2" />
      <Skeleton width="80%" height="1rem" className="mb-2" />
      <Skeleton width="90%" height="1rem" />
    </div>

    <div className="flex items-center justify-between">
      <Skeleton width="30%" height="2rem" variant="rounded" />
      <div className="flex gap-2">
        <Skeleton width="2rem" height="2rem" variant="circular" />
        <Skeleton width="2rem" height="2rem" variant="circular" />
      </div>
    </div>
  </div>
);

/**
 * Prompt card skeleton
 */
export const PromptCardSkeleton: React.FC = () => (
  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton width="40%" height="1.25rem" />
      </div>
      <Skeleton width="20%" height="1.5rem" variant="rounded" />
    </div>

    <div className="mb-4">
      <Skeleton width="100%" height="1rem" className="mb-2" />
      <Skeleton width="85%" height="1rem" />
    </div>

    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton width="25%" height="1rem" />
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <Skeleton width="15%" height="1.5rem" variant="rounded" />
        <Skeleton width="20%" height="1.5rem" variant="rounded" />
        <Skeleton width="18%" height="1.5rem" variant="rounded" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton width="30%" height="1rem" />
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Skeleton width="4rem" height="2rem" variant="rounded" />
        <Skeleton width="2rem" height="2rem" variant="circular" />
      </div>
      <Skeleton width="2rem" height="2rem" variant="circular" />
    </div>
  </div>
);

/**
 * Table row skeleton
 */
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <Skeleton width="80%" height="1rem" />
      </td>
    ))}
  </tr>
);

/**
 * List skeleton with multiple items
 */
export const ListSkeleton: React.FC<{
  count?: number;
  itemComponent?: React.ComponentType;
}> = ({ count = 3, itemComponent: ItemComponent = DocumentCardSkeleton }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <ItemComponent key={index} />
    ))}
  </div>
);

/**
 * Grid skeleton
 */
export const GridSkeleton: React.FC<{
  count?: number;
  columns?: number;
  itemComponent?: React.ComponentType;
}> = ({ count = 6, columns = 3, itemComponent: ItemComponent = DocumentCardSkeleton }) => (
  <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-${columns}`}>
    {Array.from({ length: count }).map((_, index) => (
      <ItemComponent key={index} />
    ))}
  </div>
);

/**
 * Page skeleton for full page loading
 */
export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header skeleton */}
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <Skeleton width="8rem" height="2rem" />
          <div className="flex items-center gap-4">
            <Skeleton width="6rem" height="2rem" variant="rounded" />
            <Skeleton variant="circular" width={40} height={40} />
          </div>
        </div>
      </div>
    </div>

    {/* Main content skeleton */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Skeleton width="20rem" height="2.5rem" className="mb-4" />
        <Skeleton width="30rem" height="1.25rem" />
      </div>

      <GridSkeleton count={9} columns={3} />
    </div>
  </div>
);

/**
 * Chat message skeleton
 */
export const ChatMessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div
      className={`flex ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } items-start gap-2 max-w-xs lg:max-w-md`}
    >
      <Skeleton variant="circular" width={32} height={32} />
      <div
        className={`px-4 py-2 rounded-lg ${
          isUser ? 'bg-ethos-purple' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <Skeleton width="100%" height="1rem" />
        <Skeleton width="80%" height="1rem" />
        <Skeleton width="60%" height="1rem" />
      </div>
    </div>
  </div>
);

/**
 * Form skeleton
 */
export const FormSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6">
    <div>
      <Skeleton width="6rem" height="1rem" className="mb-2" />
      <Skeleton width="100%" height="2.5rem" variant="rounded" />
    </div>

    <div>
      <Skeleton width="8rem" height="1rem" className="mb-2" />
      <Skeleton width="100%" height="6rem" variant="rounded" />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Skeleton width="5rem" height="1rem" className="mb-2" />
        <Skeleton width="100%" height="2.5rem" variant="rounded" />
      </div>
      <div>
        <Skeleton width="4rem" height="1rem" className="mb-2" />
        <Skeleton width="100%" height="2.5rem" variant="rounded" />
      </div>
    </div>

    <div className="flex justify-end gap-3">
      <Skeleton width="5rem" height="2.5rem" variant="rounded" />
      <Skeleton width="6rem" height="2.5rem" variant="rounded" />
    </div>
  </div>
);
