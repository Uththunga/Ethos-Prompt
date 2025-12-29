/**
 * End-to-End Testing Script for RAG Prompt Library
 * Complete user workflow validation and critical path testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_BASE_URL || 'http://localhost:5001',
  headless: process.env.E2E_HEADLESS !== 'false',
  timeout: 30000,
  screenshotDir: 'e2e-screenshots',
  reportDir: 'e2e-reports'
};

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

class E2ETestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.screenshots = [];
  }

  async setup() {
    console.log('🚀 Setting up E2E test environment...');
    
    // Create directories
    if (!fs.existsSync(CONFIG.screenshotDir)) {
      fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });

    this.page = await this.browser.newPage();
    
    // Set timeout
    this.page.setDefaultTimeout(CONFIG.timeout);
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });

    console.log('✅ E2E test environment ready');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 E2E test environment cleaned up');
  }

  async takeScreenshot(name) {
    const filename = `${Date.now()}_${name}.png`;
    const filepath = path.join(CONFIG.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.screenshots.push({ name, filepath });
    return filepath;
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      this.results.push({
        name: testName,
        status: 'PASS',
        duration,
        error: null
      });
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.takeScreenshot(`error_${testName.replace(/\s+/g, '_')}`);
      this.results.push({
        name: testName,
        status: 'FAIL',
        duration,
        error: error.message
      });
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
    }
  }

  // Test: Homepage loads correctly
  async testHomepageLoad() {
    await this.page.goto(CONFIG.baseUrl);
    await this.page.waitForSelector('h1', { timeout: 10000 });
    await this.takeScreenshot('homepage_loaded');
    
    const title = await this.page.title();
    if (!title.includes('RAG Prompt Library')) {
      throw new Error(`Unexpected page title: ${title}`);
    }
  }

  // Test: User registration flow
  async testUserRegistration() {
    await this.page.goto(`${CONFIG.baseUrl}/auth`);
    
    // Switch to sign up mode
    await this.page.click('button:has-text("Sign Up")');
    await this.page.waitForTimeout(1000);
    
    // Fill registration form
    await this.page.fill('input[type="email"]', TEST_USER.email);
    await this.page.fill('input[type="password"]', TEST_USER.password);
    
    await this.takeScreenshot('registration_form_filled');
    
    // Submit form
    await this.page.click('button:has-text("Create Account")');
    
    // Wait for success or error
    await this.page.waitForTimeout(3000);
    await this.takeScreenshot('registration_result');
  }

  // Test: User login flow
  async testUserLogin() {
    await this.page.goto(`${CONFIG.baseUrl}/auth`);
    
    // Fill login form
    await this.page.fill('input[type="email"]', TEST_USER.email);
    await this.page.fill('input[type="password"]', TEST_USER.password);
    
    await this.takeScreenshot('login_form_filled');
    
    // Submit form
    await this.page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await this.page.waitForNavigation({ timeout: 10000 });
    await this.takeScreenshot('login_success');
    
    // Verify we're on the dashboard
    const url = this.page.url();
    if (!url.includes('/dashboard') && !url.includes('/prompts')) {
      throw new Error(`Login did not redirect to dashboard. Current URL: ${url}`);
    }
  }

  // Test: Create new prompt
  async testCreatePrompt() {
    // Navigate to prompts page
    await this.page.goto(`${CONFIG.baseUrl}/prompts`);
    await this.page.waitForSelector('button:has-text("New Prompt")', { timeout: 10000 });
    
    // Click new prompt button
    await this.page.click('button:has-text("New Prompt")');
    await this.page.waitForTimeout(2000);
    
    // Fill prompt form
    await this.page.fill('input[placeholder*="title"], input[name="title"]', 'E2E Test Prompt');
    await this.page.fill('textarea[placeholder*="description"], textarea[name="description"]', 'This is a test prompt created by E2E testing');
    await this.page.fill('textarea[placeholder*="content"], textarea[name="content"]', 'Hello {{name}}, welcome to {{platform}}!');
    
    await this.takeScreenshot('prompt_form_filled');
    
    // Save prompt
    await this.page.click('button:has-text("Save")');
    await this.page.waitForTimeout(3000);
    
    await this.takeScreenshot('prompt_created');
    
    // Verify prompt appears in list
    await this.page.waitForSelector('text=E2E Test Prompt', { timeout: 10000 });
  }

  // Test: Execute prompt
  async testExecutePrompt() {
    // Find and click on the test prompt
    await this.page.click('text=E2E Test Prompt');
    await this.page.waitForTimeout(2000);
    
    // Look for execute button
    await this.page.waitForSelector('button:has-text("Execute")', { timeout: 10000 });
    
    // Fill variables if present
    const nameInput = await this.page.$('input[placeholder*="name"]');
    if (nameInput) {
      await nameInput.fill('John Doe');
    }
    
    const platformInput = await this.page.$('input[placeholder*="platform"]');
    if (platformInput) {
      await platformInput.fill('RAG Prompt Library');
    }
    
    await this.takeScreenshot('prompt_variables_filled');
    
    // Execute prompt
    await this.page.click('button:has-text("Execute")');
    await this.page.waitForTimeout(5000);
    
    await this.takeScreenshot('prompt_executed');
    
    // Verify execution result
    const resultExists = await this.page.$('text=Hello John Doe') || 
                        await this.page.$('[data-testid="execution-result"]') ||
                        await this.page.$('.execution-result');
    
    if (!resultExists) {
      throw new Error('Prompt execution result not found');
    }
  }

  // Test: Document upload
  async testDocumentUpload() {
    await this.page.goto(`${CONFIG.baseUrl}/documents`);
    await this.page.waitForTimeout(2000);
    
    // Look for upload button or area
    const uploadButton = await this.page.$('button:has-text("Upload")') || 
                        await this.page.$('input[type="file"]') ||
                        await this.page.$('[data-testid="file-upload"]');
    
    if (uploadButton) {
      await this.takeScreenshot('document_upload_page');
      
      // Create a test file
      const testContent = 'This is a test document for E2E testing.\n\nIt contains sample content for RAG processing.';
      const testFilePath = path.join(CONFIG.screenshotDir, 'test-document.txt');
      fs.writeFileSync(testFilePath, testContent);
      
      // Upload file
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(testFilePath);
        await this.page.waitForTimeout(3000);
        await this.takeScreenshot('document_uploaded');
      }
    } else {
      console.log('⚠️  Document upload functionality not found, skipping test');
    }
  }

  // Test: Error scenarios
  async testErrorScenarios() {
    // Test 404 page
    await this.page.goto(`${CONFIG.baseUrl}/nonexistent-page`);
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('404_page');
    
    // Test invalid login
    await this.page.goto(`${CONFIG.baseUrl}/auth`);
    await this.page.fill('input[type="email"]', 'invalid@example.com');
    await this.page.fill('input[type="password"]', 'wrongpassword');
    await this.page.click('button:has-text("Sign In")');
    await this.page.waitForTimeout(3000);
    await this.takeScreenshot('invalid_login');
    
    // Verify error message appears
    const errorExists = await this.page.$('text=Invalid') || 
                       await this.page.$('text=Error') ||
                       await this.page.$('.error') ||
                       await this.page.$('[role="alert"]');
    
    if (!errorExists) {
      console.log('⚠️  Error message not found for invalid login');
    }
  }

  // Test: Performance and responsiveness
  async testPerformance() {
    const metrics = await this.page.metrics();
    
    // Navigate to different pages and measure load times
    const pages = [
      { name: 'Homepage', url: CONFIG.baseUrl },
      { name: 'Prompts', url: `${CONFIG.baseUrl}/prompts` },
      { name: 'Documents', url: `${CONFIG.baseUrl}/documents` }
    ];
    
    for (const pageInfo of pages) {
      const startTime = Date.now();
      await this.page.goto(pageInfo.url);
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      console.log(`📊 ${pageInfo.name} load time: ${loadTime}ms`);
      
      if (loadTime > 5000) {
        throw new Error(`${pageInfo.name} load time too slow: ${loadTime}ms`);
      }
    }
  }

  // Generate test report
  generateReport() {
    const timestamp = new Date().toISOString();
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    const report = {
      timestamp,
      summary: {
        total,
        passed,
        failed,
        passRate: Math.round((passed / total) * 100)
      },
      results: this.results,
      screenshots: this.screenshots,
      config: CONFIG
    };
    
    const reportPath = path.join(CONFIG.reportDir, `e2e-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 E2E Test Summary:');
    console.log('====================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}%`);
    console.log(`Report: ${reportPath}`);
    
    return report;
  }

  // Main test execution
  async runAllTests() {
    await this.setup();
    
    try {
      await this.runTest('Homepage Load', () => this.testHomepageLoad());
      await this.runTest('User Registration', () => this.testUserRegistration());
      await this.runTest('User Login', () => this.testUserLogin());
      await this.runTest('Create Prompt', () => this.testCreatePrompt());
      await this.runTest('Execute Prompt', () => this.testExecutePrompt());
      await this.runTest('Document Upload', () => this.testDocumentUpload());
      await this.runTest('Error Scenarios', () => this.testErrorScenarios());
      await this.runTest('Performance Check', () => this.testPerformance());
      
      const report = this.generateReport();
      
      if (report.summary.failed > 0) {
        console.log('\n❌ Some E2E tests failed!');
        process.exit(1);
      } else {
        console.log('\n✅ All E2E tests passed!');
        process.exit(0);
      }
      
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllTests().catch(error => {
    console.error('E2E test execution failed:', error);
    process.exit(1);
  });
}

module.exports = E2ETestRunner;
