
/**
 * Analytics Utilities
 * Helper functions for tracking user events and behavior
 */

import { trackEvent, setUserProps } from '../lib/firebase';

export class AnalyticsTracker {
  // User events
  static trackUserRegistration(method = 'email') {
    trackEvent('sign_up', {
      method: method,
      timestamp: new Date().toISOString()
    });
  }

  static trackUserLogin(method = 'email') {
    trackEvent('login', {
      method: method,
      timestamp: new Date().toISOString()
    });
  }

  static trackUserOnboarding(step, completed = false) {
    trackEvent('user_onboarding', {
      step: step,
      completed: completed,
      timestamp: new Date().toISOString()
    });
  }

  // Feature usage events
  static trackPromptGeneration(promptType, success = true) {
    trackEvent('prompt_generated', {
      prompt_type: promptType,
      success: success,
      timestamp: new Date().toISOString()
    });
  }

  static trackDocumentUpload(fileType, fileSize, success = true) {
    trackEvent('document_uploaded', {
      file_type: fileType,
      file_size: fileSize,
      success: success,
      timestamp: new Date().toISOString()
    });
  }

  static trackSearchQuery(queryType, resultsCount) {
    trackEvent('search_performed', {
      query_type: queryType,
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    });
  }

  // Error tracking
  static trackError(errorType, errorMessage, context = {}) {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: JSON.stringify(context),
      timestamp: new Date().toISOString()
    });
  }

  // Performance events
  static trackPerformance(metric, value, context = {}) {
    trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      context: JSON.stringify(context),
      timestamp: new Date().toISOString()
    });
  }

  // User properties
  static setUserProperties(userId, userType = 'free', features = []) {
    setUserProps({
      user_id: userId,
      user_type: userType,
      features_enabled: features.join(','),
      last_active: new Date().toISOString()
    });
  }

  // Custom events
  static trackCustomEvent(eventName, parameters = {}) {
    trackEvent(eventName, {
      ...parameters,
      timestamp: new Date().toISOString()
    });
  }
}

export default AnalyticsTracker;
