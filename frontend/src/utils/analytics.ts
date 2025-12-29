/**
 * Analytics and User Tracking System
 * Comprehensive analytics setup for user behavior tracking and engagement metrics
 */

// Analytics Event Types
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  userId?: string;
  timestamp?: number;
}

interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: string;
  lastActive?: string;
  [key: string]: string | number | boolean | undefined;
}

interface PageViewEvent {
  page: string;
  title?: string;
  url?: string;
  referrer?: string;
  userId?: string;
}

// Analytics Service Class
class AnalyticsService {
  private userId: string | null = null;
  private sessionId: string;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeAnalytics() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Analytics skipped: not in browser environment');
        return;
      }

      // Use Firebase Analytics instead of gtag for better integration
      const { analytics } = await import('../config/firebase');

      if (analytics) {
        console.log('Firebase Analytics initialized successfully');
        this.isInitialized = true;

        // Process any queued events
        this.processEventQueue();
      } else {
        console.warn('Firebase Analytics not available');
        this.isInitialized = true; // Still mark as initialized to prevent blocking
      }

      // Initialize Mixpanel (if available)
      if (typeof mixpanel !== 'undefined') {
        mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
          debug: import.meta.env.DEV,
          track_pageview: true,
          persistence: 'localStorage',
        });
      }

      this.isInitialized = true;
      
      // Process queued events
      this.processEventQueue();
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  private processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent(event.name, event.properties, false);
      }
    }
  }

  // Set user identity
  setUserId(userId: string, properties?: UserProperties) {
    this.userId = userId;

    // Firebase Analytics
    this.trackWithFirebaseAnalytics('login', { user_id: userId, ...properties });

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.identify(userId);
      if (properties) {
        mixpanel.people.set(properties);
      }
    }

    // Custom analytics
    this.sendToCustomAnalytics('identify', { userId, properties });
  }

  // Track page views
  trackPageView(event: PageViewEvent) {
    const pageData = {
      page: event.page,
      title: event.title || document.title,
      url: event.url || window.location.href,
      referrer: event.referrer || document.referrer,
      userId: event.userId || this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    // Firebase Analytics
    this.trackWithFirebaseAnalytics('page_view', {
      page_title: pageData.title,
      page_location: pageData.url,
      page_referrer: pageData.referrer,
    });

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track('Page View', pageData);
    }

    // Custom analytics
    this.sendToCustomAnalytics('page_view', pageData);
  }

  // Track custom events
  trackEvent(eventName: string, properties: Record<string, string | number | boolean> = {}, queue: boolean = true) {
    const eventData = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    if (!this.isInitialized && queue) {
      this.eventQueue.push(eventData);
      return;
    }

    // Firebase Analytics
    this.trackWithFirebaseAnalytics(eventName, properties);

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(eventName, eventData.properties);
    }

    // Custom analytics
    this.sendToCustomAnalytics('event', eventData);
  }

  // Track user properties
  setUserProperties(properties: Record<string, string | number | boolean>) {
    // Firebase Analytics
    this.trackWithFirebaseAnalytics('user_properties', properties);

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.people.set(properties);
    }

    // Custom analytics
    this.sendToCustomAnalytics('user_properties', { userId: this.userId, properties });
  }

  // Firebase Analytics helper method
  private async trackWithFirebaseAnalytics(eventName: string, parameters: Record<string, string | number | boolean> = {}) {
    try {
      const { analytics } = await import('../config/firebase');
      if (analytics) {
        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, eventName, parameters);
      }
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('Firebase Analytics tracking failed:', error);
    }
  }

  // Process queued events
  private processEventQueue() {
    const queuedEvents = [...this.eventQueue];
    this.eventQueue = [];

    queuedEvents.forEach(event => {
      this.trackEvent(event.name, event.properties, false);
    });
  }

  // Send to custom analytics backend
  private async sendToCustomAnalytics(type: string, data: Record<string, unknown>) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  // Get session information
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized,
    };
  }
}

// Create global analytics instance
export const analytics = new AnalyticsService();

// Specific tracking functions for the RAG Prompt Library

// User Journey Tracking
export const trackUserSignup = (method: 'email' | 'google', userId: string) => {
  analytics.trackEvent('User Signup', {
    method,
    userId,
    timestamp: Date.now(),
  });
};

export const trackUserLogin = (method: 'email' | 'google', userId: string) => {
  analytics.trackEvent('User Login', {
    method,
    userId,
    timestamp: Date.now(),
  });
};

export const trackOnboardingStep = (step: string, completed: boolean, userId?: string) => {
  analytics.trackEvent('Onboarding Step', {
    step,
    completed,
    userId,
    timestamp: Date.now(),
  });
};

// Prompt Management Tracking
export const trackPromptCreated = (promptId: string, category: string, hasVariables: boolean) => {
  analytics.trackEvent('Prompt Created', {
    promptId,
    category,
    hasVariables,
    timestamp: Date.now(),
  });
};

export const trackPromptExecuted = (promptId: string, model: string, success: boolean, duration?: number) => {
  analytics.trackEvent('Prompt Executed', {
    promptId,
    model,
    success,
    duration,
    timestamp: Date.now(),
  });
};

export const trackPromptShared = (promptId: string, shareType: 'public' | 'link' | 'team') => {
  analytics.trackEvent('Prompt Shared', {
    promptId,
    shareType,
    timestamp: Date.now(),
  });
};

// Document Management Tracking
export const trackDocumentUploaded = (documentId: string, fileType: string, fileSize: number, success: boolean) => {
  analytics.trackEvent('Document Uploaded', {
    documentId,
    fileType,
    fileSize,
    success,
    timestamp: Date.now(),
  });
};

export const trackDocumentProcessed = (documentId: string, processingTime: number, chunksCreated: number) => {
  analytics.trackEvent('Document Processed', {
    documentId,
    processingTime,
    chunksCreated,
    timestamp: Date.now(),
  });
};

export const trackRAGQuery = (documentId: string, queryLength: number, resultsFound: number, relevanceScore?: number) => {
  analytics.trackEvent('RAG Query', {
    documentId,
    queryLength,
    resultsFound,
    relevanceScore,
    timestamp: Date.now(),
  });
};

// Feature Usage Tracking
export const trackFeatureUsed = (feature: string, action: string, metadata?: Record<string, string | number | boolean>) => {
  analytics.trackEvent('Feature Used', {
    feature,
    action,
    ...metadata,
    timestamp: Date.now(),
  });
};

export const trackSearchPerformed = (query: string, resultsCount: number, filterUsed?: string) => {
  analytics.trackEvent('Search Performed', {
    queryLength: query.length,
    resultsCount,
    filterUsed,
    timestamp: Date.now(),
  });
};

export const trackSettingsChanged = (setting: string, oldValue: string | number | boolean, newValue: string | number | boolean) => {
  analytics.trackEvent('Settings Changed', {
    setting,
    oldValue,
    newValue,
    timestamp: Date.now(),
  });
};

// Engagement Tracking
export const trackTimeSpent = (page: string, timeSpent: number) => {
  analytics.trackEvent('Time Spent', {
    page,
    timeSpent,
    timestamp: Date.now(),
  });
};

export const trackHelpUsed = (helpType: 'tooltip' | 'guide' | 'support' | 'community', context: string) => {
  analytics.trackEvent('Help Used', {
    helpType,
    context,
    timestamp: Date.now(),
  });
};

export const trackFeedbackProvided = (feedbackType: 'rating' | 'bug' | 'feature' | 'general', rating?: number) => {
  analytics.trackEvent('Feedback Provided', {
    feedbackType,
    rating,
    timestamp: Date.now(),
  });
};

// Error Tracking
export const trackError = (errorType: string, errorMessage: string, context?: string) => {
  analytics.trackEvent('Error Occurred', {
    errorType,
    errorMessage,
    context,
    url: window.location.href,
    timestamp: Date.now(),
  });
};

// Conversion Tracking
export const trackTrialStarted = (userId: string, plan: string) => {
  analytics.trackEvent('Trial Started', {
    userId,
    plan,
    timestamp: Date.now(),
  });
};

export const trackSubscriptionUpgrade = (userId: string, fromPlan: string, toPlan: string) => {
  analytics.trackEvent('Subscription Upgrade', {
    userId,
    fromPlan,
    toPlan,
    timestamp: Date.now(),
  });
};

// React Hook for Analytics
export const useAnalytics = () => {
  const trackPageView = (page: string) => {
    analytics.trackPageView({ page });
  };

  const trackUserAction = (action: string, properties?: Record<string, string | number | boolean>) => {
    analytics.trackEvent(action, properties);
  };

  const setUser = (userId: string, properties?: UserProperties) => {
    analytics.setUserId(userId, properties);
  };

  const updateUserProperties = (properties: Record<string, string | number | boolean>) => {
    analytics.setUserProperties(properties);
  };

  return {
    trackPageView,
    trackUserAction,
    setUser,
    updateUserProperties,
    sessionInfo: analytics.getSessionInfo(),
  };
};

// Page view tracking for React Router
export const usePageTracking = () => {
  React.useEffect(() => {
    const handleRouteChange = () => {
      analytics.trackPageView({
        page: window.location.pathname,
        url: window.location.href,
      });
    };

    // Track initial page load
    handleRouteChange();

    // Listen for route changes (if using React Router)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
};

export default analytics;
