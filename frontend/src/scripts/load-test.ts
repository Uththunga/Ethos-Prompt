/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Load Testing Script
 * Simulates concurrent users to test application performance under load
 */

import { apiTracker } from '../utils/monitoring';

interface LoadTestConfig {
  concurrentUsers: number;
  testDurationMs: number;
  rampUpTimeMs: number;
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // Percentage of users running this scenario
  actions: LoadTestAction[];
}

interface LoadTestAction {
  name: string;
  endpoint: string;
  method: string;
  delayMs: number;
  execute: () => Promise<any>;
}

class LoadTester {
  private config: LoadTestConfig;
  private activeUsers: number = 0;
  private results: Array<{
    userId: number;
    scenario: string;
    action: string;
    responseTime: number;
    success: boolean;
    timestamp: number;
  }> = [];
  private isRunning: boolean = false;

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async runLoadTest(): Promise<void> {
    console.log('🚀 Starting Load Test...');
    console.log(`Target: ${this.config.concurrentUsers} concurrent users`);
    console.log(`Duration: ${this.config.testDurationMs / 1000}s`);
    console.log(`Ramp-up: ${this.config.rampUpTimeMs / 1000}s`);

    this.isRunning = true;
    const startTime = Date.now();

    // Ramp up users gradually
    const userSpawnInterval = this.config.rampUpTimeMs / this.config.concurrentUsers;

    for (let i = 0; i < this.config.concurrentUsers; i++) {
      setTimeout(() => {
        if (this.isRunning) {
          this.spawnUser(i + 1, startTime);
        }
      }, i * userSpawnInterval);
    }

    // Stop test after duration
    setTimeout(() => {
      this.stopLoadTest();
    }, this.config.testDurationMs);

    // Wait for test completion
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!this.isRunning && this.activeUsers === 0) {
          clearInterval(checkInterval);
          resolve(void 0);
        }
      }, 1000);
    });

    this.generateLoadTestReport();
  }

  private async spawnUser(userId: number, testStartTime: number): Promise<void> {
    this.activeUsers++;
    console.log(`👤 User ${userId} started (Active: ${this.activeUsers})`);

    // Select scenario based on weights
    const scenario = this.selectScenario();

    try {
      while (this.isRunning && Date.now() - testStartTime < this.config.testDurationMs) {
        await this.executeScenario(userId, scenario);

        // Random think time between scenarios
        await this.delay(Math.random() * 2000 + 1000);
      }
    } catch (error) {
      console.error(`❌ User ${userId} encountered error:`, error);
    } finally {
      this.activeUsers--;
      console.log(`👤 User ${userId} finished (Active: ${this.activeUsers})`);
    }
  }

  private selectScenario(): LoadTestScenario {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const scenario of this.config.scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }

    return this.config.scenarios[0]; // Fallback
  }

  private async executeScenario(userId: number, scenario: LoadTestScenario): Promise<void> {
    for (const action of scenario.actions) {
      if (!this.isRunning) break;

      const startTime = performance.now();
      let success = true;

      try {
        await action.execute();
      } catch (error) {
        success = false;
        console.error(`❌ User ${userId} action ${action.name} failed:`, error);
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.results.push({
        userId,
        scenario: scenario.name,
        action: action.name,
        responseTime,
        success,
        timestamp: Date.now()
      });

      // Track in monitoring system
      apiTracker.trackAPICall(
        action.endpoint,
        action.method,
        startTime,
        endTime,
        success ? 200 : 500,
        { userId, scenario: scenario.name }
      );

      // Wait before next action
      if (action.delayMs > 0) {
        await this.delay(action.delayMs);
      }
    }
  }

  private stopLoadTest(): void {
    console.log('🛑 Stopping load test...');
    this.isRunning = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateLoadTestReport(): void {
    console.log('\n📊 LOAD TEST REPORT');
    console.log('=' .repeat(50));

    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const successRate = (successfulRequests / totalRequests) * 100;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Successful Requests: ${successfulRequests}`);
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`);

    const responseTimes = this.results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    console.log(`\n⏱️  Response Times:`);
    console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${minResponseTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`   P50: ${p50.toFixed(2)}ms`);
    console.log(`   P95: ${p95.toFixed(2)}ms`);
    console.log(`   P99: ${p99.toFixed(2)}ms`);

    // Requests per second
    const testDurationSeconds = this.config.testDurationMs / 1000;
    const requestsPerSecond = totalRequests / testDurationSeconds;
    console.log(`\n🔥 Throughput:`);
    console.log(`   Requests/Second: ${requestsPerSecond.toFixed(2)}`);

    // Performance targets validation
    console.log(`\n🎯 Load Test Targets:`);
    console.log(`   Success Rate > 99%: ${successRate > 99 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   P95 < 500ms: ${p95 < 500 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   P99 < 1000ms: ${p99 < 1000 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   RPS > 100: ${requestsPerSecond > 100 ? '✅ PASS' : '❌ FAIL'}`);

    // Scenario breakdown
    console.log(`\n📋 Scenario Breakdown:`);
    const scenarioStats = this.groupResultsByScenario();
    Object.entries(scenarioStats).forEach(([scenario, stats]) => {
      console.log(`   ${scenario}:`);
      console.log(`     Requests: ${stats.count}`);
      console.log(`     Success Rate: ${stats.successRate.toFixed(2)}%`);
      console.log(`     Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
    });
  }

  private groupResultsByScenario(): Record<string, {
    count: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    const groups: Record<string, any[]> = {};

    this.results.forEach(result => {
      if (!groups[result.scenario]) {
        groups[result.scenario] = [];
      }
      groups[result.scenario].push(result);
    });

    const stats: Record<string, any> = {};
    Object.entries(groups).forEach(([scenario, results]) => {
      const successCount = results.filter(r => r.success).length;
      const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      stats[scenario] = {
        count: results.length,
        successRate: (successCount / results.length) * 100,
        avgResponseTime: avgTime
      };
    });

    return stats;
  }

  getResults() {
    return this.results;
  }
}

// Mock API functions for load testing
const mockLoadTestAPI = {
  async quickRead(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25));
    return { data: 'quick' };
  },

  async normalOperation(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    return { data: 'normal' };
  },

  async heavyOperation(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
    return { data: 'heavy' };
  }
};

// Default load test configuration
const defaultLoadTestConfig: LoadTestConfig = {
  concurrentUsers: 50,
  testDurationMs: 60000, // 1 minute
  rampUpTimeMs: 10000,   // 10 seconds
  scenarios: [
    {
      name: 'Browse Prompts',
      weight: 60,
      actions: [
        {
          name: 'List Prompts',
          endpoint: '/api/prompts',
          method: 'GET',
          delayMs: 1000,
          execute: mockLoadTestAPI.quickRead
        },
        {
          name: 'View Prompt Details',
          endpoint: '/api/prompts/:id',
          method: 'GET',
          delayMs: 2000,
          execute: mockLoadTestAPI.normalOperation
        }
      ]
    },
    {
      name: 'Create Content',
      weight: 30,
      actions: [
        {
          name: 'Generate Prompt',
          endpoint: '/api/prompts/generate',
          method: 'POST',
          delayMs: 3000,
          execute: mockLoadTestAPI.heavyOperation
        },
        {
          name: 'Save Prompt',
          endpoint: '/api/prompts',
          method: 'POST',
          delayMs: 1000,
          execute: mockLoadTestAPI.normalOperation
        }
      ]
    },
    {
      name: 'Analytics View',
      weight: 10,
      actions: [
        {
          name: 'Load Dashboard',
          endpoint: '/api/analytics',
          method: 'GET',
          delayMs: 2000,
          execute: mockLoadTestAPI.normalOperation
        }
      ]
    }
  ]
};

// Export load tester
export const loadTester = new LoadTester(defaultLoadTestConfig);

// Export function to run load test
export async function runLoadTest(config?: Partial<LoadTestConfig>): Promise<void> {
  const finalConfig = { ...defaultLoadTestConfig, ...config };
  const tester = new LoadTester(finalConfig);
  await tester.runLoadTest();
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).runLoadTest = runLoadTest;
}
