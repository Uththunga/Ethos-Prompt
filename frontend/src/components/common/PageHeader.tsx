import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

/**
 * PageHeader Component
 *
 * Standardized page header with title, description, breadcrumbs, and action buttons.
 * Provides consistent layout and styling across all pages.
 *
 * Features:
 * - Title and description support
 * - Integrated breadcrumb navigation
 * - Action button area (right-aligned)
 * - Optional gradient background
 * - Responsive layout (stacks on mobile)
 * - Follows Ethos design system
 * - Accessible with proper heading hierarchy
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PageHeader
 *   title="Prompts"
 *   description="Manage your AI prompts"
 * />
 *
 * // With breadcrumbs
 * <PageHeader
 *   title="Edit Prompt"
 *   description="Update your prompt details"
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Prompts', href: '/prompts' },
 *     { label: 'Edit' }
 *   ]}
 * />
 *
 * // With actions and gradient
 * <PageHeader
 *   title="Documents"
 *   description="Upload and manage your documents"
 *   variant="gradient"
 *   actions={
 *     <>
 *       <Button variant="outline">Import</Button>
 *       <Button>Upload Document</Button>
 *     </>
 *   }
 * />
 * ```
 */

/**
 * PageHeader Props Interface
 */
export interface PageHeaderProps {
  /**
   * Page title (required)
   */
  title: string;

  /**
   * Optional page description
   */
  description?: string;

  /**
   * Optional breadcrumb items
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Optional action buttons (right-aligned)
   */
  actions?: React.ReactNode;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'gradient';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show home icon in breadcrumbs
   * @default false
   */
  showHomeBreadcrumb?: boolean;

  /**
   * Test ID for testing
   */
  'data-testid'?: string;
}

/**
 * PageHeader Component
 *
 * Standardized header for all pages with consistent layout and styling.
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      breadcrumbs,
      actions,
      variant = 'default',
      className,
      showHomeBreadcrumb = false,
      'data-testid': testId = 'page-header',
    },
    ref
  ) => {
    // Variant styles
    const variantStyles = {
      default: 'bg-ethos-offwhite border-b border-gray-200',
      gradient:
        'bg-gradient-to-r from-ethos-purple/5 to-purple-50 rounded-lg border border-ethos-purple/10',
    };

    return (
      <div
        ref={ref}
        className={cn('w-full', variant === 'gradient' ? 'mb-6 lg:mb-8' : 'mb-6', className)}
        data-testid={testId}
      >
        <div
          className={cn(
            variantStyles[variant],
            variant === 'gradient' ? 'p-4 sm:p-6 lg:p-8' : 'py-4 sm:py-6'
          )}
        >
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-3 sm:mb-4 overflow-x-auto">
              <Breadcrumbs items={breadcrumbs} showHome={showHomeBreadcrumb} />
            </div>
          )}

          {/* Header Content */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-h1 font-bold text-ethos-navy mb-1.5 sm:mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-sm sm:text-body text-ethos-gray max-w-3xl">{description}</p>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{actions}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

/**
 * PageHeaderSkeleton - Loading state for PageHeader
 *
 * @example
 * ```tsx
 * {isLoading ? <PageHeaderSkeleton /> : <PageHeader title="..." />}
 * ```
 */
export const PageHeaderSkeleton: React.FC<{
  variant?: 'default' | 'gradient';
  showBreadcrumbs?: boolean;
  showActions?: boolean;
  className?: string;
}> = ({ variant = 'default', showBreadcrumbs = false, showActions = false, className }) => {
  const variantStyles = {
    default: 'bg-ethos-offwhite border-b border-gray-200',
    gradient:
      'bg-gradient-to-r from-ethos-purple/5 to-purple-50 rounded-lg border border-ethos-purple/10',
  };

  return (
    <div className={cn('w-full', variant === 'gradient' ? 'mb-6 lg:mb-8' : 'mb-6', className)}>
      <div
        className={cn(
          variantStyles[variant],
          variant === 'gradient' ? 'p-6 lg:p-8' : 'py-6',
          'animate-pulse'
        )}
      >
        {/* Breadcrumbs skeleton */}
        {showBreadcrumbs && (
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        )}

        {/* Header content skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
            {/* Description skeleton */}
            <div className="h-4 w-96 max-w-full bg-gray-200 rounded"></div>
          </div>

          {/* Actions skeleton */}
          {showActions && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PageHeaderSkeleton.displayName = 'PageHeaderSkeleton';

/**
 * Compact PageHeader variant for secondary pages
 *
 * @example
 * ```tsx
 * <CompactPageHeader
 *   title="Settings"
 *   breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
 * />
 * ```
 */
export const CompactPageHeader = forwardRef<HTMLDivElement, Omit<PageHeaderProps, 'variant'>>(
  (props, ref) => {
    return (
      <div ref={ref} className={cn('mb-4', props.className)}>
        {/* Breadcrumbs */}
        {props.breadcrumbs && props.breadcrumbs.length > 0 && (
          <div className="mb-3">
            <Breadcrumbs items={props.breadcrumbs} showHome={props.showHomeBreadcrumb} />
          </div>
        )}

        {/* Compact header */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-h2 font-bold text-ethos-navy">{props.title}</h1>
            {props.description && (
              <p className="text-body-sm text-ethos-gray mt-1">{props.description}</p>
            )}
          </div>

          {props.actions && <div className="flex items-center gap-3 ml-4">{props.actions}</div>}
        </div>
      </div>
    );
  }
);

CompactPageHeader.displayName = 'CompactPageHeader';

// Export default
export default PageHeader;
