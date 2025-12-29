import React, { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from '@/components/icons';
import { cn } from '../../lib/utils';

/**
 * Breadcrumbs Component
 *
 * Provides navigation context showing the user's current location in the app hierarchy.
 * Supports both manual and automatic route generation.
 *
 * Features:
 * - Manual breadcrumb items with custom labels and links
 * - Automatic route generation from current path
 * - Icon support for breadcrumb items
 * - Home icon for root navigation
 * - Accessible navigation with ARIA labels
 * - Keyboard navigation support
 * - Mobile-friendly responsive design
 * - Follows Ethos design system
 *
 * @example
 * ```tsx
 * // Manual breadcrumbs
 * <Breadcrumbs
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Prompts', href: '/prompts' },
 *     { label: 'Edit Prompt' }
 *   ]}
 * />
 *
 * // With home icon
 * <Breadcrumbs
 *   showHome
 *   items={[
 *     { label: 'Settings', href: '/settings' },
 *     { label: 'Profile' }
 *   ]}
 * />
 *
 * // With custom separator
 * <Breadcrumbs
 *   separator="/"
 *   items={[
 *     { label: 'Docs', href: '/docs' },
 *     { label: 'API' }
 *   ]}
 * />
 * ```
 */

/**
 * Breadcrumb Item Interface
 */
export interface BreadcrumbItem {
  /**
   * Display label for the breadcrumb
   */
  label: string;

  /**
   * Optional link href (if not provided, item is not clickable)
   */
  href?: string;

  /**
   * Optional icon component
   */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Breadcrumbs Props Interface
 */
export interface BreadcrumbsProps {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];

  /**
   * Show home icon as first item
   * @default false
   */
  showHome?: boolean;

  /**
   * Custom separator element
   * @default <ChevronRight />
   */
  separator?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * ARIA label for the navigation
   * @default 'Breadcrumb navigation'
   */
  'aria-label'?: string;

  /**
   * Test ID for testing
   */
  'data-testid'?: string;
}

/**
 * Breadcrumbs Component
 *
 * Navigation component showing the current location hierarchy.
 */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  (
    {
      items,
      showHome = false,
      separator,
      className,
      'aria-label': ariaLabel = 'Breadcrumb navigation',
      'data-testid': testId = 'breadcrumbs',
    },
    ref
  ) => {
    // Default separator
    const defaultSeparator = (
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
    );

    const separatorElement = separator || defaultSeparator;

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={cn('flex items-center gap-2 text-sm', className)}
        data-testid={testId}
      >
        <ol className="flex items-center gap-2 flex-wrap">
          {/* Home icon (optional) */}
          {showHome && (
            <>
              <li>
                <Link
                  to="/"
                  className={cn(
                    'inline-flex items-center text-ethos-gray hover:text-ethos-purple',
                    'transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2 rounded-md px-1'
                  )}
                  aria-label="Home"
                >
                  <Home className="w-4 h-4" />
                </Link>
              </li>
              {items.length > 0 && <li aria-hidden="true">{separatorElement}</li>}
            </>
          )}

          {/* Breadcrumb items */}
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const Icon = item.icon;

            return (
              <React.Fragment key={index}>
                <li className="flex items-center">
                  {item.href && !isLast ? (
                    // Clickable breadcrumb
                    <Link
                      to={item.href}
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        'text-ethos-gray hover:text-ethos-purple',
                        'transition-colors duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2 rounded-md px-1'
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    // Current page (not clickable)
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        'text-ethos-navy font-medium',
                        isLast && 'cursor-default'
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </span>
                  )}
                </li>

                {/* Separator (not after last item) */}
                {!isLast && <li aria-hidden="true">{separatorElement}</li>}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

/**
 * Hook to generate breadcrumbs automatically from current route
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const breadcrumbs = useAutoBreadcrumbs({
 *     '/dashboard': 'Dashboard',
 *     '/prompts': 'Prompts',
 *     '/prompts/new': 'New Prompt',
 *   });
 *
 *   return <Breadcrumbs items={breadcrumbs} />;
 * }
 * ```
 */
export function useAutoBreadcrumbs(routeLabels: Record<string, string>): BreadcrumbItem[] {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

    // Get label from routeLabels or capitalize segment
    const label =
      routeLabels[currentPath] ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}

/**
 * Utility function to create breadcrumb items
 *
 * @example
 * ```tsx
 * const items = createBreadcrumbs(
 *   ['Dashboard', '/dashboard'],
 *   ['Prompts', '/prompts'],
 *   ['Edit']
 * );
 * ```
 */
export function createBreadcrumbs(...items: Array<[string, string?] | string>): BreadcrumbItem[] {
  return items.map((item) => {
    if (Array.isArray(item)) {
      return { label: item[0], href: item[1] };
    }
    return { label: item };
  });
}

// Export default
export default Breadcrumbs;
