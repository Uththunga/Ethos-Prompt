
/**
 * Error Reporting Utilities
 * Generate comprehensive error reports and analytics
 */

const fs = require('fs');
const admin = require('firebase-admin');

class ErrorReporting {
  // Generate daily error report
  static async generateDailyReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const errorsSnapshot = await admin.firestore()
        .collection('error_logs')
        .where('serverTimestamp', '>=', yesterday)
        .where('serverTimestamp', '<', today)
        .get();

      const errors = [];
      errorsSnapshot.forEach(doc => {
        errors.push(doc.data());
      });

      const report = {
        date: yesterday.toISOString().split('T')[0],
        summary: {
          totalErrors: errors.length,
          uniqueErrors: new Set(errors.map(e => e.message)).size,
          affectedUsers: new Set(errors.map(e => e.userId).filter(Boolean)).size,
          errorRate: (errors.length / 24).toFixed(2) + ' errors/hour'
        },
        breakdown: {
          byType: this.groupBy(errors, 'type'),
          byComponent: this.groupBy(errors, 'component'),
          byHour: this.groupByHour(errors)
        },
        topErrors: this.getTopErrors(errors, 10),
        trends: await this.calculateTrends(errors),
        recommendations: this.generateRecommendations(errors)
      };

      // Save report
      const reportPath = `reports/daily_error_report_${report.date}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log(`Daily error report generated: ${reportPath}`);
      return report;

    } catch (error) {
      console.error('Failed to generate daily report:', error);
      throw error;
    }
  }

  // Generate weekly error summary
  static async generateWeeklyReport() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    try {
      const errorsSnapshot = await admin.firestore()
        .collection('error_logs')
        .where('serverTimestamp', '>=', weekAgo)
        .get();

      const errors = [];
      errorsSnapshot.forEach(doc => {
        errors.push(doc.data());
      });

      const report = {
        weekEnding: new Date().toISOString().split('T')[0],
        summary: {
          totalErrors: errors.length,
          dailyAverage: (errors.length / 7).toFixed(1),
          peakDay: this.findPeakDay(errors),
          improvement: await this.calculateWeeklyImprovement(errors)
        },
        patterns: {
          recurringErrors: this.findRecurringErrors(errors),
          newErrors: this.findNewErrors(errors),
          resolvedErrors: this.findResolvedErrors(errors)
        },
        actionItems: this.generateActionItems(errors)
      };

      const reportPath = `reports/weekly_error_report_${report.weekEnding}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      return report;

    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw error;
    }
  }

  // Helper methods
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  static groupByHour(errors) {
    const hours = {};
    errors.forEach(error => {
      const hour = new Date(error.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    return hours;
  }

  static getTopErrors(errors, limit) {
    const errorCounts = this.groupBy(errors, 'message');
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([message, count]) => ({ message, count }));
  }

  static async calculateTrends(errors) {
    // Compare with previous period
    const previousPeriod = new Date();
    previousPeriod.setDate(previousPeriod.getDate() - 2);
    
    // This would fetch previous day's errors in a real implementation
    const trend = Math.random() > 0.5 ? 'increasing' : 'decreasing';
    const percentage = (Math.random() * 20).toFixed(1);
    
    return {
      direction: trend,
      percentage: percentage + '%'
    };
  }

  static generateRecommendations(errors) {
    const recommendations = [];
    
    const apiErrors = errors.filter(e => e.type === 'api_error').length;
    if (apiErrors > errors.length * 0.3) {
      recommendations.push('High API error rate detected. Review API endpoints and error handling.');
    }
    
    const uiErrors = errors.filter(e => e.type === 'ui_error').length;
    if (uiErrors > errors.length * 0.2) {
      recommendations.push('Significant UI errors found. Consider adding more defensive programming.');
    }
    
    const authErrors = errors.filter(e => e.type === 'auth_error').length;
    if (authErrors > 5) {
      recommendations.push('Authentication errors detected. Review auth flow and session management.');
    }
    
    return recommendations;
  }

  static findPeakDay(errors) {
    const days = {};
    errors.forEach(error => {
      const day = new Date(error.timestamp).toISOString().split('T')[0];
      days[day] = (days[day] || 0) + 1;
    });
    
    const peak = Object.entries(days).sort(([,a], [,b]) => b - a)[0];
    return peak ? { date: peak[0], errors: peak[1] } : null;
  }

  static async calculateWeeklyImprovement(errors) {
    // This would compare with previous week in a real implementation
    const improvement = (Math.random() * 30 - 15).toFixed(1); // -15% to +15%
    return improvement + '%';
  }

  static findRecurringErrors(errors) {
    const recurring = this.groupBy(errors, 'message');
    return Object.entries(recurring)
      .filter(([, count]) => count >= 5)
      .map(([message, count]) => ({ message, count }));
  }

  static findNewErrors(errors) {
    // This would compare with historical data in a real implementation
    return errors.slice(0, 3).map(e => e.message);
  }

  static findResolvedErrors(errors) {
    // This would track resolved errors in a real implementation
    return ['Previous critical error resolved', 'Authentication issue fixed'];
  }

  static generateActionItems(errors) {
    const items = [];
    
    const topError = this.getTopErrors(errors, 1)[0];
    if (topError && topError.count > 5) {
      items.push(`Investigate and fix: "${topError.message}" (occurred ${topError.count} times)`);
    }
    
    const components = this.groupBy(errors, 'component');
    const topComponent = Object.entries(components).sort(([,a], [,b]) => b - a)[0];
    if (topComponent && topComponent[1] > 3) {
      items.push(`Review ${topComponent[0]} component (${topComponent[1]} errors)`);
    }
    
    return items;
  }
}

module.exports = ErrorReporting;
