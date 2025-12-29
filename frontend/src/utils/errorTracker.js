
/**
 * Advanced Error Tracker
 * Comprehensive error tracking with categorization and context
 */

import CrashlyticsTracker from './crashlytics';

export class ErrorTracker {
  static sessionId = this.generateSessionId();
  static errorQueue = [];
  static isOnline = navigator.onLine;

  static generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Track different types of errors
  static trackApiError(error, endpoint, method = 'GET', statusCode = null) {
    const errorData = {
      type: 'api_error',
      message: error.message,
      endpoint: endpoint,
      method: method,
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logError(errorData);
    CrashlyticsTracker.logError(error, errorData);
  }

  static trackUIError(error, component, action = null) {
    const errorData = {
      type: 'ui_error',
      message: error.message,
      component: component,
      action: action,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      stack: error.stack
    };

    this.logError(errorData);
    CrashlyticsTracker.logError(error, errorData);
  }

  static trackAuthError(error, authAction, userId = null) {
    const errorData = {
      type: 'auth_error',
      message: error.message,
      authAction: authAction,
      userId: userId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logError(errorData);
    CrashlyticsTracker.logError(error, errorData);
  }

  static trackDataError(error, operation, dataType = null) {
    const errorData = {
      type: 'data_error',
      message: error.message,
      operation: operation,
      dataType: dataType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logError(errorData);
    CrashlyticsTracker.logError(error, errorData);
  }

  static trackNetworkError(error, url, method = 'GET') {
    const errorData = {
      type: 'network_error',
      message: error.message,
      url: url,
      method: method,
      isOnline: this.isOnline,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.logError(errorData);
    CrashlyticsTracker.logError(error, errorData);
  }

  // Log error to local storage and queue for sending
  static logError(errorData) {
    // Add to error queue
    this.errorQueue.push(errorData);

    // Store in local storage
    const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    existingErrors.push(errorData);

    // Keep only last 1000 errors
    if (existingErrors.length > 1000) {
      existingErrors.splice(0, existingErrors.length - 1000);
    }

    localStorage.setItem('error_logs', JSON.stringify(existingErrors));

    // Send to server if online
    if (this.isOnline) {
      this.sendErrorToServer(errorData);
    }

    // Check if alert should be triggered
    this.checkAlertThresholds();
  }

  // Send error to server
  static async sendErrorToServer(errorData) {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      if (response.ok) {
        console.log('Error sent to server successfully');
      }
    } catch (error) {
      console.error('Failed to send error to server:', error);
    }
  }

  // Check if error rate exceeds thresholds
  static checkAlertThresholds() {
    const recentErrors = this.getRecentErrors(5); // Last 5 minutes
    const errorRate = recentErrors.length;

    if (errorRate >= 5) {
      this.triggerAlert('high_error_rate', {
        errorRate: errorRate,
        recentErrors: recentErrors.slice(0, 5) // Send first 5 errors
      });
    }

    // Check for critical errors
    const criticalErrors = recentErrors.filter(e => 
      e.type === 'api_error' && e.statusCode >= 500
    );

    if (criticalErrors.length >= 1) {
      this.triggerAlert('critical_errors', {
        criticalErrorCount: criticalErrors.length,
        errors: criticalErrors
      });
    }
  }

  // Get recent errors within specified minutes
  static getRecentErrors(minutes) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const allErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    
    return allErrors.filter(error => 
      new Date(error.timestamp) > cutoff
    );
  }

  // Trigger alert
  static triggerAlert(alertType, data) {
    console.warn(`🚨 ALERT TRIGGERED: ${alertType}`, data);

    // Send alert to monitoring system
    this.sendAlert(alertType, data);
  }

  // Send alert to monitoring system
  static async sendAlert(alertType, data) {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: alertType,
          data: data,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Get error statistics
  static getErrorStats() {
    const allErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    const last24Hours = this.getRecentErrors(24 * 60); // Last 24 hours

    const stats = {
      total: allErrors.length,
      last24Hours: last24Hours.length,
      byType: {},
      byHour: {}
    };

    // Group by type
    allErrors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    // Group by hour
    last24Hours.forEach(error => {
      const hour = new Date(error.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    return stats;
  }

  // Clear error logs
  static clearErrorLogs() {
    localStorage.removeItem('error_logs');
    this.errorQueue = [];
  }
}

// Network status monitoring
window.addEventListener('online', () => {
  ErrorTracker.isOnline = true;
  console.log('Network connection restored');
});

window.addEventListener('offline', () => {
  ErrorTracker.isOnline = false;
  console.log('Network connection lost');
});

export default ErrorTracker;
