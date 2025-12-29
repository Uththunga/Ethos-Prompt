/**
 * Button Enhancement Utilities
 *
 * Utility functions and classes for consistent button animations,
 * interactions, and accessibility features.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for merging classes (same as cn but specific to buttons)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Button Animation Presets
 * Pre-defined animation combinations for common button interactions
 */
export const buttonAnimations = {
  // Subtle lift for primary actions
  lift: "hover:-translate-y-0.5 hover:shadow-button-hover transition-all duration-200 ease-out",

  // Gentle scale for secondary actions
  scale: "hover:scale-[1.02] transition-transform duration-200 ease-out",

  // Premium effect for CTA buttons
  premium: "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-button-cta-hover transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",

  // Soft glow for ghost buttons
  glow: "hover:shadow-button-ghost hover:backdrop-blur-sm transition-all duration-200 ease-out",

  // Pulse animation for loading states
  pulse: "animate-button-pulse",

  // Bounce for success states
  bounce: "animate-button-bounce",

  // Glow animation for special emphasis
  glowAnimation: "animate-button-glow",
} as const;

/**
 * Button State Classes
 * Classes for different button states and interactions
 */
export const buttonStates = {
  // Base interactive states
  hover: "hover:brightness-110",
  active: "active:scale-[0.98] active:brightness-95",
  focus: "focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2",

  // Disabled state
  disabled: "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none disabled:brightness-75 disabled:saturate-50",

  // Loading state
  loading: "cursor-wait opacity-75 pointer-events-none",

  // Success state
  success: "bg-green-600 hover:bg-green-700 text-white",

  // Error state
  error: "bg-red-600 hover:bg-red-700 text-white",
} as const;

/**
 * Reduced Motion Utilities
 * Functions to handle motion preferences and accessibility
 */
export const motionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    return !!mql && !!mql.matches;
  },

  // Get motion-safe classes
  getMotionSafeClasses: (animationClasses: string): string => {
    if (motionUtils.prefersReducedMotion()) {
      return "transition-none transform-none";
    }
    return animationClasses;
  },

  // Reduced motion class variants
  reducedMotion: "motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animate-none",
} as const;

/**
 * Button Accessibility Utilities
 * Functions to enhance button accessibility
 */
export const a11yUtils = {
  // Generate ARIA attributes for button states
  getAriaAttributes: (state: 'default' | 'loading' | 'success' | 'error' | 'pressed') => {
    const baseAttrs = {
      role: 'button',
      tabIndex: 0,
    };

    switch (state) {
      case 'loading':
        return { ...baseAttrs, 'aria-busy': true, 'aria-disabled': true };
      case 'pressed':
        return { ...baseAttrs, 'aria-pressed': true };
      case 'success':
        return { ...baseAttrs, 'aria-label': 'Action completed successfully' };
      case 'error':
        return { ...baseAttrs, 'aria-label': 'Action failed' };
      default:
        return baseAttrs;
    }
  },

  // Ensure minimum touch target size
  touchTarget: "min-h-[44px] min-w-[44px]",

  // High contrast mode support
  highContrast: "contrast-more:ring-4 contrast-more:ring-offset-4",
} as const;

/**
 * Button Performance Utilities
 * Optimizations for smooth animations and interactions
 */
export const performanceUtils = {
  // GPU acceleration classes
  gpuAcceleration: "transform-gpu will-change-transform backface-hidden",

  // Optimized transition properties
  optimizedTransitions: "transition-[transform,box-shadow,filter,background-color,border-color]",

  // Mobile-optimized animations (lighter effects)
  mobileOptimized: "md:hover:-translate-y-0.5 hover:-translate-y-0 md:hover:scale-[1.02] hover:scale-100",

  // Touch device optimizations
  touchOptimized: "touch:hover:transform-none touch:active:scale-[0.98]",
} as const;

/**
 * Button Variant Helpers
 * Helper functions for working with button variants
 */
export const variantHelpers = {
  // Get shadow class for variant
  getShadowForVariant: (variant: string, size: string): string => {
    const shadowMap: Record<string, Record<string, string>> = {
      default: {
        sm: "shadow-button-sm",
        default: "shadow-button",
        lg: "shadow-button-lg",
        icon: "shadow-button",
      },
      cta: {
        sm: "shadow-button-cta",
        default: "shadow-button-cta",
        lg: "shadow-button-cta",
        icon: "shadow-button-cta",
      },
      outline: {
        sm: "shadow-button-outline",
        default: "shadow-button-outline",
        lg: "shadow-button-outline",
        icon: "shadow-button-outline",
      },
      destructive: {
        sm: "shadow-button-destructive",
        default: "shadow-button-destructive",
        lg: "shadow-button-destructive",
        icon: "shadow-button-destructive",
      },
      ghost: {
        sm: "shadow-button-ghost",
        default: "shadow-button-ghost",
        lg: "shadow-button-ghost",
        icon: "shadow-button-ghost",
      },
    };

    return shadowMap[variant]?.[size] || "shadow-button";
  },

  // Get hover animation for variant
  getHoverAnimationForVariant: (variant: string): string => {
    const animationMap: Record<string, string> = {
      default: buttonAnimations.lift,
      cta: buttonAnimations.premium,
      outline: buttonAnimations.lift,
      secondary: buttonAnimations.lift,
      ghost: buttonAnimations.glow,
      destructive: buttonAnimations.lift,
      link: "hover:underline-offset-2",
    };

    return animationMap[variant] || buttonAnimations.lift;
  },
} as const;

/**
 * Button Enhancement Hook
 * Custom hook for enhanced button functionality
 */
export const useButtonEnhancements = (props: {
  variant?: string;
  size?: string;
  disabled?: boolean;
  loading?: boolean;
  reducedMotion?: boolean;
}) => {
  const { variant = 'default', size = 'default', disabled, loading, reducedMotion } = props;

  // Determine if animations should be disabled
  const shouldDisableAnimations = reducedMotion || motionUtils.prefersReducedMotion() || disabled || loading;

  // Get appropriate classes
  const animationClasses = shouldDisableAnimations
    ? motionUtils.reducedMotion
    : variantHelpers.getHoverAnimationForVariant(variant);

  const shadowClasses = variantHelpers.getShadowForVariant(variant, size);

  const stateClasses = cn(
    performanceUtils.gpuAcceleration,
    performanceUtils.optimizedTransitions,
    a11yUtils.touchTarget,
    a11yUtils.highContrast,
    motionUtils.reducedMotion,
    disabled && buttonStates.disabled,
    loading && buttonStates.loading
  );

  return {
    animationClasses,
    shadowClasses,
    stateClasses,
    shouldDisableAnimations,
  };
};

export type ButtonAnimationType = keyof typeof buttonAnimations;
export type ButtonStateType = keyof typeof buttonStates;
