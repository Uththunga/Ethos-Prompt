import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Search } from '@/components/icons';
type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * EmptyState Component
 *
 * Enhanced empty state component with icon/illustration support and multiple action buttons.
 * Provides clear messaging and calls-to-action when no content is available.
 *
 * Features:
 * - Icon or illustration support
 * - Title and description
 * - Multiple action buttons (primary and secondary)
 * - Variant options (default, compact)
 * - Customizable styling
 * - Accessible with proper ARIA attributes
 * - Follows Ethos design system
 *
 * @example
 * ```tsx
 * // Basic usage with icon
 * <EmptyState
 *   icon={FileText}
 *   title="No prompts yet"
 *   description="Get started by creating your first prompt."
 *   actions={<Button>Create Prompt</Button>}
 * />
 *
 * // With multiple actions
 * <EmptyState
 *   icon={Upload}
 *   title="No documents uploaded"
 *   description="Upload documents to get started with your knowledge base."
 *   actions={
 *     <>
 *       <Button>Upload Document</Button>
 *       <Button variant="outline">Import from URL</Button>
 *     </>
 *   }
 * />
 *
 * // Compact variant
 * <EmptyState
 *   variant="compact"
 *   icon={Search}
 *   title="No results found"
 *   description="Try adjusting your search criteria."
 * />
 *
 * // With illustration
 * <EmptyState
 *   illustration="/images/empty-state.svg"
 *   title="Welcome to Prompts"
 *   description="Create and manage your AI prompts in one place."
 *   actions={<Button>Get Started</Button>}
 * />
 * ```
 */

/**
 * EmptyState Props Interface
 */
export interface EmptyStateProps {
  /**
   * Optional icon component (Lucide icon)
   */
  icon?: IconComponent;

  /**
   * Optional illustration image URL
   */
  illustration?: string;

  /**
   * Title text (required)
   */
  title: string;

  /**
   * Description text (required)
   */
  description: string;

  /**
   * Optional action buttons
   */
  actions?: React.ReactNode;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'compact';

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
 * EmptyState Component
 *
 * Displays a friendly empty state with icon, title, description, and actions.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon: Icon,
      illustration,
      title,
      description,
      actions,
      variant = 'default',
      className,
      'data-testid': testId = 'empty-state',
    },
    ref
  ) => {
    // Variant-specific sizing
    const isCompact = variant === 'compact';

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          isCompact ? 'py-8 px-4' : 'py-12 px-6 lg:py-16',
          className
        )}
        role="status"
        aria-live="polite"
        data-testid={testId}
      >
        {/* Icon or Illustration */}
        {illustration ? (
          <div className={cn('mb-6', isCompact ? 'w-32 h-32' : 'w-48 h-48 lg:w-64 lg:h-64')}>
            <img
              src={illustration}
              alt=""
              className="w-full h-full object-contain"
              aria-hidden="true"
            />
          </div>
        ) : Icon ? (
          <div
            className={cn(
              'rounded-full bg-ethos-purple/10 flex items-center justify-center mb-6',
              'transition-colors duration-300',
              isCompact ? 'w-16 h-16' : 'w-20 h-20 lg:w-24 lg:h-24'
            )}
            aria-hidden="true"
          >
            <Icon
              className={cn(
                'text-ethos-purple',
                isCompact ? 'w-8 h-8' : 'w-10 h-10 lg:w-12 lg:h-12'
              )}
            />
          </div>
        ) : null}

        {/* Title */}
        <h3
          className={cn(
            'font-semibold text-ethos-navy mb-2',
            isCompact ? 'text-h4' : 'text-h3 lg:text-h2'
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={cn(
            'text-ethos-gray max-w-md mx-auto',
            isCompact ? 'text-body-sm mb-4' : 'text-body mb-6'
          )}
        >
          {description}
        </p>

        {/* Actions */}
        {actions && (
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">{actions}</div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

/**
 * EmptyStateCard - Empty state wrapped in a card
 *
 * @example
 * ```tsx
 * <EmptyStateCard
 *   icon={FileText}
 *   title="No items"
 *   description="Get started by adding your first item."
 *   actions={<Button>Add Item</Button>}
 * />
 * ```
 */
export const EmptyStateCard = forwardRef<HTMLDivElement, EmptyStateProps>((props, ref) => {
  return (
    <div
      ref={ref}
      className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', props.className)}
    >
      <EmptyState {...props} />
    </div>
  );
});

EmptyStateCard.displayName = 'EmptyStateCard';

/**
 * EmptySearchResults - Specialized empty state for search results
 *
 * @example
 * ```tsx
 * <EmptySearchResults
 *   searchQuery="react hooks"
 *   onClearSearch={() => setQuery('')}
 * />
 * ```
 */
export const EmptySearchResults: React.FC<{
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}> = ({ searchQuery, onClearSearch, className }) => {
  return (
    <EmptyState
      variant="compact"
      icon={Search}
      title="No results found"
      description={
        searchQuery
          ? `No results found for "${searchQuery}". Try adjusting your search criteria.`
          : 'No results found. Try adjusting your search criteria.'
      }
      actions={
        onClearSearch && (
          <button
            onClick={onClearSearch}
            className={cn(
              'text-ethos-purple hover:text-ethos-purple-light',
              'font-medium transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2 rounded-md px-2 py-1'
            )}
          >
            Clear search
          </button>
        )
      }
      className={className}
    />
  );
};

EmptySearchResults.displayName = 'EmptySearchResults';

/**
 * EmptyStateWithLink - Empty state with a text link action
 *
 * @example
 * ```tsx
 * <EmptyStateWithLink
 *   icon={FileText}
 *   title="No prompts"
 *   description="Create your first prompt to get started."
 *   linkText="Create Prompt"
 *   linkHref="/prompts/new"
 * />
 * ```
 */
export const EmptyStateWithLink: React.FC<
  Omit<EmptyStateProps, 'actions'> & {
    linkText: string;
    linkHref: string;
    onLinkClick?: () => void;
  }
> = ({ linkText, linkHref, onLinkClick, ...props }) => {
  return (
    <EmptyState
      {...props}
      actions={
        <a
          href={linkHref}
          onClick={onLinkClick}
          className={cn(
            'inline-flex items-center gap-2',
            'text-ethos-purple hover:text-ethos-purple-light',
            'font-medium transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2 rounded-md px-2 py-1'
          )}
        >
          {linkText}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      }
    />
  );
};

EmptyStateWithLink.displayName = 'EmptyStateWithLink';

// Export default
export default EmptyState;
