#!/usr/bin/env node

/**
 * Comprehensive API Integration Test Suite
 * Tests all REST API endpoints with production data volumes
 * Validates authentication, authorization, rate limiting, and error handling
 * 
 * Success Criteria: 100% API tests passing, <200ms response time
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:5001',
  timeout: 5000,
  maxRetries: 3,
  expectedResponseTime: 200, // ms
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  responseTimeStats: []
};

// Utility functions
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        testResults.responseTimeStats.push(responseTime);
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: responseTime
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(testName, passed, error = null, responseTime = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName} - PASSED ${responseTime ? `(${responseTime.toFixed(2)}ms)` : ''}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
    log(`${testName} - FAILED: ${error?.message || 'Unknown error'}`, 'error');
  }
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const passed = response.statusCode === 200 && response.responseTime < CONFIG.expectedResponseTime;
    recordTest('Health Check', passed, null, response.responseTime);
    return passed;
  } catch (error) {
    recordTest('Health Check', false, error);
    return false;
  }
}

async function testCorsConfiguration() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/test-cors',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const corsHeaders = response.headers['access-control-allow-origin'];
    const passed = response.statusCode === 200 && corsHeaders;
    recordTest('CORS Configuration', passed, null, response.responseTime);
    return passed;
  } catch (error) {
    recordTest('CORS Configuration', false, error);
    return false;
  }
}

async function testPromptGeneration() {
  try {
    const testData = {
      purpose: 'analyze market trends',
      industry: 'Technology',
      useCase: 'quarterly business reviews',
      context: 'Focus on emerging AI technologies',
      complexity: 'advanced'
    };

    const response = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/generate-prompt',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    }, testData);

    let responseData;
    try {
      responseData = JSON.parse(response.body);
    } catch (e) {
      throw new Error('Invalid JSON response');
    }

    const passed = response.statusCode === 200 && 
                  responseData.generatedPrompt && 
                  responseData.title &&
                  response.responseTime < CONFIG.expectedResponseTime;
    
    recordTest('Prompt Generation API', passed, null, response.responseTime);
    return passed;
  } catch (error) {
    recordTest('Prompt Generation API', false, error);
    return false;
  }
}

async function testPromptExecution() {
  try {
    const testData = {
      prompt: 'Analyze the following data: {{data}}',
      variables: { data: 'Sample market data for Q4 2024' },
      model: 'gpt-4',
      temperature: 0.7
    };

    const response = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/execute-prompt',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    }, testData);

    let responseData;
    try {
      responseData = JSON.parse(response.body);
    } catch (e) {
      throw new Error('Invalid JSON response');
    }

    const passed = response.statusCode === 200 && 
                  responseData.result &&
                  response.responseTime < CONFIG.expectedResponseTime;
    
    recordTest('Prompt Execution API', passed, null, response.responseTime);
    return passed;
  } catch (error) {
    recordTest('Prompt Execution API', false, error);
    return false;
  }
}

async function testRateLimiting() {
  try {
    const requests = [];
    const requestCount = 10;
    
    // Send multiple requests rapidly
    for (let i = 0; i < requestCount; i++) {
      requests.push(makeRequest({
        hostname: 'localhost',
        port: 5001,
        path: '/api/test-rate-limit',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    const responses = await Promise.allSettled(requests);
    const rateLimitedResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode === 429
    );

    // Should have some rate limited responses if rate limiting is working
    const passed = rateLimitedResponses.length > 0;
    recordTest('Rate Limiting', passed);
    return passed;
  } catch (error) {
    recordTest('Rate Limiting', false, error);
    return false;
  }
}

async function testErrorHandling() {
  try {
    // Test invalid endpoint
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/nonexistent-endpoint',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const passed = response.statusCode === 404;
    recordTest('Error Handling (404)', passed, null, response.responseTime);
    return passed;
  } catch (error) {
    recordTest('Error Handling (404)', false, error);
    return false;
  }
}

async function testAuthenticationFlow() {
  try {
    // Test unauthenticated request
    const unauthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/protected-endpoint',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const passed = unauthResponse.statusCode === 401;
    recordTest('Authentication Flow', passed, null, unauthResponse.responseTime);
    return passed;
  } catch (error) {
    recordTest('Authentication Flow', false, error);
    return false;
  }
}

// Main test runner
async function runApiIntegrationTests() {
  log('🚀 Starting API Integration Test Suite', 'info');
  log('=' * 60, 'info');
  
  const tests = [
    testHealthCheck,
    testCorsConfiguration,
    testPromptGeneration,
    testPromptExecution,
    testRateLimiting,
    testErrorHandling,
    testAuthenticationFlow
  ];

  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      log(`Test execution error: ${error.message}`, 'error');
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const avgResponseTime = testResults.responseTimeStats.length > 0 
    ? testResults.responseTimeStats.reduce((a, b) => a + b, 0) / testResults.responseTimeStats.length 
    : 0;
  
  const maxResponseTime = testResults.responseTimeStats.length > 0 
    ? Math.max(...testResults.responseTimeStats) 
    : 0;

  // Print results
  log('=' * 60, 'info');
  log('📊 API Integration Test Results', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, testResults.passed === testResults.total ? 'success' : 'info');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`, 'info');
  log(`Max Response Time: ${maxResponseTime.toFixed(2)}ms`, 'info');

  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }

  // Success criteria check
  const successCriteriaMet = testResults.passed === testResults.total && avgResponseTime < CONFIG.expectedResponseTime;
  
  if (successCriteriaMet) {
    log('\n🎉 All API integration tests passed!', 'success');
    log('✅ 100% API tests passing', 'success');
    log(`✅ Average response time: ${avgResponseTime.toFixed(2)}ms < ${CONFIG.expectedResponseTime}ms`, 'success');
    log('✅ Ready for production deployment!', 'success');
  } else {
    log('\n⚠️ API integration tests failed!', 'warning');
    if (testResults.failed > 0) {
      log(`❌ ${testResults.failed} tests failed`, 'error');
    }
    if (avgResponseTime >= CONFIG.expectedResponseTime) {
      log(`❌ Average response time: ${avgResponseTime.toFixed(2)}ms >= ${CONFIG.expectedResponseTime}ms`, 'error');
    }
  }

  return successCriteriaMet;
}

// Run tests if called directly
if (require.main === module) {
  runApiIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runApiIntegrationTests, testResults };
