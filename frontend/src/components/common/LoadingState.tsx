import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * LoadingState Component
 *
 * Enhanced loading state component with shimmer animation and multiple layout options.
 * Provides skeleton loaders that match the actual content structure.
 *
 * Features:
 * - Shimmer animation for smooth loading effect
 * - Multiple layout variants (cards, list, table)
 * - Configurable skeleton count
 * - Grid and stack layout options
 * - Matches actual content structure
 * - Accessible with proper ARIA attributes
 * - Follows Ethos design system
 *
 * @example
 * ```tsx
 * // Card grid loading
 * <LoadingState variant="cards" count={6} layout="grid" />
 *
 * // List loading
 * <LoadingState variant="list" count={5} layout="stack" />
 *
 * // Table loading
 * <LoadingState variant="table" count={10} />
 *
 * // Custom styling
 * <LoadingState
 *   variant="cards"
 *   count={4}
 *   layout="grid"
 *   className="gap-8"
 * />
 * ```
 */

/**
 * LoadingState Props Interface
 */
export interface LoadingStateProps {
  /**
   * Layout variant to match content type
   * @default 'cards'
   */
  variant?: 'cards' | 'list' | 'table' | 'stats';

  /**
   * Number of skeleton items to show
   * @default 3
   */
  count?: number;

  /**
   * Layout arrangement
   * @default 'grid'
   */
  layout?: 'grid' | 'stack';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Test ID for testing
   */
  'data-testid'?: string;
}

/**
 * Shimmer skeleton base component
 */
const ShimmerSkeleton: React.FC<{
  className?: string;
  'aria-label'?: string;
}> = ({ className, 'aria-label': ariaLabel }) => (
  <div
    className={cn(
      'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
      'bg-[length:200%_100%] animate-shimmer rounded',
      className
    )}
    aria-label={ariaLabel || 'Loading...'}
    role="status"
  />
);

/**
 * Card skeleton component
 */
const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <ShimmerSkeleton className="h-6 w-3/4 mb-2" aria-label="Loading title" />
        <ShimmerSkeleton className="h-4 w-1/2" aria-label="Loading subtitle" />
      </div>
      <ShimmerSkeleton className="h-8 w-20 rounded-full" aria-label="Loading badge" />
    </div>

    {/* Content */}
    <div className="mb-4">
      <ShimmerSkeleton className="h-4 w-full mb-2" />
      <ShimmerSkeleton className="h-4 w-5/6" />
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <ShimmerSkeleton className="h-4 w-24" />
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-8 w-8 rounded" />
        <ShimmerSkeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  </div>
);

/**
 * List item skeleton component
 */
const ListItemSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-4">
    {/* Icon/Avatar */}
    <ShimmerSkeleton className="h-12 w-12 rounded-lg flex-shrink-0" aria-label="Loading icon" />

    {/* Content */}
    <div className="flex-1">
      <ShimmerSkeleton className="h-5 w-2/3 mb-2" aria-label="Loading title" />
      <ShimmerSkeleton className="h-4 w-1/2" aria-label="Loading description" />
    </div>

    {/* Actions */}
    <div className="flex gap-2 flex-shrink-0">
      <ShimmerSkeleton className="h-9 w-20 rounded" />
      <ShimmerSkeleton className="h-9 w-9 rounded" />
    </div>
  </div>
);

/**
 * Table row skeleton component
 */
const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-200">
    <ShimmerSkeleton className="h-4 w-8" />
    <ShimmerSkeleton className="h-4 w-1/4" />
    <ShimmerSkeleton className="h-4 w-1/6" />
    <ShimmerSkeleton className="h-4 w-1/5" />
    <ShimmerSkeleton className="h-4 w-24" />
    <ShimmerSkeleton className="h-8 w-20 rounded ml-auto" />
  </div>
);

/**
 * Stat card skeleton component
 */
const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
    <div className="flex items-center gap-4">
      {/* Icon */}
      <ShimmerSkeleton className="h-12 w-12 rounded-lg flex-shrink-0" aria-label="Loading icon" />

      {/* Content */}
      <div className="flex-1">
        <ShimmerSkeleton className="h-4 w-24 mb-2" aria-label="Loading label" />
        <ShimmerSkeleton className="h-8 w-32" aria-label="Loading value" />
      </div>
    </div>

    {/* Trend indicator */}
    <div className="mt-4 pt-4 border-t border-gray-200">
      <ShimmerSkeleton className="h-4 w-28" />
    </div>
  </div>
);

/**
 * LoadingState Component
 *
 * Displays skeleton loaders with shimmer animation matching content structure.
 */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  (
    {
      variant = 'cards',
      count = 3,
      layout = 'grid',
      className,
      'data-testid': testId = 'loading-state',
    },
    ref
  ) => {
    // Determine skeleton component based on variant
    const SkeletonComponent = {
      cards: CardSkeleton,
      list: ListItemSkeleton,
      table: TableRowSkeleton,
      stats: StatCardSkeleton,
    }[variant];

    // Layout classes
    const layoutClasses = {
      grid: {
        cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
        stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
        list: '',
        table: '',
      },
      stack: {
        cards: '',
        stats: '',
        list: '',
        table: '',
      },
    };

    const containerClass = layoutClasses[layout][variant];

    return (
      <div
        ref={ref}
        className={cn(containerClass, className)}
        data-testid={testId}
        role="status"
        aria-live="polite"
        aria-label="Loading content"
      >
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonComponent key={index} />
        ))}
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';

/**
 * PageLoadingState - Full page loading state
 *
 * @example
 * ```tsx
 * {isLoading ? <PageLoadingState /> : <PageContent />}
 * ```
 */
export const PageLoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading...', className }) => (
  <div
    className={cn('flex flex-col items-center justify-center min-h-[400px] py-12', className)}
    role="status"
    aria-live="polite"
  >
    {/* Brain Loading GIF */}
    <div className="w-24 h-24 mb-4 bg-white rounded-lg p-2 flex items-center justify-center">
      <img
        src="/assets/marketing/animations/brainloading.gif"
        alt="Loading..."
        className="w-full h-full object-contain"
      />
    </div>

    {/* Message */}
    <p className="text-body text-ethos-gray">{message}</p>
  </div>
);

PageLoadingState.displayName = 'PageLoadingState';

/**
 * InlineLoadingState - Inline loading indicator
 *
 * @example
 * ```tsx
 * <InlineLoadingState message="Saving..." />
 * ```
 */
export const InlineLoadingState: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ message, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <div className={cn('bg-white rounded p-1 flex items-center justify-center', sizeClasses[size])}>
        <img
          src="/assets/marketing/animations/brainloading.gif"
          alt="Loading..."
          className="w-full h-full object-contain"
        />
      </div>
      {message && <span className="text-body-sm text-ethos-gray">{message}</span>}
    </div>
  );
};

InlineLoadingState.displayName = 'InlineLoadingState';

// Export default
export default LoadingState;
