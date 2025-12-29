/**
 * Enhanced Button Type Definitions
 *
 * Comprehensive TypeScript definitions for the enhanced button system
 * with improved type safety and IntelliSense support.
 */

import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";

/**
 * Button Variant Types
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'cta';

/**
 * Button Size Types
 */
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

/**
 * Button State Types
 */
export type ButtonState = 'default' | 'loading' | 'success' | 'error' | 'pressed';

/**
 * Button Animation Types
 */
export type ButtonAnimation = 'lift' | 'scale' | 'premium' | 'glow' | 'pulse' | 'bounce' | 'glowAnimation' | 'none';

/**
 * Enhanced Button Props Interface
 */
export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {

  // Core button props
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;

  // Enhanced accessibility props
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;

  // Enhanced interaction props
  'data-state'?: ButtonState;
  'data-testid'?: string;
  'data-analytics'?: string;

  // Animation and motion control
  disableAnimations?: boolean;
  reducedMotion?: boolean;
  animation?: ButtonAnimation;

  // Loading and async states
  loading?: boolean;
  loadingText?: string;

  // Success and error states
  success?: boolean;
  successText?: string;
  error?: boolean;
  errorText?: string;

  // Enhanced styling
  gradient?: boolean;
  glow?: boolean;
  shadow?: 'none' | 'sm' | 'default' | 'lg' | 'xl';

  // Callback enhancements
  onHover?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;

  // Analytics and tracking
  trackClick?: boolean;
  analyticsEvent?: string;
  analyticsData?: Record<string, unknown>;
}

/**
 * Button Configuration Types
 */
export interface ButtonConfig {
  variant: ButtonVariant;
  size: ButtonSize;
  animation: ButtonAnimation;
  shadow: string;
  accessibility: {
    minTouchTarget: number;
    focusRing: boolean;
    highContrast: boolean;
  };
}

/**
 * Button Theme Configuration
 */
export interface ButtonTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    destructive: string;
    success: string;
    warning: string;
  };
  shadows: {
    sm: string;
    default: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      ease: string;
      bounce: string;
      smooth: string;
    };
  };
}

/**
 * Button Analytics Event Types
 */
export interface ButtonAnalyticsEvent {
  action: 'click' | 'hover' | 'focus' | 'blur';
  variant: ButtonVariant;
  size: ButtonSize;
  state: ButtonState;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Button Performance Metrics
 */
export interface ButtonPerformanceMetrics {
  renderTime: number;
  interactionDelay: number;
  animationFrames: number;
  memoryUsage: number;
}

/**
 * Button Accessibility Audit Result
 */
export interface ButtonA11yAudit {
  contrastRatio: number;
  touchTargetSize: { width: number; height: number };
  focusIndicator: boolean;
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  screenReaderCompatible: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

/**
 * Button Test Configuration
 */
export interface ButtonTestConfig {
  variants: ButtonVariant[];
  sizes: ButtonSize[];
  states: ButtonState[];
  interactions: ('click' | 'hover' | 'focus' | 'keyboard')[];
  accessibility: boolean;
  performance: boolean;
  crossBrowser: boolean;
}

/**
 * Button Enhancement Options
 */
export interface ButtonEnhancementOptions {
  enableAnimations: boolean;
  enableShadows: boolean;
  enableGradients: boolean;
  enableHoverEffects: boolean;
  enableFocusEffects: boolean;
  enableReducedMotion: boolean;
  enableHighContrast: boolean;
  enableTouchOptimization: boolean;
}

/**
 * Button Context Type
 */
export interface ButtonContextType {
  theme: ButtonTheme;
  config: ButtonConfig;
  enhancements: ButtonEnhancementOptions;
  analytics: {
    track: (event: ButtonAnalyticsEvent) => void;
    enabled: boolean;
  };
}

/**
 * Button Hook Return Type
 */
export interface UseButtonEnhancementsReturn {
  animationClasses: string;
  shadowClasses: string;
  stateClasses: string;
  shouldDisableAnimations: boolean;
  ariaAttributes: Record<string, string | boolean | number>;
  performanceMetrics: ButtonPerformanceMetrics;
}

/**
 * Button Validation Result
 */
export interface ButtonValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  accessibility: ButtonA11yAudit;
  performance: ButtonPerformanceMetrics;
}

/**
 * Button Migration Guide
 */
export interface ButtonMigrationGuide {
  from: {
    variant?: string;
    size?: string;
    className?: string;
  };
  to: {
    variant: ButtonVariant;
    size: ButtonSize;
    className?: string;
  };
  breaking: boolean;
  automated: boolean;
  instructions: string[];
}

/**
 * Utility Types
 */
export type ButtonVariantConfig = Record<ButtonVariant, {
  baseClasses: string;
  hoverClasses: string;
  activeClasses: string;
  focusClasses: string;
  disabledClasses: string;
}>;

export type ButtonSizeConfig = Record<ButtonSize, {
  height: string;
  padding: string;
  fontSize: string;
  minWidth?: string;
}>;

/**
 * Component Ref Types
 */
export type ButtonRef = React.ForwardedRef<HTMLButtonElement>;
export type ButtonElement = HTMLButtonElement;

/**
 * Event Handler Types
 */
export type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type ButtonHoverHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type ButtonFocusHandler = (event: React.FocusEvent<HTMLButtonElement>) => void;

/**
 * Export all types for easy importing
 */
export type {
    VariantProps
};

/**
 * Type Guards
 */
export const isButtonVariant = (value: string): value is ButtonVariant => {
  return ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'cta'].includes(value);
};

export const isButtonSize = (value: string): value is ButtonSize => {
  return ['sm', 'default', 'lg', 'icon'].includes(value);
};

export const isButtonState = (value: string): value is ButtonState => {
  return ['default', 'loading', 'success', 'error', 'pressed'].includes(value);
};

/**
 * Default Configurations
 */
export const defaultButtonConfig: ButtonConfig = {
  variant: 'default',
  size: 'default',
  animation: 'lift',
  shadow: 'shadow-button',
  accessibility: {
    minTouchTarget: 44,
    focusRing: true,
    highContrast: true,
  },
};

export const defaultButtonTheme: ButtonTheme = {
  colors: {
    primary: '#7409C5',
    secondary: '#6b7280',
    accent: '#8235F4',
    destructive: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  shadows: {
    sm: '0 2px 4px -1px rgba(116, 9, 197, 0.15)',
    default: '0 4px 6px -1px rgba(116, 9, 197, 0.2)',
    lg: '0 6px 12px -2px rgba(116, 9, 197, 0.25)',
    xl: '0 12px 24px -4px rgba(116, 9, 197, 0.4)',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },
};
