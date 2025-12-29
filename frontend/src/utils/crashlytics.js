
/**
 * Crashlytics Utilities
 * Helper functions for error tracking and crash reporting
 */

export class CrashlyticsTracker {
  // Log non-fatal errors
  static logError(error, context = {}) {
    console.error('Error logged to Crashlytics:', error);
    
    // In a real implementation, this would use Firebase Crashlytics
    // For now, we'll log to console and local storage for debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Store in local storage for debugging
    const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
    existingLogs.push(errorLog);
    
    // Keep only last 50 errors
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    
    localStorage.setItem('error_logs', JSON.stringify(existingLogs));
  }

  // Set custom keys for crash context
  static setCustomKey(key, value) {
    console.log(`Crashlytics custom key: ${key} = ${value}`);
    
    // Store custom keys in session storage
    const customKeys = JSON.parse(sessionStorage.getItem('crashlytics_keys') || '{}');
    customKeys[key] = value;
    sessionStorage.setItem('crashlytics_keys', JSON.stringify(customKeys));
  }

  // Set user identifier
  static setUserId(userId) {
    this.setCustomKey('user_id', userId);
  }

  // Log custom message
  static log(message) {
    console.log(`Crashlytics log: ${message}`);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      level: 'info'
    };
    
    const existingLogs = JSON.parse(localStorage.getItem('crashlytics_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 100 logs
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('crashlytics_logs', JSON.stringify(existingLogs));
  }

  // Get error logs for debugging
  static getErrorLogs() {
    return JSON.parse(localStorage.getItem('error_logs') || '[]');
  }

  // Clear error logs
  static clearErrorLogs() {
    localStorage.removeItem('error_logs');
    localStorage.removeItem('crashlytics_logs');
    sessionStorage.removeItem('crashlytics_keys');
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  CrashlyticsTracker.logError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  CrashlyticsTracker.logError(new Error(event.reason), {
    type: 'unhandled_promise_rejection'
  });
});

export default CrashlyticsTracker;
