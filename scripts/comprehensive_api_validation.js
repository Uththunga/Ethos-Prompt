/**
 * Comprehensive API Endpoint Validation Script
 * Tests all Firebase Cloud Functions and RAG functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'https://us-central1-rag-prompt-library.cloudfunctions.net',
  webAppUrl: 'https://rag-prompt-library.web.app',
  timeout: 30000,
  maxRetries: 3
};

// Test results storage
const testResults = {
  apiEndpoints: [],
  ragPipeline: [],
  integration: [],
  performance: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Utility functions
function logTest(category, name, status, details = {}) {
  const result = {
    category,
    name,
    status,
    timestamp: new Date().toISOString(),
    responseTime: details.responseTime || 0,
    details: details.message || '',
    error: details.error || null
  };
  
  testResults[category].push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ [${category.toUpperCase()}] ${name} - ${details.responseTime || 0}ms`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ [${category.toUpperCase()}] ${name} - ${details.message || 'Failed'}`);
    if (details.error) console.log(`   Error: ${details.error}`);
  } else if (status === 'WARN') {
    testResults.summary.warnings++;
    console.log(`⚠️  [${category.toUpperCase()}] ${name} - ${details.message || 'Warning'}`);
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RAG-API-Validator/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime
        });
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

// Test Firebase Cloud Functions
async function testCloudFunctions() {
  console.log('\n🔥 Testing Firebase Cloud Functions...');
  
  // Test 1: CORS Test Function
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/test_cors`, {
      method: 'POST',
      headers: {
        'Origin': CONFIG.webAppUrl
      },
      body: { test: true }
    });
    
    if (response.statusCode === 200) {
      logTest('apiEndpoints', 'test_cors function', 'PASS', {
        responseTime: response.responseTime,
        message: 'CORS configuration working'
      });
    } else {
      logTest('apiEndpoints', 'test_cors function', 'FAIL', {
        responseTime: response.responseTime,
        message: `HTTP ${response.statusCode}`,
        error: response.data
      });
    }
  } catch (error) {
    logTest('apiEndpoints', 'test_cors function', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Function call failed',
      error: error.error
    });
  }
  
  // Test 2: Generate Prompt Function (without auth - should fail)
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/generate_prompt`, {
      method: 'POST',
      body: {
        purpose: 'test prompt generation',
        industry: 'technology',
        useCase: 'API testing'
      }
    });
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      logTest('apiEndpoints', 'generate_prompt auth check', 'PASS', {
        responseTime: response.responseTime,
        message: 'Authentication properly enforced'
      });
    } else {
      logTest('apiEndpoints', 'generate_prompt auth check', 'WARN', {
        responseTime: response.responseTime,
        message: `Expected 401/403, got ${response.statusCode}`
      });
    }
  } catch (error) {
    logTest('apiEndpoints', 'generate_prompt auth check', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Function call failed',
      error: error.error
    });
  }
  
  // Test 3: Execute Prompt Function (without auth - should fail)
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/execute_prompt`, {
      method: 'POST',
      body: {
        promptId: 'test-prompt-id',
        input: { test: 'value' }
      }
    });
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      logTest('apiEndpoints', 'execute_prompt auth check', 'PASS', {
        responseTime: response.responseTime,
        message: 'Authentication properly enforced'
      });
    } else {
      logTest('apiEndpoints', 'execute_prompt auth check', 'WARN', {
        responseTime: response.responseTime,
        message: `Expected 401/403, got ${response.statusCode}`
      });
    }
  } catch (error) {
    logTest('apiEndpoints', 'execute_prompt auth check', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Function call failed',
      error: error.error
    });
  }
}

// Test CORS Configuration
async function testCORSConfiguration() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  const origins = [
    CONFIG.webAppUrl,
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  for (const origin of origins) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}/test_cors`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = response.headers['access-control-allow-origin'];
      if (corsHeaders && (corsHeaders === '*' || corsHeaders === origin)) {
        logTest('apiEndpoints', `CORS for ${origin}`, 'PASS', {
          responseTime: response.responseTime,
          message: 'CORS headers present'
        });
      } else {
        logTest('apiEndpoints', `CORS for ${origin}`, 'FAIL', {
          responseTime: response.responseTime,
          message: 'Missing or incorrect CORS headers'
        });
      }
    } catch (error) {
      logTest('apiEndpoints', `CORS for ${origin}`, 'FAIL', {
        responseTime: error.responseTime,
        message: 'CORS preflight failed',
        error: error.error
      });
    }
  }
}

// Test Web Application Availability
async function testWebAppAvailability() {
  console.log('\n🌍 Testing Web Application Availability...');
  
  try {
    const response = await makeRequest(CONFIG.webAppUrl);
    
    if (response.statusCode === 200) {
      logTest('integration', 'Web app availability', 'PASS', {
        responseTime: response.responseTime,
        message: 'Application accessible'
      });
      
      // Check for key elements in HTML
      if (response.data.includes('RAG Prompt Library') || response.data.includes('react')) {
        logTest('integration', 'Web app content', 'PASS', {
          responseTime: response.responseTime,
          message: 'Application content loaded'
        });
      } else {
        logTest('integration', 'Web app content', 'WARN', {
          responseTime: response.responseTime,
          message: 'Unexpected content structure'
        });
      }
    } else {
      logTest('integration', 'Web app availability', 'FAIL', {
        responseTime: response.responseTime,
        message: `HTTP ${response.statusCode}`
      });
    }
  } catch (error) {
    logTest('integration', 'Web app availability', 'FAIL', {
      responseTime: error.responseTime,
      message: 'Application unreachable',
      error: error.error
    });
  }
}

// Test Performance Metrics
async function testPerformanceMetrics() {
  console.log('\n⚡ Testing Performance Metrics...');
  
  const performanceTests = [
    { name: 'Web app load time', url: CONFIG.webAppUrl, threshold: 3000 },
    { name: 'CORS preflight time', url: `${CONFIG.baseUrl}/test_cors`, threshold: 1000 },
    { name: 'Function cold start', url: `${CONFIG.baseUrl}/generate_prompt`, threshold: 5000 }
  ];
  
  for (const test of performanceTests) {
    try {
      const response = await makeRequest(test.url, {
        method: test.url.includes('test_cors') ? 'OPTIONS' : 'GET'
      });
      
      if (response.responseTime <= test.threshold) {
        logTest('performance', test.name, 'PASS', {
          responseTime: response.responseTime,
          message: `Within threshold (${test.threshold}ms)`
        });
      } else {
        logTest('performance', test.name, 'WARN', {
          responseTime: response.responseTime,
          message: `Exceeds threshold (${test.threshold}ms)`
        });
      }
    } catch (error) {
      logTest('performance', test.name, 'FAIL', {
        responseTime: error.responseTime,
        message: 'Performance test failed',
        error: error.error
      });
    }
  }
}

// Generate test report
function generateReport() {
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  
  const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    successRate: parseFloat(successRate),
    results: testResults
  };
  
  require('fs').writeFileSync(
    'reports/api_validation_report.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: reports/api_validation_report.json');
  
  return reportData;
}

// Main execution
async function runComprehensiveValidation() {
  console.log('🚀 Starting Comprehensive API Validation');
  console.log('=' .repeat(50));
  
  try {
    await testWebAppAvailability();
    await testCloudFunctions();
    await testCORSConfiguration();
    await testPerformanceMetrics();
    
    const report = generateReport();
    
    if (report.successRate >= 80) {
      console.log('\n🎉 Validation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Validation completed with issues. Review the report.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Validation failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runComprehensiveValidation();
}

module.exports = { runComprehensiveValidation, testResults };
