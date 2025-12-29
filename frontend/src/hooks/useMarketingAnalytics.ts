import { useCallback, useEffect } from 'react';

// Analytics event types
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, string | number | boolean>;
}

// Service-specific event tracking
export interface ServiceEvent extends AnalyticsEvent {
  service: string;
  page_section?: string;
  user_journey_stage?: 'awareness' | 'consideration' | 'decision' | 'action';
}

// Conversion funnel stages
export type ConversionStage =
  | 'page_view'
  | 'hero_engagement'
  | 'problem_section_view'
  | 'solution_section_view'
  | 'trust_signals_view'
  | 'testimonials_view'
  | 'roi_calculator_start'
  | 'roi_calculator_complete'
  | 'pricing_view'
  | 'faq_interaction'
  | 'cta_click'
  | 'email_capture'
  | 'phone_call'
  | 'form_submission';

// Enhanced analytics hook
export const useAnalytics = () => {
  // Initialize analytics
  useEffect(() => {
    // Google Analytics 4 initialization
    if (typeof window !== 'undefined' && !window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => {
        // Mirror GA snippet semantics: push the args array as a single item
        window.dataLayer.push(args);
      };
      window.gtag('js', new Date());
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, []);

  // Track generic events
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters
      });
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }, []);

  // Track service-specific events
  const trackServiceEvent = useCallback((event: ServiceEvent) => {
    trackEvent({
      ...event,
      custom_parameters: {
        ...event.custom_parameters,
        service: event.service,
        page_section: event.page_section,
        user_journey_stage: event.user_journey_stage
      }
    });
  }, [trackEvent]);

  // Track conversion funnel progression
  const trackConversionStage = useCallback((
    stage: ConversionStage,
    service: string,
    additionalData?: Record<string, string | number | boolean>
  ) => {
    trackServiceEvent({
      action: 'conversion_funnel_progression',
      category: 'Conversion Funnel',
      label: stage,
      service,
      user_journey_stage: getJourneyStage(stage),
      custom_parameters: {
        funnel_stage: stage,
        timestamp: Date.now(),
        ...additionalData
      }
    });
  }, [trackServiceEvent]);

  // Track scroll depth
  const trackScrollDepth = useCallback((depth: number, service: string) => {
    trackServiceEvent({
      action: 'scroll_depth',
      category: 'User Engagement',
      label: `${depth}%`,
      value: depth,
      service,
      custom_parameters: {
        scroll_depth: depth,
        page_height: document.body.scrollHeight,
        viewport_height: window.innerHeight
      }
    });
  }, [trackServiceEvent]);

  // Track time on page
  const trackTimeOnPage = useCallback((timeSpent: number, service: string) => {
    trackServiceEvent({
      action: 'time_on_page',
      category: 'User Engagement',
      value: timeSpent,
      service,
      custom_parameters: {
        time_spent_seconds: timeSpent,
        engagement_level: getEngagementLevel(timeSpent)
      }
    });
  }, [trackServiceEvent]);

  // Track CTA interactions
  const trackCTAClick = useCallback((
    ctaText: string,
    ctaLocation: string,
    service: string,
    ctaType: 'primary' | 'secondary' | 'exit_intent' | 'sticky_mobile' = 'primary'
  ) => {
    trackServiceEvent({
      action: 'cta_click',
      category: 'CTA Interaction',
      label: ctaText,
      service,
      page_section: ctaLocation,
      user_journey_stage: 'action',
      custom_parameters: {
        cta_text: ctaText,
        cta_location: ctaLocation,
        cta_type: ctaType
      }
    });
  }, [trackServiceEvent]);

  // Track form interactions
  const trackFormInteraction = useCallback((
    formType: string,
    action: 'start' | 'complete' | 'abandon',
    service: string,
    formData?: Record<string, string | number | boolean>
  ) => {
    trackServiceEvent({
      action: `form_${action}`,
      category: 'Form Interaction',
      label: formType,
      service,
      user_journey_stage: action === 'complete' ? 'action' : 'consideration',
      custom_parameters: {
        form_type: formType,
        form_action: action,
        ...formData
      }
    });
  }, [trackServiceEvent]);

  // Track email capture
  const trackEmailCapture = useCallback((
    source: string,
    service: string,
    leadMagnet?: string,
    contactId?: string
  ) => {
    trackServiceEvent({
      action: 'email_capture',
      category: 'Lead Generation',
      label: source,
      service,
      user_journey_stage: 'action',
      custom_parameters: {
        capture_source: source,
        lead_magnet: leadMagnet,
        conversion_value: 50, // Estimated lead value
        ...(contactId ? { contact_id: contactId } : {}),
      }
    });
  }, [trackServiceEvent]);

  // Track ROI calculator usage
  const trackROICalculator = useCallback((
    action: 'start' | 'complete' | 'email_gate',
    service: string,
    calculatedValue?: number
  ) => {
    trackServiceEvent({
      action: `roi_calculator_${action}`,
      category: 'ROI Calculator',
      label: service,
      value: calculatedValue,
      service,
      user_journey_stage: action === 'start' ? 'consideration' : 'decision',
      custom_parameters: {
        calculator_action: action,
        calculated_roi: calculatedValue,
        high_intent_lead: action === 'email_gate'
      }
    });
  }, [trackServiceEvent]);

  // Track exit intent
  const trackExitIntent = useCallback((
    triggered: boolean,
    service: string,
    timeOnPage: number
  ) => {
    trackServiceEvent({
      action: 'exit_intent_triggered',
      category: 'Exit Intent',
      label: service,
      service,
      user_journey_stage: 'decision',
      custom_parameters: {
        exit_intent_triggered: triggered,
        time_before_exit: timeOnPage,
        bounce_prevention_opportunity: true
      }
    });
  }, [trackServiceEvent]);

  return {
    trackEvent,
    trackServiceEvent,
    trackConversionStage,
    trackScrollDepth,
    trackTimeOnPage,
    trackCTAClick,
    trackFormInteraction,
    trackEmailCapture,
    trackROICalculator,
    trackExitIntent
  };
};

// Helper functions
function getJourneyStage(stage: ConversionStage): ServiceEvent['user_journey_stage'] {
  switch (stage) {
    case 'page_view':
    case 'hero_engagement':
    case 'problem_section_view':
      return 'awareness';
    case 'solution_section_view':
    case 'trust_signals_view':
    case 'testimonials_view':
    case 'roi_calculator_start':
      return 'consideration';
    case 'roi_calculator_complete':
    case 'pricing_view':
    case 'faq_interaction':
      return 'decision';
    case 'cta_click':
    case 'email_capture':
    case 'phone_call':
    case 'form_submission':
      return 'action';
    default:
      return 'consideration';
  }
}

function getEngagementLevel(timeSpent: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (timeSpent < 30) return 'low';
  if (timeSpent < 120) return 'medium';
  if (timeSpent < 300) return 'high';
  return 'very_high';
}

// Scroll depth tracking hook
export const useScrollDepthTracking = (service: string) => {
  const { trackScrollDepth } = useAnalytics();

  useEffect(() => {
    const trackedDepths = new Set<number>();
    const thresholds = [25, 50, 75, 90, 100];

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      thresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !trackedDepths.has(threshold)) {
          trackedDepths.add(threshold);
          trackScrollDepth(threshold, service);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [service, trackScrollDepth]);
};

// Time on page tracking hook
export const useTimeOnPageTracking = (service: string) => {
  const { trackTimeOnPage } = useAnalytics();

  useEffect(() => {
    const startTime = Date.now();
    const intervals = [30, 60, 120, 300, 600]; // 30s, 1m, 2m, 5m, 10m
    const trackedIntervals = new Set<number>();

    const trackInterval = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      intervals.forEach(interval => {
        if (timeSpent >= interval && !trackedIntervals.has(interval)) {
          trackedIntervals.add(interval);
          trackTimeOnPage(interval, service);
        }
      });
    };

    const intervalId = setInterval(trackInterval, 5000); // Check every 5 seconds

    return () => {
      clearInterval(intervalId);
      const finalTimeSpent = Math.round((Date.now() - startTime) / 1000);
      if (finalTimeSpent >= 10) { // Only track if spent more than 10 seconds
        trackTimeOnPage(finalTimeSpent, service);
      }
    };
  }, [service, trackTimeOnPage]);
};

// Global analytics types for window object
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
