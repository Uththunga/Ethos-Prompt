/**
 * useFieldTracking Hook
 * Provides field-level analytics tracking for form inputs
 * Tracks focus time, completion, and abandonment at the field level
 */

import { fieldTracker } from '@/services/formAnalytics';
import { useCallback, useRef } from 'react';

interface UseFieldTrackingOptions {
  stepNumber: number;
}

interface FieldTrackingHandlers {
  onFocus: (fieldName: string) => () => void;
  onBlur: (fieldName: string, getValue: () => string | boolean | any[]) => () => void;
  trackField: (fieldName: string) => {
    onFocus: () => void;
    onBlur: () => void;
  };
}

/**
 * Hook to track field-level interactions in form components
 *
 * Usage:
 * ```tsx
 * const { trackField } = useFieldTracking({ stepNumber: 1 });
 *
 * <Input
 *   {...trackField('companyName')}
 *   value={formData.companyName}
 *   onChange={...}
 * />
 * ```
 */
export function useFieldTracking({ stepNumber }: UseFieldTrackingOptions): FieldTrackingHandlers {
  // Track which field is currently being tracked
  const currentFieldRef = useRef<string | null>(null);
  const valueRef = useRef<() => string | boolean | any[]>(() => '');

  const handleFocus = useCallback((fieldName: string) => {
    return () => {
      currentFieldRef.current = fieldName;
      fieldTracker.start(stepNumber, fieldName);
    };
  }, [stepNumber]);

  const handleBlur = useCallback((fieldName: string, getValue: () => string | boolean | any[]) => {
    return () => {
      if (currentFieldRef.current === fieldName) {
        const value = getValue();
        const hasValue = Array.isArray(value)
          ? value.length > 0
          : typeof value === 'boolean'
          ? true // Booleans always count as "having a value"
          : !!value && value.toString().trim().length > 0;

        fieldTracker.stop(hasValue);
        currentFieldRef.current = null;
      }
    };
  }, []);

  /**
   * Convenience method to create handlers for controlled inputs
   * Note: For this to work correctly, you need to pass the getValue function
   * that returns the current field value
   */
  const trackField = useCallback((fieldName: string) => {
    return {
      onFocus: () => {
        currentFieldRef.current = fieldName;
        fieldTracker.start(stepNumber, fieldName);
      },
      onBlur: () => {
        if (currentFieldRef.current === fieldName) {
          // For simple usage, we can't know the value here
          // The component should use onFocus/onBlur directly for accurate tracking
          fieldTracker.stop(true); // Assume completed - use onBlur directly for accuracy
          currentFieldRef.current = null;
        }
      },
    };
  }, [stepNumber]);

  return {
    onFocus: handleFocus,
    onBlur: handleBlur,
    trackField,
  };
}

export default useFieldTracking;
