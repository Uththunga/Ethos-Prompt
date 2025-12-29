import * as React from 'react';

import { cn } from '@/lib/marketing-utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          'flex w-full rounded-2xl border bg-white px-4 py-3 text-body-small font-normal transition-all duration-200',
          // Height standardization
          'min-h-[120px] resize-y',
          // Border and colors - ethos design system
          'border-ethos-gray-light text-ethos-gray-light placeholder:text-ethos-gray-light',
          // Focus states - ethos purple with enhanced accessibility
          'focus:ring-2 focus:ring-ethos-purple focus:border-transparent focus:outline-none',
          // Hover states
          'hover:border-ethos-gray',
          // Disabled states
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ethos-light',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
