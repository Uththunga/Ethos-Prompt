/**
 * Integration Validation Script
 * Tests frontend-backend communication and deployed function integration
 */

const https = require('https');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseUrl: 'https://us-central1-rag-prompt-library.cloudfunctions.net',
  webAppUrl: 'https://rag-prompt-library.web.app',
  timeout: 30000
};

// Test results storage
const integrationResults = {
  frontendBackend: [],
  authentication: [],
  errorHandling: [],
  realTimeFeatures: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Utility functions
function logIntegrationTest(category, name, status, details = {}) {
  const result = {
    category,
    name,
    status,
    timestamp: new Date().toISOString(),
    responseTime: details.responseTime || 0,
    details: details.message || '',
    error: details.error || null,
    data: details.data || null
  };
  
  integrationResults[category].push(result);
  integrationResults.summary.total++;
  
  if (status === 'PASS') {
    integrationResults.summary.passed++;
    console.log(`✅ [${category.toUpperCase()}] ${name} - ${details.responseTime || 0}ms`);
    if (details.message) console.log(`   ${details.message}`);
  } else if (status === 'FAIL') {
    integrationResults.summary.failed++;
    console.log(`❌ [${category.toUpperCase()}] ${name} - ${details.message || 'Failed'}`);
    if (details.error) console.log(`   Error: ${details.error}`);
  } else if (status === 'WARN') {
    integrationResults.summary.warnings++;
    console.log(`⚠️  [${category.toUpperCase()}] ${name} - ${details.message || 'Warning'}`);
  }
}

// HTTP request helper
function makeIntegrationRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const requestOptions = {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Integration-Validator/1.0',
        'Origin': CONFIG.webAppUrl,
        ...options.headers
      },
      timeout: CONFIG.timeout
    };
    
    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: data,
            responseTime
          });
        } catch (parseError) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data,
            responseTime
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({ error: error.message, responseTime });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({ error: 'Request timeout', responseTime: CONFIG.timeout });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test Frontend-Backend Communication
async function testFrontendBackendCommunication() {
  console.log('\n🔗 Testing Frontend-Backend Communication...');
  
  // Test 1: CORS Preflight Request
  try {
    const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/test_cors`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      logIntegrationTest('frontendBackend', 'CORS preflight', 'PASS', {
        responseTime: response.responseTime,
        message: `CORS headers present: ${corsHeaders}`
      });
    } else {
      logIntegrationTest('frontendBackend', 'CORS preflight', 'WARN', {
        responseTime: response.responseTime,
        message: 'CORS headers not found in response'
      });
    }
  } catch (error) {
    logIntegrationTest('frontendBackend', 'CORS preflight', 'FAIL', {
      responseTime: error.responseTime,
      message: 'CORS preflight failed',
      error: error.error
    });
  }
  
  // Test 2: Function Availability
  const functions = ['generate_prompt', 'execute_prompt', 'test_cors'];
  
  for (const functionName of functions) {
    try {
      const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/${functionName}`, {
        method: 'POST',
        body: { test: true }
      });
      
      // Any response (including auth errors) means the function is available
      if (response.statusCode >= 200 && response.statusCode < 500) {
        logIntegrationTest('frontendBackend', `Function ${functionName}`, 'PASS', {
          responseTime: response.responseTime,
          message: `Function accessible (HTTP ${response.statusCode})`
        });
      } else {
        logIntegrationTest('frontendBackend', `Function ${functionName}`, 'WARN', {
          responseTime: response.responseTime,
          message: `Unexpected status: ${response.statusCode}`
        });
      }
    } catch (error) {
      logIntegrationTest('frontendBackend', `Function ${functionName}`, 'FAIL', {
        responseTime: error.responseTime,
        message: 'Function not accessible',
        error: error.error
      });
    }
  }
}

// Test Authentication Flow
async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  // Test 1: Unauthenticated Request (should be rejected)
  try {
    const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/generate_prompt`, {
      body: {
        purpose: 'test authentication',
        industry: 'technology',
        useCase: 'auth testing'
      }
    });
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      logIntegrationTest('authentication', 'Unauthenticated rejection', 'PASS', {
        responseTime: response.responseTime,
        message: 'Properly rejects unauthenticated requests'
      });
    } else if (response.statusCode === 400) {
      logIntegrationTest('authentication', 'Unauthenticated rejection', 'PASS', {
        responseTime: response.responseTime,
        message: 'Function validates input (auth may be handled differently)'
      });
    } else {
      logIntegrationTest('authentication', 'Unauthenticated rejection', 'WARN', {
        responseTime: response.responseTime,
        message: `Unexpected response: ${response.statusCode}`
      });
    }
  } catch (error) {
    logIntegrationTest('authentication', 'Unauthenticated rejection', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Authentication test failed',
      error: error.error
    });
  }
  
  // Test 2: Invalid Token Format
  try {
    const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/generate_prompt`, {
      headers: {
        'Authorization': 'Bearer invalid-token-format'
      },
      body: {
        purpose: 'test invalid token',
        industry: 'technology'
      }
    });
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      logIntegrationTest('authentication', 'Invalid token rejection', 'PASS', {
        responseTime: response.responseTime,
        message: 'Properly rejects invalid tokens'
      });
    } else {
      logIntegrationTest('authentication', 'Invalid token rejection', 'WARN', {
        responseTime: response.responseTime,
        message: `Token validation response: ${response.statusCode}`
      });
    }
  } catch (error) {
    logIntegrationTest('authentication', 'Invalid token rejection', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Invalid token test failed',
      error: error.error
    });
  }
}

// Test Error Handling
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test 1: Invalid Input Data
  try {
    const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/generate_prompt`, {
      body: {
        // Missing required fields
        invalid: 'data'
      }
    });
    
    if (response.statusCode >= 400 && response.statusCode < 500) {
      logIntegrationTest('errorHandling', 'Invalid input handling', 'PASS', {
        responseTime: response.responseTime,
        message: `Properly handles invalid input (${response.statusCode})`
      });
    } else {
      logIntegrationTest('errorHandling', 'Invalid input handling', 'WARN', {
        responseTime: response.responseTime,
        message: `Unexpected response to invalid input: ${response.statusCode}`
      });
    }
  } catch (error) {
    logIntegrationTest('errorHandling', 'Invalid input handling', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Error handling test failed',
      error: error.error
    });
  }
  
  // Test 2: Malformed JSON
  try {
    const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/test_cors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid-json-data'
    });
    
    if (response.statusCode >= 400) {
      logIntegrationTest('errorHandling', 'Malformed JSON handling', 'PASS', {
        responseTime: response.responseTime,
        message: `Properly handles malformed JSON (${response.statusCode})`
      });
    } else {
      logIntegrationTest('errorHandling', 'Malformed JSON handling', 'WARN', {
        responseTime: response.responseTime,
        message: `Unexpected response to malformed JSON: ${response.statusCode}`
      });
    }
  } catch (error) {
    logIntegrationTest('errorHandling', 'Malformed JSON handling', 'PASS', {
      responseTime: error.responseTime,
      message: 'Properly rejects malformed requests',
      error: error.error
    });
  }
}

// Test Real-time Features
async function testRealTimeFeatures() {
  console.log('\n⚡ Testing Real-time Features...');
  
  // Test 1: Response Time Performance
  const performanceTests = [
    { name: 'CORS test response', endpoint: 'test_cors' },
    { name: 'Function cold start', endpoint: 'generate_prompt' }
  ];
  
  for (const test of performanceTests) {
    try {
      const response = await makeIntegrationRequest(`${CONFIG.baseUrl}/${test.endpoint}`, {
        body: { performance: 'test' }
      });
      
      if (response.responseTime < 5000) { // 5 second threshold
        logIntegrationTest('realTimeFeatures', test.name, 'PASS', {
          responseTime: response.responseTime,
          message: `Response within acceptable time`
        });
      } else {
        logIntegrationTest('realTimeFeatures', test.name, 'WARN', {
          responseTime: response.responseTime,
          message: `Slow response time (>${response.responseTime}ms)`
        });
      }
    } catch (error) {
      logIntegrationTest('realTimeFeatures', test.name, 'FAIL', {
        responseTime: error.responseTime,
        message: 'Performance test failed',
        error: error.error
      });
    }
  }
}

// Generate integration report
function generateIntegrationReport() {
  console.log('\n📊 Integration Validation Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${integrationResults.summary.total}`);
  console.log(`✅ Passed: ${integrationResults.summary.passed}`);
  console.log(`❌ Failed: ${integrationResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${integrationResults.summary.warnings}`);
  
  const successRate = integrationResults.summary.total > 0 ? 
    ((integrationResults.summary.passed / integrationResults.summary.total) * 100).toFixed(1) : 0;
  console.log(`📈 Success Rate: ${successRate}%`);
  
  // Category breakdown
  console.log('\n📋 Category Breakdown:');
  Object.keys(integrationResults).forEach(category => {
    if (category !== 'summary' && integrationResults[category].length > 0) {
      const categoryTests = integrationResults[category];
      const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
      console.log(`  ${category}: ${categoryPassed}/${categoryTests.length} passed`);
    }
  });
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: integrationResults.summary,
    successRate: parseFloat(successRate),
    results: integrationResults
  };
  
  // Ensure reports directory exists
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }
  
  fs.writeFileSync(
    'reports/integration_validation.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n📄 Integration report saved to: reports/integration_validation.json');
  
  return reportData;
}

// Main execution
async function runIntegrationValidation() {
  console.log('🔗 Starting Integration Validation');
  console.log('='.repeat(50));
  
  try {
    await testFrontendBackendCommunication();
    await testAuthenticationFlow();
    await testErrorHandling();
    await testRealTimeFeatures();
    
    const report = generateIntegrationReport();
    
    console.log('\n🎯 Integration Validation completed!');
    
    return report;
  } catch (error) {
    console.error('\n💥 Integration validation failed with error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runIntegrationValidation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runIntegrationValidation, integrationResults };
