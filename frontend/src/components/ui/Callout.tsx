/**
 * Callout Component
 *
 * Displays styled callout/admonition boxes for Note, Tip, Warning, and Danger messages.
 * Used in help articles and documentation to highlight important information.
 */

import React from 'react';
import {
  InformationCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';

export type CalloutType = 'note' | 'tip' | 'warning' | 'danger';

interface CalloutProps {
  /** Type of callout (note, tip, warning, danger) */
  type: CalloutType;
  /** Optional title for the callout */
  title?: string;
  /** Callout content */
  children: React.ReactNode;
  /** Optional class name for styling */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Get icon component for callout type
 */
const getCalloutIcon = (type: CalloutType) => {
  switch (type) {
    case 'note':
      return InformationCircleIcon;
    case 'tip':
      return LightBulbIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    case 'danger':
      return XCircleIcon;
  }
};

/**
 * Get default title for callout type
 */
const getCalloutTitle = (type: CalloutType): string => {
  switch (type) {
    case 'note':
      return 'Note';
    case 'tip':
      return 'Tip';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'Danger';
  }
};

/**
 * Get styling classes for callout type
 * Preserves semantic colors for accessibility
 */
const getCalloutStyles = (type: CalloutType) => {
  switch (type) {
    case 'note':
      return {
        container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-900 dark:text-blue-100',
        content: 'text-blue-800 dark:text-blue-200',
      };
    case 'tip':
      return {
        container: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-900 dark:text-green-100',
        content: 'text-green-800 dark:text-green-200',
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-500',
        title: 'text-yellow-900 dark:text-yellow-100',
        content: 'text-yellow-800 dark:text-yellow-200',
      };
    case 'danger':
      return {
        container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-900 dark:text-red-100',
        content: 'text-red-800 dark:text-red-200',
      };
  }
};

/**
 * Callout component for displaying admonitions
 */
export const Callout: React.FC<CalloutProps> = ({
  type,
  title,
  children,
  className,
  'data-testid': testId = 'callout',
}) => {
  const Icon = getCalloutIcon(type);
  const styles = getCalloutStyles(type);
  const displayTitle = title || getCalloutTitle(type);

  return (
    <div
      className={cn(
        'my-4 rounded-lg border-l-4 p-4',
        styles.container,
        className
      )}
      role="note"
      aria-label={`${type} callout`}
      data-testid={testId}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={cn('w-5 h-5', styles.icon)} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h5 className={cn('text-sm font-semibold mb-1', styles.title)}>
            {displayTitle}
          </h5>

          {/* Body */}
          <div className={cn('text-sm leading-relaxed', styles.content)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Callout;

