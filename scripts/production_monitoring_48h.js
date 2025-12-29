/**
 * 48-Hour Production Monitoring Script
 * Continuously monitors production metrics and generates reports
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://us-central1-rag-prompt-library.cloudfunctions.net',
  webAppUrl: 'https://rag-prompt-library.web.app',
  monitoringInterval: 5 * 60 * 1000, // 5 minutes
  alertThresholds: {
    responseTime: 500, // ms
    errorRate: 1, // percentage
    uptime: 99.9 // percentage
  },
  reportInterval: 60 * 60 * 1000 // 1 hour
};

// Monitoring data storage
const monitoringData = {
  startTime: new Date().toISOString(),
  metrics: [],
  alerts: [],
  summary: {
    totalChecks: 0,
    successfulChecks: 0,
    averageResponseTime: 0,
    errorRate: 0,
    uptime: 100
  }
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data) console.log('  Data:', JSON.stringify(data, null, 2));
  
  // Save to monitoring data
  if (level === 'ALERT') {
    monitoringData.alerts.push(logEntry);
  }
}

// Health check function
async function performHealthCheck() {
  const startTime = Date.now();
  const checkResults = {
    timestamp: new Date().toISOString(),
    webApp: { status: 'unknown', responseTime: 0 },
    functions: {},
    overall: { status: 'unknown', responseTime: 0 }
  };
  
  try {
    // Check web application
    const webAppResult = await checkEndpoint(CONFIG.webAppUrl, 'GET');
    checkResults.webApp = {
      status: webAppResult.success ? 'healthy' : 'unhealthy',
      responseTime: webAppResult.responseTime,
      statusCode: webAppResult.statusCode
    };
    
    // Check Cloud Functions
    const functions = ['test_cors', 'generate_prompt', 'execute_prompt'];
    for (const func of functions) {
      try {
        const funcResult = await checkEndpoint(`${CONFIG.baseUrl}/${func}`, 'POST', { test: true });
        checkResults.functions[func] = {
          status: funcResult.statusCode < 500 ? 'healthy' : 'unhealthy',
          responseTime: funcResult.responseTime,
          statusCode: funcResult.statusCode
        };
      } catch (error) {
        checkResults.functions[func] = {
          status: 'unhealthy',
          responseTime: 0,
          error: error.message
        };
      }
    }
    
    // Calculate overall health
    const totalResponseTime = Date.now() - startTime;
    const allHealthy = checkResults.webApp.status === 'healthy' && 
                      Object.values(checkResults.functions).every(f => f.status === 'healthy');
    
    checkResults.overall = {
      status: allHealthy ? 'healthy' : 'degraded',
      responseTime: totalResponseTime
    };
    
    // Update monitoring data
    monitoringData.metrics.push(checkResults);
    updateSummaryMetrics(checkResults);
    
    // Check for alerts
    checkAlertThresholds(checkResults);
    
    log('INFO', 'Health check completed', {
      status: checkResults.overall.status,
      responseTime: checkResults.overall.responseTime,
      webApp: checkResults.webApp.status,
      functions: Object.keys(checkResults.functions).length
    });
    
  } catch (error) {
    log('ERROR', 'Health check failed', { error: error.message });
    checkResults.overall.status = 'unhealthy';
    monitoringData.metrics.push(checkResults);
  }
  
  return checkResults;
}

// HTTP request helper
function checkEndpoint(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : require('http');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Monitor/1.0'
      },
      timeout: 10000
    };
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          responseTime,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({ error: error.message, responseTime });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({ error: 'Request timeout', responseTime: 10000 });
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Update summary metrics
function updateSummaryMetrics(checkResult) {
  monitoringData.summary.totalChecks++;
  
  if (checkResult.overall.status === 'healthy') {
    monitoringData.summary.successfulChecks++;
  }
  
  // Calculate average response time
  const responseTimes = monitoringData.metrics.map(m => m.overall.responseTime);
  monitoringData.summary.averageResponseTime = 
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  // Calculate uptime
  monitoringData.summary.uptime = 
    (monitoringData.summary.successfulChecks / monitoringData.summary.totalChecks) * 100;
  
  // Calculate error rate
  monitoringData.summary.errorRate = 100 - monitoringData.summary.uptime;
}

// Check alert thresholds
function checkAlertThresholds(checkResult) {
  const { responseTime, errorRate, uptime } = CONFIG.alertThresholds;
  
  // Response time alert
  if (checkResult.overall.responseTime > responseTime) {
    log('ALERT', `High response time detected: ${checkResult.overall.responseTime}ms`, {
      threshold: responseTime,
      actual: checkResult.overall.responseTime
    });
  }
  
  // Error rate alert
  if (monitoringData.summary.errorRate > errorRate) {
    log('ALERT', `High error rate detected: ${monitoringData.summary.errorRate.toFixed(2)}%`, {
      threshold: errorRate,
      actual: monitoringData.summary.errorRate
    });
  }
  
  // Uptime alert
  if (monitoringData.summary.uptime < uptime) {
    log('ALERT', `Low uptime detected: ${monitoringData.summary.uptime.toFixed(2)}%`, {
      threshold: uptime,
      actual: monitoringData.summary.uptime
    });
  }
}

// Generate monitoring report
function generateMonitoringReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    monitoringPeriod: {
      start: monitoringData.startTime,
      duration: Date.now() - new Date(monitoringData.startTime).getTime()
    },
    summary: monitoringData.summary,
    recentMetrics: monitoringData.metrics.slice(-12), // Last 12 checks (1 hour)
    alerts: monitoringData.alerts,
    recommendations: generateRecommendations()
  };
  
  // Ensure reports directory exists
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }
  
  // Save report
  const reportPath = `reports/production_monitoring_${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('INFO', 'Monitoring report generated', {
    reportPath,
    totalChecks: report.summary.totalChecks,
    uptime: report.summary.uptime.toFixed(2) + '%',
    avgResponseTime: report.summary.averageResponseTime.toFixed(0) + 'ms'
  });
  
  return report;
}

// Generate recommendations
function generateRecommendations() {
  const recommendations = [];
  
  if (monitoringData.summary.averageResponseTime > CONFIG.alertThresholds.responseTime) {
    recommendations.push('Consider optimizing Cloud Function performance to reduce response times');
  }
  
  if (monitoringData.summary.uptime < CONFIG.alertThresholds.uptime) {
    recommendations.push('Investigate and resolve reliability issues affecting uptime');
  }
  
  if (monitoringData.alerts.length > 0) {
    recommendations.push('Review and address recent alerts to improve system stability');
  }
  
  if (monitoringData.summary.totalChecks > 100) {
    recommendations.push('Consider implementing automated scaling based on monitoring data');
  }
  
  return recommendations;
}

// Start monitoring
function startMonitoring() {
  log('INFO', '🚀 Starting 48-hour production monitoring', {
    interval: CONFIG.monitoringInterval / 1000 + ' seconds',
    reportInterval: CONFIG.reportInterval / 1000 + ' seconds'
  });
  
  // Initial health check
  performHealthCheck();
  
  // Set up monitoring interval
  const monitoringTimer = setInterval(performHealthCheck, CONFIG.monitoringInterval);
  
  // Set up reporting interval
  const reportingTimer = setInterval(generateMonitoringReport, CONFIG.reportInterval);
  
  // Stop monitoring after 48 hours
  setTimeout(() => {
    clearInterval(monitoringTimer);
    clearInterval(reportingTimer);
    
    // Generate final report
    const finalReport = generateMonitoringReport();
    
    log('INFO', '✅ 48-hour monitoring completed', {
      totalChecks: finalReport.summary.totalChecks,
      uptime: finalReport.summary.uptime.toFixed(2) + '%',
      alerts: finalReport.alerts.length
    });
    
    process.exit(0);
  }, 48 * 60 * 60 * 1000); // 48 hours
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('INFO', 'Monitoring interrupted, generating final report...');
  generateMonitoringReport();
  process.exit(0);
});

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = { startMonitoring, generateMonitoringReport, monitoringData };
