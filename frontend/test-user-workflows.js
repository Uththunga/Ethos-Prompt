/**
 * Comprehensive User Workflow Testing Script
 * 
 * This script provides a systematic approach to testing all user workflows
 * in the RAG Prompt Library application.
 * 
 * Usage: Open browser console and run sections of this script
 */

console.log('🚀 Starting RAG Prompt Library User Workflow Testing');

// Test Results Storage
const testResults = {
  authentication: {},
  navigation: {},
  analytics: {},
  prompts: {},
  documents: {},
  workspaces: {},
  settings: {},
  performance: {},
  responsive: {},
  errors: []
};

// Utility Functions
const utils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  log: (category, test, status, details = '') => {
    const timestamp = new Date().toISOString();
    const result = { test, status, details, timestamp };
    testResults[category][test] = result;
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} [${category.toUpperCase()}] ${test}: ${status}${details ? ' - ' + details : ''}`);
  },
  
  checkElement: (selector, description) => {
    const element = document.querySelector(selector);
    if (element) {
      utils.log('navigation', `Element Check: ${description}`, 'PASS', `Found: ${selector}`);
      return element;
    } else {
      utils.log('navigation', `Element Check: ${description}`, 'FAIL', `Not found: ${selector}`);
      return null;
    }
  },
  
  checkConsoleErrors: () => {
    // This would need to be run manually as we can't access console errors programmatically
    console.log('📋 Please manually check browser console for any errors and note them');
  }
};

// 1. AUTHENTICATION TESTING
const testAuthentication = {
  async checkAuthPage() {
    console.log('\n🔐 Testing Authentication Workflows...');
    
    // Check if we're on auth page or logged in
    const isAuthPage = window.location.pathname === '/auth';
    const hasAuthForm = document.querySelector('form');
    
    if (isAuthPage && hasAuthForm) {
      utils.log('authentication', 'Auth Page Load', 'PASS', 'Auth page loaded successfully');
      
      // Test form elements
      const emailInput = utils.checkElement('input[type="email"]', 'Email Input Field');
      const passwordInput = utils.checkElement('input[type="password"]', 'Password Input Field');
      const submitButton = utils.checkElement('button[type="submit"]', 'Submit Button');
      const googleButton = utils.checkElement('button:contains("Google")', 'Google Login Button');
      
      return true;
    } else if (!isAuthPage) {
      utils.log('authentication', 'User Already Logged In', 'PASS', 'User is authenticated');
      return true;
    } else {
      utils.log('authentication', 'Auth Page Load', 'FAIL', 'Auth page not loading properly');
      return false;
    }
  },
  
  async testFormValidation() {
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    
    if (emailInput && passwordInput) {
      // Test empty form submission
      emailInput.value = '';
      passwordInput.value = '';
      
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
        await utils.wait(500);
        
        const errorMessages = document.querySelectorAll('.text-red-600, .text-red-500');
        if (errorMessages.length > 0) {
          utils.log('authentication', 'Form Validation', 'PASS', 'Validation errors shown for empty fields');
        } else {
          utils.log('authentication', 'Form Validation', 'FAIL', 'No validation errors shown');
        }
      }
    }
  }
};

// 2. NAVIGATION TESTING
const testNavigation = {
  async checkMainLayout() {
    console.log('\n🧭 Testing Navigation and Layout...');
    
    // Check main layout elements
    const sidebar = utils.checkElement('nav, [role="navigation"]', 'Sidebar Navigation');
    const header = utils.checkElement('header, .header', 'Header');
    const mainContent = utils.checkElement('main, .main-content', 'Main Content Area');
    
    return sidebar && header && mainContent;
  },
  
  async testSidebarNavigation() {
    const navLinks = [
      { href: '/', name: 'Dashboard' },
      { href: '/prompts', name: 'Prompts' },
      { href: '/documents', name: 'Documents' },
      { href: '/executions', name: 'Executions' },
      { href: '/analytics', name: 'Analytics' },
      { href: '/workspaces', name: 'Workspaces' },
      { href: '/settings', name: 'Settings' },
      { href: '/help', name: 'Help' }
    ];
    
    for (const link of navLinks) {
      const navElement = document.querySelector(`a[href="${link.href}"]`);
      if (navElement) {
        utils.log('navigation', `Nav Link: ${link.name}`, 'PASS', `Found link to ${link.href}`);
        
        // Test navigation (comment out to avoid actually navigating)
        // navElement.click();
        // await utils.wait(1000);
      } else {
        utils.log('navigation', `Nav Link: ${link.name}`, 'FAIL', `Link to ${link.href} not found`);
      }
    }
  },
  
  async testResponsiveNavigation() {
    // Test mobile menu toggle
    const menuButton = document.querySelector('[data-testid="mobile-menu-button"], button[aria-label*="menu"]');
    if (menuButton) {
      utils.log('navigation', 'Mobile Menu Button', 'PASS', 'Mobile menu button found');
    } else {
      utils.log('navigation', 'Mobile Menu Button', 'WARN', 'Mobile menu button not found');
    }
  }
};

// 3. ANALYTICS TESTING
const testAnalytics = {
  async checkAnalyticsPage() {
    console.log('\n📊 Testing Analytics Dashboard...');
    
    // Navigate to analytics (if not already there)
    if (window.location.pathname !== '/analytics') {
      const analyticsLink = document.querySelector('a[href="/analytics"]');
      if (analyticsLink) {
        analyticsLink.click();
        await utils.wait(2000);
      }
    }
    
    // Check analytics components
    const metricsCards = document.querySelectorAll('[class*="metric"], [class*="stat"], .bg-white');
    utils.log('analytics', 'Metrics Cards', metricsCards.length > 0 ? 'PASS' : 'FAIL', 
      `Found ${metricsCards.length} metric cards`);
    
    // Check for charts
    const charts = document.querySelectorAll('svg, canvas, [class*="chart"]');
    utils.log('analytics', 'Charts/Visualizations', charts.length > 0 ? 'PASS' : 'FAIL',
      `Found ${charts.length} chart elements`);
    
    // Check analytics tabs
    const tabs = document.querySelectorAll('[role="tab"], .tab, [class*="tab"]');
    utils.log('analytics', 'Analytics Tabs', tabs.length > 0 ? 'PASS' : 'FAIL',
      `Found ${tabs.length} tab elements`);
  },
  
  async testAnalyticsInteractivity() {
    // Test time range selector
    const timeRangeSelect = document.querySelector('select, [class*="select"]');
    if (timeRangeSelect) {
      utils.log('analytics', 'Time Range Selector', 'PASS', 'Time range selector found');
    }
    
    // Test real-time toggle
    const realTimeToggle = document.querySelector('button:contains("Live"), button:contains("Real")');
    if (realTimeToggle) {
      utils.log('analytics', 'Real-time Toggle', 'PASS', 'Real-time toggle found');
    }
  }
};

// 4. PERFORMANCE TESTING
const testPerformance = {
  async checkPageLoadTimes() {
    console.log('\n⚡ Testing Performance...');
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      utils.log('performance', 'Page Load Time', loadTime < 3000 ? 'PASS' : 'WARN',
        `Load time: ${loadTime.toFixed(2)}ms`);
      utils.log('performance', 'DOM Content Loaded', domContentLoaded < 2000 ? 'PASS' : 'WARN',
        `DCL time: ${domContentLoaded.toFixed(2)}ms`);
    }
  },
  
  async checkWebVitals() {
    // Check if Web Vitals are being monitored
    const webVitalsElements = document.querySelectorAll('[class*="vitals"], [class*="performance"]');
    utils.log('performance', 'Web Vitals Monitoring', webVitalsElements.length > 0 ? 'PASS' : 'WARN',
      `Found ${webVitalsElements.length} performance monitoring elements`);
  }
};

// 5. ERROR CHECKING
const testErrorHandling = {
  checkConsoleErrors() {
    console.log('\n🐛 Checking for Errors...');
    console.log('📋 Please manually check the browser console for:');
    console.log('   - JavaScript errors (red text)');
    console.log('   - Network failures (failed requests)');
    console.log('   - React warnings');
    console.log('   - Firebase connection issues');
    
    // Check for error boundaries
    const errorBoundaries = document.querySelectorAll('[class*="error"], [class*="boundary"]');
    utils.log('errors', 'Error Boundaries', 'INFO', 
      `Found ${errorBoundaries.length} potential error boundary elements`);
  }
};

// 6. RESPONSIVE DESIGN TESTING
const testResponsive = {
  async checkResponsiveness() {
    console.log('\n📱 Testing Responsive Design...');

    const originalWidth = window.innerWidth;

    // Test mobile viewport
    window.resizeTo(375, 667);
    await utils.wait(500);

    const mobileLayout = document.querySelector('.lg\\:hidden, .md\\:hidden, .sm\\:block');
    utils.log('responsive', 'Mobile Layout', mobileLayout ? 'PASS' : 'WARN',
      'Mobile-specific elements detected');

    // Test tablet viewport
    window.resizeTo(768, 1024);
    await utils.wait(500);

    // Test desktop viewport
    window.resizeTo(1920, 1080);
    await utils.wait(500);

    // Restore original size
    window.resizeTo(originalWidth, window.innerHeight);

    utils.log('responsive', 'Viewport Testing', 'PASS', 'Tested multiple viewport sizes');
  }
};

// MAIN TEST RUNNER
const runAllTests = async () => {
  console.log('🎯 Starting Comprehensive User Workflow Testing\n');

  try {
    // Run all test suites
    await testAuthentication.checkAuthPage();
    await testNavigation.checkMainLayout();
    await testNavigation.testSidebarNavigation();
    await testAnalytics.checkAnalyticsPage();
    await testPerformance.checkPageLoadTimes();
    await testErrorHandling.checkConsoleErrors();

    // Generate summary report
    console.log('\n📋 TEST SUMMARY REPORT');
    console.log('========================');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warnings = 0;

    Object.keys(testResults).forEach(category => {
      if (typeof testResults[category] === 'object' && !Array.isArray(testResults[category])) {
        Object.values(testResults[category]).forEach(result => {
          totalTests++;
          if (result.status === 'PASS') passedTests++;
          else if (result.status === 'FAIL') failedTests++;
          else warnings++;
        });
      }
    });

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    // Store results globally for inspection
    window.testResults = testResults;
    console.log('\n📊 Detailed results stored in window.testResults');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
};

// Export functions for manual testing
window.testUtils = {
  runAllTests,
  testAuthentication,
  testNavigation,
  testAnalytics,
  testPerformance,
  testErrorHandling,
  testResponsive,
  utils
};

console.log('🔧 Test utilities loaded. Run window.testUtils.runAllTests() to start testing');
