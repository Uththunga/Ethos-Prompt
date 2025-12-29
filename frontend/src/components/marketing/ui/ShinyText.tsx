import { cn } from '@/lib/utils';
import type { ComponentProps, ReactNode } from 'react';
import React, { useMemo } from 'react';

interface ShinyTextProps extends ComponentProps<'span'> {
  children: ReactNode;
  speedInMs?: number;
  pauseOnHover?: boolean;
  respectReducedMotion?: boolean;
}

const ShinyText = ({
  children,
  speedInMs = 5000,
  pauseOnHover = false,
  respectReducedMotion = true,
  className,
  ...props
}: ShinyTextProps) => {
  // Memoize animation styles to prevent unnecessary recalculations
  const animationStyle = useMemo(
    () => ({
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animation: `shiny-text-animation ${speedInMs}ms linear infinite`,
      ...(pauseOnHover && {
        animationPlayState: 'running',
      }),
    }),
    [speedInMs, pauseOnHover]
  );

  return (
    <span
      className={cn(
        'bg-clip-text text-transparent bg-gradient-to-r',
        // Add animation class that will be defined in CSS
        'shiny-text',
        // Respect reduced motion preference
        respectReducedMotion && 'motion-reduce:animate-none',
        // Pause on hover if enabled
        pauseOnHover && 'hover:animation-paused',
        className
      )}
      style={animationStyle}
      {...props}
    >
      {children}
    </span>
  );
};

export default ShinyText;
