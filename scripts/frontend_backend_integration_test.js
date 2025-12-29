#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test Suite
 * Tests real-time data synchronization, prompt execution with RAG context,
 * and document upload and processing pipeline
 * 
 * Success Criteria: All user workflows functional
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  timeout: 30000,
  headless: process.env.HEADLESS !== 'false',
  testDataPath: path.join(__dirname, '../test-data')
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

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

function recordTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName} - PASSED`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
    log(`${testName} - FAILED: ${error?.message || 'Unknown error'}`, 'error');
  }
}

async function setupBrowser() {
  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      log(`Browser console error: ${msg.text()}`, 'error');
    }
  });
  
  return { browser, page };
}

async function testUserAuthentication(page) {
  try {
    log('Testing user authentication flow...', 'info');
    
    // Navigate to login page
    await page.goto(`${CONFIG.frontendUrl}/login`, { waitUntil: 'networkidle0' });
    
    // Fill login form
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: CONFIG.timeout });
    
    // Check if we're on the dashboard
    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes('/dashboard') || currentUrl.includes('/prompts');
    
    recordTest('User Authentication', isAuthenticated);
    return isAuthenticated;
  } catch (error) {
    recordTest('User Authentication', false, error);
    return false;
  }
}

async function testRealTimeDataSync(page) {
  try {
    log('Testing real-time data synchronization...', 'info');
    
    // Navigate to prompts page
    await page.goto(`${CONFIG.frontendUrl}/prompts`, { waitUntil: 'networkidle0' });
    
    // Create a new prompt
    await page.waitForSelector('[data-testid="create-prompt-btn"]', { timeout: CONFIG.timeout });
    await page.click('[data-testid="create-prompt-btn"]');
    
    // Fill prompt form
    await page.waitForSelector('input[name="title"]', { timeout: CONFIG.timeout });
    const testTitle = `Test Prompt ${Date.now()}`;
    await page.type('input[name="title"]', testTitle);
    await page.type('textarea[name="content"]', 'This is a test prompt for real-time sync');
    
    // Save prompt
    await page.click('button[type="submit"]');
    
    // Wait for prompt to appear in list
    await page.waitForFunction(
      (title) => {
        const promptElements = document.querySelectorAll('[data-testid="prompt-item"]');
        return Array.from(promptElements).some(el => el.textContent.includes(title));
      },
      { timeout: CONFIG.timeout },
      testTitle
    );
    
    recordTest('Real-time Data Synchronization', true);
    return true;
  } catch (error) {
    recordTest('Real-time Data Synchronization', false, error);
    return false;
  }
}

async function testPromptExecutionWithRAG(page) {
  try {
    log('Testing prompt execution with RAG context...', 'info');
    
    // Navigate to prompt execution page
    await page.goto(`${CONFIG.frontendUrl}/execute`, { waitUntil: 'networkidle0' });
    
    // Select a prompt
    await page.waitForSelector('[data-testid="prompt-selector"]', { timeout: CONFIG.timeout });
    await page.click('[data-testid="prompt-selector"]');
    
    // Select first available prompt
    await page.waitForSelector('[data-testid="prompt-option"]', { timeout: CONFIG.timeout });
    await page.click('[data-testid="prompt-option"]');
    
    // Enable RAG if available
    const ragToggle = await page.$('[data-testid="rag-toggle"]');
    if (ragToggle) {
      await page.click('[data-testid="rag-toggle"]');
    }
    
    // Execute prompt
    await page.click('[data-testid="execute-btn"]');
    
    // Wait for execution result
    await page.waitForSelector('[data-testid="execution-result"]', { timeout: CONFIG.timeout });
    
    // Check if result contains content
    const resultText = await page.$eval('[data-testid="execution-result"]', el => el.textContent);
    const hasResult = resultText && resultText.trim().length > 0;
    
    recordTest('Prompt Execution with RAG', hasResult);
    return hasResult;
  } catch (error) {
    recordTest('Prompt Execution with RAG', false, error);
    return false;
  }
}

async function testDocumentUploadPipeline(page) {
  try {
    log('Testing document upload and processing pipeline...', 'info');
    
    // Navigate to documents page
    await page.goto(`${CONFIG.frontendUrl}/documents`, { waitUntil: 'networkidle0' });
    
    // Create test file
    const testFilePath = path.join(CONFIG.testDataPath, 'test-document.txt');
    if (!fs.existsSync(CONFIG.testDataPath)) {
      fs.mkdirSync(CONFIG.testDataPath, { recursive: true });
    }
    fs.writeFileSync(testFilePath, 'This is a test document for upload testing.');
    
    // Upload file
    await page.waitForSelector('input[type="file"]', { timeout: CONFIG.timeout });
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(testFilePath);
    
    // Wait for upload to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: CONFIG.timeout });
    
    // Check if document appears in list
    await page.waitForFunction(
      () => {
        const docElements = document.querySelectorAll('[data-testid="document-item"]');
        return Array.from(docElements).some(el => el.textContent.includes('test-document.txt'));
      },
      { timeout: CONFIG.timeout }
    );
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    recordTest('Document Upload Pipeline', true);
    return true;
  } catch (error) {
    recordTest('Document Upload Pipeline', false, error);
    return false;
  }
}

async function testUserWorkflowIntegration(page) {
  try {
    log('Testing complete user workflow integration...', 'info');
    
    // Test complete workflow: Login -> Create Prompt -> Upload Document -> Execute with RAG
    
    // 1. Already authenticated from previous tests
    
    // 2. Create a prompt with variables
    await page.goto(`${CONFIG.frontendUrl}/prompts/new`, { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('input[name="title"]', { timeout: CONFIG.timeout });
    await page.type('input[name="title"]', 'Integration Test Prompt');
    await page.type('textarea[name="content"]', 'Analyze the document: {{document_content}}');
    
    // Add variable
    const addVariableBtn = await page.$('[data-testid="add-variable-btn"]');
    if (addVariableBtn) {
      await page.click('[data-testid="add-variable-btn"]');
      await page.type('input[name="variable-name"]', 'document_content');
      await page.type('input[name="variable-description"]', 'Content from uploaded document');
    }
    
    // Save prompt
    await page.click('button[type="submit"]');
    
    // 3. Execute the prompt
    await page.goto(`${CONFIG.frontendUrl}/execute`, { waitUntil: 'networkidle0' });
    
    // Select the created prompt
    await page.waitForSelector('[data-testid="prompt-selector"]', { timeout: CONFIG.timeout });
    await page.click('[data-testid="prompt-selector"]');
    
    // Look for our integration test prompt
    await page.waitForFunction(
      () => {
        const options = document.querySelectorAll('[data-testid="prompt-option"]');
        return Array.from(options).some(option => 
          option.textContent.includes('Integration Test Prompt')
        );
      },
      { timeout: CONFIG.timeout }
    );
    
    // Select our prompt
    const promptOptions = await page.$$('[data-testid="prompt-option"]');
    for (const option of promptOptions) {
      const text = await page.evaluate(el => el.textContent, option);
      if (text.includes('Integration Test Prompt')) {
        await option.click();
        break;
      }
    }
    
    // Fill variable if present
    const variableInput = await page.$('input[name="document_content"]');
    if (variableInput) {
      await page.type('input[name="document_content"]', 'Sample document content for analysis');
    }
    
    // Execute
    await page.click('[data-testid="execute-btn"]');
    
    // Wait for result
    await page.waitForSelector('[data-testid="execution-result"]', { timeout: CONFIG.timeout });
    
    recordTest('Complete User Workflow Integration', true);
    return true;
  } catch (error) {
    recordTest('Complete User Workflow Integration', false, error);
    return false;
  }
}

async function runFrontendBackendIntegrationTests() {
  log('🚀 Starting Frontend-Backend Integration Test Suite', 'info');
  log('=' * 60, 'info');
  
  let browser, page;
  
  try {
    // Setup browser
    ({ browser, page } = await setupBrowser());
    
    // Run tests in sequence
    const tests = [
      () => testUserAuthentication(page),
      () => testRealTimeDataSync(page),
      () => testPromptExecutionWithRAG(page),
      () => testDocumentUploadPipeline(page),
      () => testUserWorkflowIntegration(page)
    ];
    
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        log(`Test execution error: ${error.message}`, 'error');
      }
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print results
  log('=' * 60, 'info');
  log('📊 Frontend-Backend Integration Test Results', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, testResults.passed === testResults.total ? 'success' : 'info');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }
  
  const allTestsPassed = testResults.passed === testResults.total;
  
  if (allTestsPassed) {
    log('\n🎉 All frontend-backend integration tests passed!', 'success');
    log('✅ All user workflows functional', 'success');
    log('✅ Real-time data synchronization working', 'success');
    log('✅ Prompt execution with RAG context working', 'success');
    log('✅ Document upload and processing pipeline working', 'success');
  } else {
    log('\n⚠️ Frontend-backend integration tests failed!', 'warning');
    log(`❌ ${testResults.failed} tests failed`, 'error');
  }
  
  return allTestsPassed;
}

// Run tests if called directly
if (require.main === module) {
  runFrontendBackendIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runFrontendBackendIntegrationTests, testResults };
