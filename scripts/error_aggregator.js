
/**
 * Error Aggregation System
 * Collects and analyzes errors from multiple sources
 */

const admin = require('firebase-admin');
const fs = require('fs');

class ErrorAggregator {
  constructor() {
    this.errorBuffer = [];
    this.alertThresholds = {"errorRate":5,"criticalErrors":1,"userImpact":10};
  }

  // Collect error from frontend
  async collectError(errorData) {
    try {
      // Add server timestamp
      errorData.serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
      
      // Store in Firestore
      await admin.firestore().collection('error_logs').add(errorData);
      
      // Add to buffer for real-time analysis
      this.errorBuffer.push(errorData);
      
      // Keep buffer size manageable
      if (this.errorBuffer.length > 1000) {
        this.errorBuffer.splice(0, 500);
      }
      
      // Analyze for alerts
      await this.analyzeErrors();
      
      console.log('Error collected and stored:', errorData.type);
      
    } catch (error) {
      console.error('Failed to collect error:', error);
    }
  }

  // Analyze errors for patterns and alerts
  async analyzeErrors() {
    const recentErrors = this.getRecentErrors(5); // Last 5 minutes
    
    // Check error rate
    if (recentErrors.length >= this.alertThresholds.errorRate) {
      await this.triggerAlert('high_error_rate', {
        errorCount: recentErrors.length,
        timeWindow: '5 minutes',
        errors: recentErrors.slice(0, 5)
      });
    }
    
    // Check for error patterns
    const errorPatterns = this.detectErrorPatterns(recentErrors);
    if (errorPatterns.length > 0) {
      await this.triggerAlert('error_pattern_detected', {
        patterns: errorPatterns
      });
    }
    
    // Check user impact
    const userImpact = this.calculateUserImpact(recentErrors);
    if (userImpact >= this.alertThresholds.userImpact) {
      await this.triggerAlert('high_user_impact', {
        impactPercentage: userImpact,
        affectedUsers: this.getAffectedUsers(recentErrors)
      });
    }
  }

  // Get recent errors from buffer
  getRecentErrors(minutes) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorBuffer.filter(error => 
      new Date(error.timestamp) > cutoff
    );
  }

  // Detect error patterns
  detectErrorPatterns(errors) {
    const patterns = [];
    
    // Group by error message
    const messageGroups = {};
    errors.forEach(error => {
      const key = error.message;
      messageGroups[key] = (messageGroups[key] || 0) + 1;
    });
    
    // Find patterns (same error occurring multiple times)
    Object.entries(messageGroups).forEach(([message, count]) => {
      if (count >= 3) {
        patterns.push({
          type: 'repeated_error',
          message: message,
          count: count
        });
      }
    });
    
    // Group by component/endpoint
    const componentGroups = {};
    errors.forEach(error => {
      const key = error.component || error.endpoint || 'unknown';
      componentGroups[key] = (componentGroups[key] || 0) + 1;
    });
    
    // Find component-specific patterns
    Object.entries(componentGroups).forEach(([component, count]) => {
      if (count >= 3) {
        patterns.push({
          type: 'component_errors',
          component: component,
          count: count
        });
      }
    });
    
    return patterns;
  }

  // Calculate user impact percentage
  calculateUserImpact(errors) {
    const uniqueUsers = new Set();
    errors.forEach(error => {
      if (error.userId) {
        uniqueUsers.add(error.userId);
      }
    });
    
    // Estimate total active users (this would come from analytics in real implementation)
    const estimatedActiveUsers = 100; // Placeholder
    
    return (uniqueUsers.size / estimatedActiveUsers) * 100;
  }

  // Get list of affected users
  getAffectedUsers(errors) {
    const users = new Set();
    errors.forEach(error => {
      if (error.userId) {
        users.add(error.userId);
      }
    });
    return Array.from(users);
  }

  // Trigger alert
  async triggerAlert(alertType, data) {
    const alert = {
      type: alertType,
      data: data,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(alertType),
      resolved: false
    };
    
    // Store alert in Firestore
    await admin.firestore().collection('alerts').add(alert);
    
    // Send notifications
    await this.sendNotifications(alert);
    
    console.log(`🚨 ALERT: ${alertType}`, data);
  }

  // Get alert severity
  getAlertSeverity(alertType) {
    const severityMap = {
      'high_error_rate': 'warning',
      'error_pattern_detected': 'warning',
      'high_user_impact': 'critical',
      'critical_errors': 'critical'
    };
    
    return severityMap[alertType] || 'info';
  }

  // Send notifications
  async sendNotifications(alert) {
    // Email notification (placeholder)
    console.log('📧 Email notification sent for alert:', alert.type);
    
    // Slack notification (placeholder)
    console.log('💬 Slack notification sent for alert:', alert.type);
    
    // Webhook notification (placeholder)
    console.log('🔗 Webhook notification sent for alert:', alert.type);
  }

  // Generate error report
  async generateErrorReport() {
    const last24Hours = this.getRecentErrors(24 * 60);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: last24Hours.length,
        errorRate: (last24Hours.length / 24).toFixed(2) + ' errors/hour',
        topErrors: this.getTopErrors(last24Hours),
        errorsByType: this.groupErrorsByType(last24Hours)
      },
      trends: {
        hourlyDistribution: this.getHourlyDistribution(last24Hours),
        errorPatterns: this.detectErrorPatterns(last24Hours)
      },
      userImpact: {
        affectedUsers: this.getAffectedUsers(last24Hours).length,
        impactPercentage: this.calculateUserImpact(last24Hours)
      }
    };
    
    // Save report
    fs.writeFileSync(
      'reports/error_report_' + new Date().toISOString().split('T')[0] + '.json',
      JSON.stringify(report, null, 2)
    );
    
    return report;
  }

  // Helper methods
  getTopErrors(errors) {
    const errorCounts = {};
    errors.forEach(error => {
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  groupErrorsByType(errors) {
    const types = {};
    errors.forEach(error => {
      types[error.type] = (types[error.type] || 0) + 1;
    });
    return types;
  }

  getHourlyDistribution(errors) {
    const hours = {};
    errors.forEach(error => {
      const hour = new Date(error.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    return hours;
  }
}

module.exports = ErrorAggregator;
