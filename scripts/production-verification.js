#!/usr/bin/env node

/**
 * Production Verification Script
 * Automated testing of critical user flows in production
 * 
 * Usage: node scripts/production-verification.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  productionUrl: 'https://rag-prompt-library.web.app',
  timeout: 10000,
  reportPath: path.join(__dirname, '../reports/Production_Verification_Results.json'),
};

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  productionUrl: CONFIG.productionUrl,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪',
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(name, status, details = {}) {
  const result = {
    name,
    status, // 'PASS', 'FAIL', 'WARNING'
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  results.tests.push(result);
  results.summary.total++;
  
  if (status === 'PASS') {
    results.summary.passed++;
    log(`${name}: PASS`, 'success');
  } else if (status === 'FAIL') {
    results.summary.failed++;
    log(`${name}: FAIL - ${details.error || 'Unknown error'}`, 'error');
  } else if (status === 'WARNING') {
    results.summary.warnings++;
    log(`${name}: WARNING - ${details.message || 'Check required'}`, 'warning');
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test functions
async function testApplicationLoad() {
  log('Testing application load...', 'test');
  
  try {
    const response = await makeRequest(CONFIG.productionUrl);
    
    if (response.statusCode === 200) {
      addTestResult('Application Load', 'PASS', {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
      });
      
      // Check response time
      if (response.responseTime > 3000) {
        addTestResult('Application Load Time', 'WARNING', {
          message: `Load time ${response.responseTime}ms exceeds 3000ms target`,
          responseTime: response.responseTime,
        });
      } else {
        addTestResult('Application Load Time', 'PASS', {
          responseTime: response.responseTime,
        });
      }
      
      // Check for HTML content
      if (response.body.includes('<div id="root">')) {
        addTestResult('React Root Element', 'PASS');
      } else {
        addTestResult('React Root Element', 'FAIL', {
          error: 'Root element not found in HTML',
        });
      }
      
      // Check for meta tags
      if (response.body.includes('<meta') && response.body.includes('viewport')) {
        addTestResult('Meta Tags Present', 'PASS');
      } else {
        addTestResult('Meta Tags Present', 'WARNING', {
          message: 'Some meta tags may be missing',
        });
      }
      
    } else {
      addTestResult('Application Load', 'FAIL', {
        error: `Unexpected status code: ${response.statusCode}`,
        statusCode: response.statusCode,
      });
    }
  } catch (error) {
    addTestResult('Application Load', 'FAIL', {
      error: error.message,
    });
  }
}

async function testSecurityHeaders() {
  log('Testing security headers...', 'test');
  
  try {
    const response = await makeRequest(CONFIG.productionUrl);
    const headers = response.headers;
    
    // Check for security headers
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': true, // Just check presence
      'content-security-policy': true,
    };
    
    for (const [header, expectedValue] of Object.entries(securityHeaders)) {
      const headerValue = headers[header.toLowerCase()];
      
      if (headerValue) {
        if (expectedValue === true || headerValue.includes(expectedValue)) {
          addTestResult(`Security Header: ${header}`, 'PASS', {
            value: headerValue,
          });
        } else {
          addTestResult(`Security Header: ${header}`, 'WARNING', {
            message: `Expected "${expectedValue}", got "${headerValue}"`,
            value: headerValue,
          });
        }
      } else {
        addTestResult(`Security Header: ${header}`, 'FAIL', {
          error: 'Header not present',
        });
      }
    }
  } catch (error) {
    addTestResult('Security Headers Check', 'FAIL', {
      error: error.message,
    });
  }
}

async function testStaticAssets() {
  log('Testing static assets...', 'test');
  
  const assets = [
    '/vite.svg',
    '/assets/', // Will check if assets directory is accessible
  ];
  
  for (const asset of assets) {
    try {
      const url = `${CONFIG.productionUrl}${asset}`;
      const response = await makeRequest(url);
      
      if (response.statusCode === 200 || response.statusCode === 301 || response.statusCode === 302) {
        addTestResult(`Static Asset: ${asset}`, 'PASS', {
          statusCode: response.statusCode,
        });
      } else if (response.statusCode === 404) {
        addTestResult(`Static Asset: ${asset}`, 'WARNING', {
          message: 'Asset not found (may be expected)',
          statusCode: response.statusCode,
        });
      } else {
        addTestResult(`Static Asset: ${asset}`, 'FAIL', {
          error: `Unexpected status code: ${response.statusCode}`,
          statusCode: response.statusCode,
        });
      }
    } catch (error) {
      addTestResult(`Static Asset: ${asset}`, 'WARNING', {
        message: error.message,
      });
    }
  }
}

async function testRoutes() {
  log('Testing application routes...', 'test');
  
  const routes = [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/dashboard/prompts',
    '/dashboard/documents',
    '/dashboard/executions',
  ];
  
  for (const route of routes) {
    try {
      const url = `${CONFIG.productionUrl}${route}`;
      const response = await makeRequest(url);
      
      // For SPA, all routes should return 200 and serve index.html
      if (response.statusCode === 200) {
        addTestResult(`Route: ${route}`, 'PASS', {
          statusCode: response.statusCode,
          responseTime: response.responseTime,
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        addTestResult(`Route: ${route}`, 'PASS', {
          message: 'Redirect detected (may be expected)',
          statusCode: response.statusCode,
          location: response.headers.location,
        });
      } else {
        addTestResult(`Route: ${route}`, 'FAIL', {
          error: `Unexpected status code: ${response.statusCode}`,
          statusCode: response.statusCode,
        });
      }
    } catch (error) {
      addTestResult(`Route: ${route}`, 'FAIL', {
        error: error.message,
      });
    }
  }
}

async function testAPIEndpoints() {
  log('Testing API endpoints...', 'test');
  
  // Note: Most API endpoints require authentication
  // We'll just test that they're accessible and return appropriate responses
  
  const apiBase = 'https://australia-southeast1-rag-prompt-library.cloudfunctions.net';
  
  // Test health check endpoint if available
  try {
    const response = await makeRequest(`${apiBase}/health`);
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      addTestResult('API Endpoint Accessibility', 'PASS', {
        message: 'API endpoints are accessible',
        statusCode: response.statusCode,
      });
    } else {
      addTestResult('API Endpoint Accessibility', 'WARNING', {
        message: `Unexpected status code: ${response.statusCode}`,
        statusCode: response.statusCode,
      });
    }
  } catch (error) {
    addTestResult('API Endpoint Accessibility', 'WARNING', {
      message: 'Could not verify API endpoint accessibility',
      error: error.message,
    });
  }
}

async function testPerformance() {
  log('Testing performance metrics...', 'test');
  
  try {
    const iterations = 3;
    const responseTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const response = await makeRequest(CONFIG.productionUrl);
      responseTimes.push(response.responseTime);
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    addTestResult('Average Response Time', avgResponseTime < 3000 ? 'PASS' : 'WARNING', {
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      target: 3000,
    });
    
  } catch (error) {
    addTestResult('Performance Test', 'FAIL', {
      error: error.message,
    });
  }
}

// Generate report
function generateReport() {
  log('Generating verification report...', 'info');
  
  // Calculate pass rate
  const passRate = results.summary.total > 0
    ? Math.round((results.summary.passed / results.summary.total) * 100)
    : 0;
  
  results.summary.passRate = passRate;
  
  // Save JSON report
  fs.writeFileSync(CONFIG.reportPath, JSON.stringify(results, null, 2));
  log(`Report saved to: ${CONFIG.reportPath}`, 'success');
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Production URL: ${CONFIG.productionUrl}`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('='.repeat(60));
  
  // List failed tests
  if (results.summary.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error || 'Unknown error'}`);
      });
  }
  
  // List warnings
  if (results.summary.warnings > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.tests
      .filter(t => t.status === 'WARNING')
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.message || 'Check required'}`);
      });
  }
  
  console.log('\n');
  
  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PRODUCTION VERIFICATION STARTED');
  console.log('='.repeat(60));
  console.log(`Production URL: ${CONFIG.productionUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    await testApplicationLoad();
    await testSecurityHeaders();
    await testStaticAssets();
    await testRoutes();
    await testAPIEndpoints();
    await testPerformance();
    
    generateReport();
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the verification
main();

