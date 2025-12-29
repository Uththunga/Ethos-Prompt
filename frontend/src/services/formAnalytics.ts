/**
 * Form Analytics Tracking
 * Tracks user interactions with inline chat forms for GA4 and custom analytics
 */

// Analytics event names
export const ANALYTICS_EVENTS = {
  // ROI Calculator events
  ROI_CALCULATOR_OPENED: 'roi_calculator_opened',
  ROI_CALCULATOR_STEP1_COMPLETED: 'roi_calculator_step1_completed',
  ROI_CALCULATOR_STEP2_COMPLETED: 'roi_calculator_step2_completed',
  ROI_CALCULATION_PERFORMED: 'roi_calculation_performed',
  ROI_SCHEDULE_CONSULTATION_CLICKED: 'roi_schedule_consultation_clicked',
  ROI_CALCULATOR_CLOSED: 'roi_calculator_closed',

  // Consultation Form events
  CONSULTATION_FORM_OPENED: 'consultation_form_opened',
  CONSULTATION_FORM_SUBMITTED: 'consultation_form_submitted',
  CONSULTATION_FORM_CLOSED: 'consultation_form_closed',
  CONSULTATION_VALIDATION_ERROR: 'consultation_validation_error',

  // GAP-007: Quotation Form events
  QUOTATION_MODAL_OPENED: 'quotation_modal_opened',
  QUOTATION_STEP_COMPLETED: 'quotation_step_completed',
  QUOTATION_STEP_ABANDONED: 'quotation_step_abandoned',
  QUOTATION_SUBMITTED: 'quotation_submitted',
  QUOTATION_VALIDATION_ERROR: 'quotation_validation_error',

  // Phase 3: Field-level tracking events
  FIELD_FOCUSED: 'field_focused',
  FIELD_ABANDONED: 'field_abandoned',
  FIELD_COMPLETED: 'field_completed',

  // Form interaction events
  FORM_BUTTON_CLICKED: 'form_button_clicked',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// Analytics event parameters
export interface AnalyticsEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track analytics event
 * Sends event to Google Analytics 4 and custom analytics backend
 */
export function trackFormEvent(
  eventName: AnalyticsEventName,
  params?: AnalyticsEventParams
): void {
  try {
    // Send to Google Analytics 4 (gtag)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: 'Chat Forms',
        ...params,
      });
    }

    // Send to custom analytics backend (if configured)
    if (typeof window !== 'undefined' && (window as any).customAnalytics) {
      (window as any).customAnalytics.track(eventName, params);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, params);
    }
  } catch (error) {
    // Don't let analytics errors break the app
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track ROI Calculator events
 */
export const roiAnalytics = {
  opened: (source: 'button' | 'agent' | 'auto') => {
    trackFormEvent(ANALYTICS_EVENTS.ROI_CALCULATOR_OPENED, {
      event_label: source,
    });
  },

  step1Completed: (teamSize: number, monthlyInquiries: number) => {
    trackFormEvent(ANALYTICS_EVENTS.ROI_CALCULATOR_STEP1_COMPLETED, {
      team_size: teamSize,
      monthly_inquiries: monthlyInquiries,
    });
  },

  step2Completed: (avgResponseTime: number, hourlyCost: number) => {
    trackFormEvent(ANALYTICS_EVENTS.ROI_CALCULATOR_STEP2_COMPLETED, {
      avg_response_time: avgResponseTime,
      hourly_cost: hourlyCost,
    });
  },

  calculated: (annualSavings: number, monthlyTime: number) => {
    trackFormEvent(ANALYTICS_EVENTS.ROI_CALCULATION_PERFORMED, {
      value: Math.round(annualSavings),
      monthly_time_savings: monthlyTime,
    });
  },

  scheduleClicked: () => {
    trackFormEvent(ANALYTICS_EVENTS.ROI_SCHEDULE_CONSULTATION_CLICKED);
  },

  closed: (stage: 'step1' | 'step2' | 'results') => {
    trackFormEvent(ANALYTICS_EVENTS.ROI_CALCULATOR_CLOSED, {
      event_label: stage,
    });
  },
};

/**
 * GAP-007: Track Quotation Form events
 */
export const quotationAnalytics = {
  opened: (serviceContext: string, serviceName: string) => {
    trackFormEvent(ANALYTICS_EVENTS.QUOTATION_MODAL_OPENED, {
      event_category: 'Quotation Forms',
      service_context: serviceContext,
      service_name: serviceName,
    });
  },

  stepCompleted: (stepNumber: number, stepName: string) => {
    trackFormEvent(ANALYTICS_EVENTS.QUOTATION_STEP_COMPLETED, {
      event_category: 'Quotation Forms',
      step_number: stepNumber,
      step_name: stepName,
    });
  },

  abandoned: (stepNumber: number, stepName: string) => {
    trackFormEvent(ANALYTICS_EVENTS.QUOTATION_STEP_ABANDONED, {
      event_category: 'Quotation Forms',
      step_number: stepNumber,
      step_name: stepName,
    });
  },

  submitted: (referenceNumber: string, serviceContext: string) => {
    trackFormEvent(ANALYTICS_EVENTS.QUOTATION_SUBMITTED, {
      event_category: 'Quotation Forms',
      reference_number: referenceNumber,
      service_context: serviceContext,
    });
  },

  validationError: (stepNumber: number, field: string) => {
    trackFormEvent(ANALYTICS_EVENTS.QUOTATION_VALIDATION_ERROR, {
      event_category: 'Quotation Forms',
      step_number: stepNumber,
      field_name: field,
    });
  },
};

/**
 * Track Consultation Form events
 */
export const consultationAnalytics = {
  opened: (source: 'button' | 'agent' | 'roi_calculator') => {
    trackFormEvent(ANALYTICS_EVENTS.CONSULTATION_FORM_OPENED, {
      event_label: source,
    });
  },

  submitted: (contactPreference: string, hasPrefillData: boolean) => {
    trackFormEvent(ANALYTICS_EVENTS.CONSULTATION_FORM_SUBMITTED, {
      contact_preference: contactPreference,
      has_prefill: hasPrefillData,
    });
  },

  validationError: (field: string) => {
    trackFormEvent(ANALYTICS_EVENTS.CONSULTATION_VALIDATION_ERROR, {
      event_label: field,
    });
  },

  closed: (wasSubmitted: boolean) => {
    trackFormEvent(ANALYTICS_EVENTS.CONSULTATION_FORM_CLOSED, {
      was_submitted: wasSubmitted,
    });
  },
};

/**
 * Calculate conversion metrics
 * Use this to track conversion funnel
 */
export function getConversionMetrics(): {
  roi_calculator_conversion: number;
  consultation_conversion: number;
} {
  // This would integrate with your analytics backend
  // For now, return placeholder values
  return {
    roi_calculator_conversion: 0,
    consultation_conversion: 0,
  };
}

// =============================================================================
// Phase 3: Field-Level Analytics (Task 3.2)
// =============================================================================

/**
 * Track field-level interactions for abandonment analysis
 * Helps identify which fields are causing users to drop off
 */
export const fieldAnalytics = {
  // Track when a field gains focus
  focused: (stepNumber: number, fieldName: string) => {
    trackFormEvent(ANALYTICS_EVENTS.FIELD_FOCUSED, {
      event_category: 'Field Interactions',
      step_number: stepNumber,
      field_name: fieldName,
      timestamp: Date.now(),
    });
  },

  // Track when user leaves a field without completing it (has focus but left empty)
  abandoned: (stepNumber: number, fieldName: string, timeSpentMs: number) => {
    trackFormEvent(ANALYTICS_EVENTS.FIELD_ABANDONED, {
      event_category: 'Field Interactions',
      step_number: stepNumber,
      field_name: fieldName,
      time_spent_ms: timeSpentMs,
      time_spent_seconds: Math.round(timeSpentMs / 1000),
    });
  },

  // Track when a field is successfully completed
  completed: (stepNumber: number, fieldName: string, timeSpentMs: number) => {
    trackFormEvent(ANALYTICS_EVENTS.FIELD_COMPLETED, {
      event_category: 'Field Interactions',
      step_number: stepNumber,
      field_name: fieldName,
      time_spent_ms: timeSpentMs,
      time_spent_seconds: Math.round(timeSpentMs / 1000),
    });
  },
};

/**
 * Field tracking state manager (for use in form components)
 * Call startTracking on focus, stopTracking on blur
 */
let activeFieldTracking: {
  fieldName: string;
  stepNumber: number;
  startTime: number;
} | null = null;

export const fieldTracker = {
  start: (stepNumber: number, fieldName: string) => {
    activeFieldTracking = {
      fieldName,
      stepNumber,
      startTime: Date.now(),
    };
    fieldAnalytics.focused(stepNumber, fieldName);
  },

  stop: (hasValue: boolean) => {
    if (!activeFieldTracking) return;

    const timeSpent = Date.now() - activeFieldTracking.startTime;

    if (hasValue) {
      fieldAnalytics.completed(
        activeFieldTracking.stepNumber,
        activeFieldTracking.fieldName,
        timeSpent
      );
    } else if (timeSpent > 1000) {
      // Only track abandonment if user spent more than 1 second
      fieldAnalytics.abandoned(
        activeFieldTracking.stepNumber,
        activeFieldTracking.fieldName,
        timeSpent
      );
    }

    activeFieldTracking = null;
  },

  // Get current active field (for debugging)
  getActive: () => activeFieldTracking,
};
