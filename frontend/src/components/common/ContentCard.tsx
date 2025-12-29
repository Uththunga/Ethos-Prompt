import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * ContentCard Component
 *
 * A unified card component with consistent hover effects and styling patterns.
 * Designed to standardize card interactions across the application.
 *
 * Features:
 * - Multiple variants (default, interactive, stat, minimal)
 * - Configurable padding options
 * - Consistent hover effects (scale, translate, shadow, border)
 * - Accessibility support (keyboard navigation, ARIA attributes)
 * - Responsive design
 * - Follows Ethos design system
 *
 * @example
 * ```tsx
 * // Interactive card with hover effects
 * <ContentCard variant="interactive" padding="md" onClick={handleClick}>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </ContentCard>
 *
 * // Stat card for dashboard metrics
 * <ContentCard variant="stat" padding="lg">
 *   <div className="flex items-center">
 *     <Icon className="h-6 w-6" />
 *     <div>
 *       <p className="text-sm">Total Users</p>
 *       <p className="text-2xl font-bold">1,234</p>
 *     </div>
 *   </div>
 * </ContentCard>
 *
 * // Minimal card without hover effects
 * <ContentCard variant="minimal" padding="sm">
 *   <p>Simple content</p>
 * </ContentCard>
 * ```
 */

/**
 * Card variant styles using class-variance-authority
 *
 * Variants:
 * - default: Basic card with no hover effects
 * - interactive: Full hover effects (scale, translate, shadow) for clickable cards
 * - stat: Enhanced hover for dashboard stat cards (more scale)
 * - minimal: Border and shadow only, no hover effects
 */
const contentCardVariants = cva(
  // Base styles - applied to all variants
  'bg-white rounded-lg border transition-all duration-300 ease-out overflow-hidden',
  {
    variants: {
      variant: {
        // Default: Basic card with subtle hover
        default: cn('border-gray-200 shadow-sm', 'hover:shadow-md'),

        // Interactive: Full hover effects for clickable cards
        interactive: cn(
          'border-gray-200 shadow-sm cursor-pointer group',
          'hover:shadow-lg hover:shadow-ethos-purple/5 hover:border-ethos-purple/20',
          'hover:scale-[1.02] hover:-translate-y-1',
          'active:scale-[0.99] active:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2'
        ),

        // Stat: Enhanced hover for dashboard metrics
        stat: cn(
          'border-gray-200 shadow-sm',
          'hover:shadow-lg hover:shadow-ethos-purple/5 hover:border-ethos-purple/20',
          'hover:scale-[1.03] hover:-translate-y-1',
          'transition-all duration-300 ease-out'
        ),

        // Minimal: Border and shadow only
        minimal: cn(
          'border-ethos-gray-light/20 shadow-sm',
          'hover:shadow-md transition-shadow duration-300'
        ),
      },

      padding: {
        none: 'p-0',
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-6',
        lg: 'p-4 sm:p-6 lg:p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

/**
 * ContentCard Props Interface
 */
export interface ContentCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contentCardVariants> {
  /**
   * Visual variant of the card
   * @default 'default'
   */
  variant?: 'default' | 'interactive' | 'stat' | 'minimal';

  /**
   * Padding size
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Optional click handler (makes card interactive)
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string;

  /**
   * ARIA role
   */
  role?: string;

  /**
   * Test ID for testing
   */
  'data-testid'?: string;
}

/**
 * ContentCard Component
 *
 * Unified card component with consistent styling and hover effects.
 * Supports multiple variants for different use cases.
 */
export const ContentCard = forwardRef<HTMLDivElement, ContentCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      children,
      onClick,
      className,
      role,
      'aria-label': ariaLabel,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Determine if card should be interactive
    const isInteractive = variant === 'interactive' || !!onClick;

    // Keyboard event handler for accessibility
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(contentCardVariants({ variant, padding }), className)}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={role || (isInteractive ? 'button' : undefined)}
        aria-label={ariaLabel}
        tabIndex={isInteractive ? 0 : undefined}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ContentCard.displayName = 'ContentCard';

/**
 * ContentCardHeader - Header section with consistent spacing
 *
 * @example
 * ```tsx
 * <ContentCard>
 *   <ContentCardHeader>
 *     <h3 className="text-h3">Card Title</h3>
 *     <p className="text-body-sm">Card description</p>
 *   </ContentCardHeader>
 * </ContentCard>
 * ```
 */
export const ContentCardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      {children}
    </div>
  )
);

ContentCardHeader.displayName = 'ContentCardHeader';

/**
 * ContentCardContent - Main content section
 *
 * @example
 * ```tsx
 * <ContentCard>
 *   <ContentCardContent>
 *     <p>Main content goes here</p>
 *   </ContentCardContent>
 * </ContentCard>
 * ```
 */
export const ContentCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1', className)} {...props}>
      {children}
    </div>
  )
);

ContentCardContent.displayName = 'ContentCardContent';

/**
 * ContentCardFooter - Footer section with consistent spacing
 *
 * @example
 * ```tsx
 * <ContentCard>
 *   <ContentCardFooter>
 *     <Button>Action</Button>
 *   </ContentCardFooter>
 * </ContentCard>
 * ```
 */
export const ContentCardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 border-t border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  )
);

ContentCardFooter.displayName = 'ContentCardFooter';

// Export all components
export default ContentCard;
