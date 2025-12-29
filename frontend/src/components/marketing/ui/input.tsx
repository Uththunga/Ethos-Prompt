import * as React from 'react';

import { cn } from '@/lib/marketing-utils';
/**
 * Input — Ethos-styled text input component.
 *
 * Accessibility: 4.5:1 contrast minimum, clear focus ring using Ethos purple.
 *
 * Example:
 * <Input placeholder="Your email" aria-label="Email" />
 */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex w-full rounded-2xl border bg-white px-4 py-3 font-normal transition-all duration-200',
          // Font size - 16px minimum to prevent iOS zoom
          'text-base',
          // Height standardization - larger on mobile for better touch
          'h-12 sm:h-12',
          // Border and colors - improved contrast
          'border-gray-300 text-ethos-navy placeholder:text-gray-500',
          // Focus states - ethos purple with enhanced accessibility
          'focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple focus:outline-none',
          // Hover states
          'hover:border-gray-400',
          // Disabled states
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
          // File input specific styles
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ethos-navy',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
