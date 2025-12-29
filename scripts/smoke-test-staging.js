#!/usr/bin/env node

/**
 * Smoke Tests for Staging Deployment
 * 
 * Tests basic functionality of deployed functions:
 * - Health check endpoint
 * - Get available models
 * - CORS configuration
 * - Function accessibility
 */

const https = require('https');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
  log(`\nTesting: ${name}`, 'cyan');
  log(`  URL: ${url}`, 'cyan');
  
  results.total++;
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(url, options);
    const duration = Date.now() - startTime;
    
    const statusMatch = response.statusCode === expectedStatus;
    const passed = statusMatch;
    
    log(`  Status: ${response.statusCode} (expected: ${expectedStatus})`, statusMatch ? 'green' : 'red');
    log(`  Duration: ${duration}ms`, 'cyan');
    
    // Check CORS headers
    if (response.headers['access-control-allow-origin']) {
      log(`  CORS: ${response.headers['access-control-allow-origin']}`, 'green');
    }
    
    // Try to parse response
    try {
      const data = JSON.parse(response.body);
      log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`, 'cyan');
    } catch {
      log(`  Response: ${response.body.substring(0, 100)}...`, 'cyan');
    }
    
    if (passed) {
      log(`  ✓ PASSED`, 'green');
      results.passed++;
    } else {
      log(`  ✗ FAILED`, 'red');
      results.failed++;
    }
    
    results.tests.push({
      name,
      passed,
      statusCode: response.statusCode,
      duration,
    });
    
    return passed;
  } catch (error) {
    log(`  ✗ FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({
      name,
      passed: false,
      error: error.message,
    });
    return false;
  }
}

async function runSmokeTests() {
  try {
    logSection('Smoke Tests - Staging Deployment');
    
    // Base URL for staging functions
    const baseUrl = 'https://australia-southeast1-rag-prompt-library-staging.cloudfunctions.net';
    
    // Test 1: Health check
    await testEndpoint(
      'Health Check',
      `${baseUrl}/health`,
      200
    );
    
    // Test 2: API health endpoint
    await testEndpoint(
      'API Health (via callable)',
      `${baseUrl}/api`,
      200,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            endpoint: 'health'
          }
        }),
      }
    );
    
    // Test 3: Get available models
    await testEndpoint(
      'Get Available Models',
      `${baseUrl}/get_available_models`,
      200
    );
    
    // Test 4: API get available models (via callable)
    await testEndpoint(
      'API Get Available Models (via callable)',
      `${baseUrl}/api`,
      200,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            endpoint: 'get_available_models'
          }
        }),
      }
    );
    
    // Test 5: CORS preflight check
    log(`\nTesting: CORS Preflight`, 'cyan');
    try {
      const response = await makeRequest(`${baseUrl}/api`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://react-app-000730.web.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });
      
      const hasCORS = response.headers['access-control-allow-origin'] !== undefined;
      log(`  CORS Headers: ${hasCORS ? 'Present' : 'Missing'}`, hasCORS ? 'green' : 'red');
      
      if (hasCORS) {
        log(`  Allow-Origin: ${response.headers['access-control-allow-origin']}`, 'green');
        log(`  Allow-Methods: ${response.headers['access-control-allow-methods'] || 'N/A'}`, 'cyan');
        log(`  Allow-Headers: ${response.headers['access-control-allow-headers'] || 'N/A'}`, 'cyan');
        log(`  ✓ PASSED`, 'green');
        results.passed++;
      } else {
        log(`  ✗ FAILED: No CORS headers`, 'red');
        results.failed++;
      }
      
      results.total++;
      results.tests.push({
        name: 'CORS Preflight',
        passed: hasCORS,
      });
    } catch (error) {
      log(`  ✗ FAILED: ${error.message}`, 'red');
      results.failed++;
      results.total++;
      results.tests.push({
        name: 'CORS Preflight',
        passed: false,
        error: error.message,
      });
    }
    
    // Summary
    logSection('Smoke Test Summary');
    
    log(`Total Tests: ${results.total}`, 'cyan');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          log(`  - ${t.name}`, 'red');
          if (t.error) {
            log(`    Error: ${t.error}`, 'red');
          }
        });
      
      log('\nSome smoke tests failed. Please review the deployment.', 'red');
      process.exit(1);
    } else {
      log('\nAll smoke tests passed! Staging deployment is healthy.', 'green');
      log('\nNext steps:', 'cyan');
      log('  1. Verify indexes in Firebase Console', 'cyan');
      log('  2. Test CORS from production frontend', 'cyan');
      log('  3. Monitor function logs for errors', 'cyan');
      process.exit(0);
    }
  } catch (error) {
    log(`\nError running smoke tests: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run smoke tests
runSmokeTests();

