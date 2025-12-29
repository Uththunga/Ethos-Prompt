/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Performance Testing Script
 * Tests API response times and validates performance targets
 */

import { apiTracker, getPerformanceSummary } from '../utils/monitoring';

interface PerformanceTest {
  name: string;
  endpoint: string;
  method: string;
  expectedMaxTime: number; // in milliseconds
  testFunction: () => Promise<any>;
}

class PerformanceTester {
  private tests: PerformanceTest[] = [];
  private results: Array<{
    test: string;
    responseTime: number;
    passed: boolean;
    error?: string;
  }> = [];

  addTest(test: PerformanceTest): void {
    this.tests.push(test);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Performance Tests...');
    console.log(`Running ${this.tests.length} tests`);

    for (const test of this.tests) {
      await this.runSingleTest(test);
    }

    this.generateReport();
  }

  private async runSingleTest(test: PerformanceTest): Promise<void> {
    console.log(`\n🧪 Testing: ${test.name}`);

    const startTime = performance.now();
    let error: string | undefined;

    try {
      await test.testFunction();
    } catch (err: any) {
      error = err.message;
      console.error(`❌ Test failed: ${err.message}`);
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const passed = !error && responseTime <= test.expectedMaxTime;

    this.results.push({
      test: test.name,
      responseTime,
      passed,
      error
    });

    // Track in monitoring system
    apiTracker.trackAPICall(
      test.endpoint,
      test.method,
      startTime,
      endTime,
      error ? 500 : 200,
      { testName: test.name }
    );

    console.log(`⏱️  Response time: ${responseTime.toFixed(2)}ms`);
    console.log(`🎯 Target: ${test.expectedMaxTime}ms`);
    console.log(`${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);
  }

  private generateReport(): void {
    console.log('\n📊 PERFORMANCE TEST REPORT');
    console.log('=' .repeat(50));

    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const passRate = (passedTests / totalTests) * 100;

    console.log(`\n📈 Summary:`);
    console.log(`   Tests Passed: ${passedTests}/${totalTests} (${passRate.toFixed(1)}%)`);

    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);

    const maxResponseTime = Math.max(...this.results.map(r => r.responseTime));
    console.log(`   Max Response Time: ${maxResponseTime.toFixed(2)}ms`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${result.test}: ${result.responseTime.toFixed(2)}ms`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Overall performance summary
    const summary = getPerformanceSummary();
    console.log(`\n🔍 Overall API Performance:`);
    console.log(`   Average Response Time: ${summary.apiMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`   P95 Response Time: ${summary.apiMetrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   Success Rate: ${summary.apiMetrics.successRate.toFixed(1)}%`);
    console.log(`   Total API Calls: ${summary.apiMetrics.totalCalls}`);

    // Performance targets validation
    console.log(`\n🎯 Performance Targets:`);
    console.log(`   P95 < 200ms: ${summary.apiMetrics.p95ResponseTime < 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Success Rate > 99%: ${summary.apiMetrics.successRate > 99 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Average < 100ms: ${summary.apiMetrics.averageResponseTime < 100 ? '✅ PASS' : '❌ FAIL'}`);
  }

  getResults() {
    return this.results;
  }
}

// Mock API functions for testing
const mockAPIFunctions = {
  async fetchPrompts(): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    return { prompts: [] };
  },

  async createPrompt(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
    return { id: 'test-prompt' };
  },

  async generatePrompt(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
    return { generatedPrompt: 'Test prompt' };
  },

  async fetchAnalytics(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    return { analytics: {} };
  },

  async uploadDocument(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
    return { documentId: 'test-doc' };
  }
};

// Create and configure performance tester
export const performanceTester = new PerformanceTester();

// Add standard performance tests
performanceTester.addTest({
  name: 'Fetch Prompts List',
  endpoint: '/api/prompts',
  method: 'GET',
  expectedMaxTime: 200,
  testFunction: mockAPIFunctions.fetchPrompts
});

performanceTester.addTest({
  name: 'Create New Prompt',
  endpoint: '/api/prompts',
  method: 'POST',
  expectedMaxTime: 300,
  testFunction: mockAPIFunctions.createPrompt
});

performanceTester.addTest({
  name: 'Generate AI Prompt',
  endpoint: '/api/prompts/generate',
  method: 'POST',
  expectedMaxTime: 500,
  testFunction: mockAPIFunctions.generatePrompt
});

performanceTester.addTest({
  name: 'Fetch Analytics Data',
  endpoint: '/api/analytics',
  method: 'GET',
  expectedMaxTime: 250,
  testFunction: mockAPIFunctions.fetchAnalytics
});

performanceTester.addTest({
  name: 'Upload Document',
  endpoint: '/api/documents',
  method: 'POST',
  expectedMaxTime: 800,
  testFunction: mockAPIFunctions.uploadDocument
});

// Export function to run tests
export async function runPerformanceTests(): Promise<void> {
  await performanceTester.runAllTests();
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).runPerformanceTests = runPerformanceTests;
  (window as any).getPerformanceSummary = getPerformanceSummary;
}
