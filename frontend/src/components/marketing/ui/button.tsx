import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { a11yUtils, useButtonEnhancements } from "./button-utils";
import { buttonVariants } from "./button-variants";


/**
 * Available button variants for different visual styles and semantic meanings
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'cta' | 'ethos';

/**
 * Available button sizes for different use cases
 */
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

/**
 * Enhanced Button component props with accessibility and animation features
 *
 * @interface ButtonProps
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 * @extends VariantProps<typeof buttonVariants>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component using Radix Slot */
  asChild?: boolean;

  /** Visual variant of the button */
  variant?: ButtonVariant;

  /** Size variant of the button */
  size?: ButtonSize;

  // Enhanced accessibility props
  /** ID of element that describes the button */
  'aria-describedby'?: string;

  /** Whether the button controls an expanded element */
  'aria-expanded'?: boolean;

  /** Whether the button is in a pressed state */
  'aria-pressed'?: boolean;

  // Enhanced interaction props
  /** Current state of the button for visual feedback */
  'data-state'?: 'loading' | 'success' | 'error' | 'default';

  /** Test identifier for automated testing */
  'data-testid'?: string;

  // Animation control
  /** Disable all button animations */
  disableAnimations?: boolean;

  /** Respect user's reduced motion preferences */
  reducedMotion?: boolean;
}

/**
 * Enhanced Button component with advanced hover effects, accessibility features, and animation controls
 *
 * Features:
 * - Multiple visual variants (default, destructive, outline, secondary, ghost, link, cta)
 * - Size variants (sm, default, lg, icon)
 * - Advanced hover effects with lift animations and shadow enhancements
 * - Full WCAG 2.1 AA accessibility compliance
 * - Loading, success, and error states
 * - Reduced motion support
 * - Comprehensive keyboard navigation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button variant="default" size="lg">
 *   Save Changes
 * </Button>
 *
 * // With loading state
 * <Button data-state="loading" disabled>
 *   Processing...
 * </Button>
 *
 * // CTA variant with reduced motion
 * <Button variant="cta" reducedMotion>
 *   Get Started
 * </Button>
 * ```
 *
 * @param props - Button component props
 * @param ref - Forwarded ref to the button element
 * @returns Enhanced button component
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    disableAnimations = false,
    reducedMotion = false,
    'data-state': dataState = 'default',
    disabled = false,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Use enhanced button utilities
    const {
      shadowClasses,
      stateClasses,
      shouldDisableAnimations
    } = useButtonEnhancements({
      variant,
      size,
      disabled,
      loading: dataState === 'loading',
      reducedMotion: reducedMotion || disableAnimations
    });

    // Get ARIA attributes based on state
    const ariaAttributes = a11yUtils.getAriaAttributes(dataState);

    // State-specific classes
    const dataStateClasses = {
      loading: "button-loading",
      success: "button-success",
      error: "button-error",
      default: ""
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          "button-enhanced",
          shadowClasses,
          stateClasses,
          dataStateClasses[dataState],
          shouldDisableAnimations && "transition-none transform-none",
          className
        )}
        ref={ref}
        data-state={dataState}
        disabled={disabled || dataState === 'loading'}
        {...ariaAttributes}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
