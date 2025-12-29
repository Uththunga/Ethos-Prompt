/**
 * K6 Load Testing Script for RAG Prompt Library
 * Tests system capacity with 1000+ concurrent users
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    // Ramp up to 100 users over 2 minutes
    { duration: '2m', target: 100 },
    // Stay at 100 users for 3 minutes
    { duration: '3m', target: 100 },
    // Ramp up to 500 users over 3 minutes
    { duration: '3m', target: 500 },
    // Stay at 500 users for 5 minutes
    { duration: '5m', target: 500 },
    // Ramp up to 1000 users over 2 minutes
    { duration: '2m', target: 1000 },
    // Stay at 1000 users for 5 minutes (peak load)
    { duration: '5m', target: 1000 },
    // Ramp down to 500 users over 2 minutes
    { duration: '2m', target: 500 },
    // Ramp down to 0 users over 3 minutes
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    // 95% of requests should complete within 200ms
    'http_req_duration': ['p(95)<200'],
    // Error rate should be less than 0.5%
    'errors': ['rate<0.005'],
    // 99% of requests should succeed
    'http_req_failed': ['rate<0.01'],
    // Response time trend
    'response_time': ['p(95)<200'],
  },
};

// Configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

// Test data
const TEST_PROMPTS = [
  {
    description: 'Create a marketing email for a new product launch',
    category: 'marketing',
    variables: ['product_name', 'target_audience']
  },
  {
    description: 'Write a technical documentation for API endpoints',
    category: 'technical',
    variables: ['api_name', 'version']
  },
  {
    description: 'Generate a social media post for brand awareness',
    category: 'social_media',
    variables: ['brand_name', 'message']
  }
];

const EXECUTION_DATA = [
  {
    promptId: 'test-prompt-1',
    variables: {
      product_name: 'Amazing Widget',
      target_audience: 'tech enthusiasts'
    }
  },
  {
    promptId: 'test-prompt-2',
    variables: {
      api_name: 'User Management API',
      version: 'v2.0'
    }
  },
  {
    promptId: 'test-prompt-3',
    variables: {
      brand_name: 'TechCorp',
      message: 'Innovation at its finest'
    }
  }
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function makeRequest(method, url, payload = null, headers = {}) {
  const defaultHeaders = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const options = {
    headers: { ...defaultHeaders, ...headers },
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  const startTime = new Date().getTime();
  const response = http.request(method, url, payload ? options.body : null, options);
  const endTime = new Date().getTime();
  
  // Record custom metrics
  responseTime.add(endTime - startTime);
  requestCount.add(1);
  errorRate.add(!response || response.status >= 400);

  return response;
}

// Test scenarios
export function healthCheck() {
  const response = makeRequest('GET', `${BASE_URL}/health`);
  
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}

export function listPrompts() {
  const response = makeRequest('GET', `${BASE_URL}/api/prompts`);
  
  check(response, {
    'list prompts status is 200': (r) => r.status === 200,
    'list prompts has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) || (data && Array.isArray(data.prompts));
      } catch {
        return false;
      }
    },
    'list prompts response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(Math.random() * 2 + 1);
}

export function generatePrompt() {
  const testData = getRandomElement(TEST_PROMPTS);
  const response = makeRequest('POST', `${BASE_URL}/api/generate-prompt`, testData);
  
  check(response, {
    'generate prompt status is 200': (r) => r.status === 200,
    'generate prompt has content': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && (data.generatedPrompt || data.content);
      } catch {
        return false;
      }
    },
    'generate prompt response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(Math.random() * 3 + 2);
}

export function executePrompt() {
  const testData = getRandomElement(EXECUTION_DATA);
  const response = makeRequest('POST', `${BASE_URL}/api/execute-prompt`, testData);
  
  check(response, {
    'execute prompt status is 200': (r) => r.status === 200,
    'execute prompt has result': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && (data.result || data.response);
      } catch {
        return false;
      }
    },
    'execute prompt response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 4 + 3);
}

export function uploadDocument() {
  // Simulate document upload
  const mockDocument = {
    name: `test-document-${Math.random().toString(36).substr(2, 9)}.pdf`,
    content: 'This is a test document for RAG processing.',
    type: 'application/pdf'
  };

  const response = makeRequest('POST', `${BASE_URL}/api/documents/upload`, mockDocument);
  
  check(response, {
    'upload document status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'upload document response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 5 + 2);
}

// Main test function - simulates realistic user behavior
export default function() {
  // Simulate user session with weighted actions
  const actions = [
    { func: healthCheck, weight: 1 },
    { func: listPrompts, weight: 5 },
    { func: generatePrompt, weight: 3 },
    { func: executePrompt, weight: 3 },
    { func: uploadDocument, weight: 1 }
  ];

  // Select action based on weights
  const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const action of actions) {
    random -= action.weight;
    if (random <= 0) {
      action.func();
      break;
    }
  }
}

// Setup function - runs once per VU at the beginning
export function setup() {
  console.log('🚀 Starting load test...');
  console.log(`Target: ${BASE_URL}`);
  console.log('Test stages:');
  console.log('  - Ramp up to 100 users (2m)');
  console.log('  - Maintain 100 users (3m)');
  console.log('  - Ramp up to 500 users (3m)');
  console.log('  - Maintain 500 users (5m)');
  console.log('  - Ramp up to 1000 users (2m)');
  console.log('  - Maintain 1000 users (5m) - PEAK LOAD');
  console.log('  - Ramp down to 500 users (2m)');
  console.log('  - Ramp down to 0 users (3m)');
  console.log('');
  
  // Verify API is accessible
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.error(`❌ API health check failed: ${healthResponse.status}`);
    console.error('Make sure the API server is running and accessible');
  } else {
    console.log('✅ API health check passed');
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('');
  console.log('🏁 Load test completed!');
  console.log('📊 Check the k6 summary above for detailed metrics');
  console.log('');
  console.log('Key metrics to review:');
  console.log('  - http_req_duration p(95): Should be < 200ms');
  console.log('  - http_req_failed rate: Should be < 1%');
  console.log('  - errors rate: Should be < 0.5%');
  console.log('  - Peak concurrent users: 1000');
}
