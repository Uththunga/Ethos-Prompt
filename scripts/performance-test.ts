#!/usr/bin/env node

/**
 * API Performance Testing Script for RAG Prompt Library
 * Tests API response times and validates against <200ms P95 target
 */

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:5001',
  targetP95: 200, // milliseconds
  testDuration: 60000, // 1 minute
  concurrentUsers: 10,
  endpoints: [
    {
      name: 'Health Check',
      path: '/health',
      method: 'GET',
      weight: 1
    },
    {
      name: 'List Prompts',
      path: '/api/prompts',
      method: 'GET',
      weight: 3,
      headers: { 'Authorization': 'Bearer test-token' }
    },
    {
      name: 'Generate Prompt',
      path: '/api/generate-prompt',
      method: 'POST',
      weight: 2,
      headers: { 
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: {
        description: 'Create a marketing email for a new product launch',
        category: 'marketing',
        variables: ['product_name', 'target_audience']
      }
    },
    {
      name: 'Execute Prompt',
      path: '/api/execute-prompt',
      method: 'POST',
      weight: 2,
      headers: { 
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: {
        promptId: 'test-prompt-id',
        variables: {
          product_name: 'Amazing Widget',
          target_audience: 'tech enthusiasts'
        }
      }
    }
  ]
};

interface TestResult {
  endpoint: string;
  responseTime: number;
  status: number;
  success: boolean;
  timestamp: number;
  error?: string;
}

interface PerformanceMetrics {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
}

class PerformanceTester {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private isRunning: boolean = false;

  async runTest(): Promise<void> {
    console.log('🚀 Starting API Performance Test...');
    console.log('=====================================');
    console.log(`Target P95: ${CONFIG.targetP95}ms`);
    console.log(`Test Duration: ${CONFIG.testDuration / 1000}s`);
    console.log(`Concurrent Users: ${CONFIG.concurrentUsers}`);
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log('');

    this.startTime = performance.now();
    this.isRunning = true;

    // Start concurrent test workers
    const workers = Array.from({ length: CONFIG.concurrentUsers }, (_, i) => 
      this.runWorker(i)
    );

    // Stop after test duration
    setTimeout(() => {
      this.isRunning = false;
    }, CONFIG.testDuration);

    // Wait for all workers to complete
    await Promise.all(workers);

    // Analyze results
    this.analyzeResults();
  }

  private async runWorker(workerId: number): Promise<void> {
    while (this.isRunning) {
      const endpoint = this.selectEndpoint();
      await this.makeRequest(endpoint, workerId);
      
      // Small delay between requests
      await this.sleep(Math.random() * 100 + 50);
    }
  }

  private selectEndpoint() {
    // Weighted random selection
    const totalWeight = CONFIG.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of CONFIG.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return CONFIG.endpoints[0];
  }

  private async makeRequest(endpoint: any, workerId: number): Promise<void> {
    const startTime = performance.now();
    
    try {
      const url = `${CONFIG.baseUrl}${endpoint.path}`;
      const options: RequestInit = {
        method: endpoint.method,
        headers: endpoint.headers || {},
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(url, options);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.results.push({
        endpoint: endpoint.name,
        responseTime,
        status: response.status,
        success: response.ok,
        timestamp: Date.now()
      });

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.results.push({
        endpoint: endpoint.name,
        responseTime,
        status: 0,
        success: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private analyzeResults(): void {
    console.log('📊 Performance Test Results');
    console.log('============================');

    const endpointGroups = this.groupResultsByEndpoint();
    const overallMetrics = this.calculateOverallMetrics();

    // Print endpoint-specific metrics
    for (const [endpointName, results] of endpointGroups) {
      const metrics = this.calculateMetrics(endpointName, results);
      this.printEndpointMetrics(metrics);
    }

    // Print overall metrics
    console.log('\n📈 Overall Performance');
    console.log('======================');
    this.printOverallMetrics(overallMetrics);

    // Check against targets
    this.validateTargets(overallMetrics);

    // Save detailed report
    this.saveReport(endpointGroups, overallMetrics);
  }

  private groupResultsByEndpoint(): Map<string, TestResult[]> {
    const groups = new Map<string, TestResult[]>();
    
    for (const result of this.results) {
      if (!groups.has(result.endpoint)) {
        groups.set(result.endpoint, []);
      }
      groups.get(result.endpoint)!.push(result);
    }
    
    return groups;
  }

  private calculateMetrics(endpoint: string, results: TestResult[]): PerformanceMetrics {
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const successfulResults = results.filter(r => r.success);

    return {
      endpoint,
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: results.length - successfulResults.length,
      averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      p50: this.percentile(responseTimes, 50),
      p95: this.percentile(responseTimes, 95),
      p99: this.percentile(responseTimes, 99),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      successRate: (successfulResults.length / results.length) * 100
    };
  }

  private calculateOverallMetrics(): PerformanceMetrics {
    return this.calculateMetrics('Overall', this.results);
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private printEndpointMetrics(metrics: PerformanceMetrics): void {
    const p95Status = metrics.p95 <= CONFIG.targetP95 ? '✅' : '❌';
    
    console.log(`\n${metrics.endpoint}:`);
    console.log(`  Requests: ${metrics.totalRequests} (${metrics.successfulRequests} successful)`);
    console.log(`  Success Rate: ${metrics.successRate.toFixed(1)}%`);
    console.log(`  Response Times: avg=${metrics.averageResponseTime.toFixed(1)}ms, p95=${metrics.p95.toFixed(1)}ms ${p95Status}`);
  }

  private printOverallMetrics(metrics: PerformanceMetrics): void {
    const p95Status = metrics.p95 <= CONFIG.targetP95 ? '✅ PASS' : '❌ FAIL';
    
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Success Rate: ${metrics.successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${metrics.averageResponseTime.toFixed(1)}ms`);
    console.log(`P95 Response Time: ${metrics.p95.toFixed(1)}ms (Target: ${CONFIG.targetP95}ms) ${p95Status}`);
    console.log(`P99 Response Time: ${metrics.p99.toFixed(1)}ms`);
  }

  private validateTargets(metrics: PerformanceMetrics): void {
    console.log('\n🎯 Target Validation');
    console.log('====================');
    
    if (metrics.p95 <= CONFIG.targetP95) {
      console.log(`✅ P95 response time target met: ${metrics.p95.toFixed(1)}ms <= ${CONFIG.targetP95}ms`);
    } else {
      console.log(`❌ P95 response time target exceeded: ${metrics.p95.toFixed(1)}ms > ${CONFIG.targetP95}ms`);
      console.log('   Recommendations:');
      console.log('   • Optimize database queries');
      console.log('   • Add caching layers');
      console.log('   • Scale backend infrastructure');
      console.log('   • Optimize API endpoints');
    }

    if (metrics.successRate >= 99.0) {
      console.log(`✅ Success rate target met: ${metrics.successRate.toFixed(1)}% >= 99.0%`);
    } else {
      console.log(`❌ Success rate below target: ${metrics.successRate.toFixed(1)}% < 99.0%`);
    }
  }

  private saveReport(endpointGroups: Map<string, TestResult[]>, overallMetrics: PerformanceMetrics): void {
    const report = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      overallMetrics,
      endpointMetrics: Array.from(endpointGroups.entries()).map(([name, results]) => 
        this.calculateMetrics(name, results)
      ),
      rawResults: this.results
    };

    const reportPath = path.join(process.cwd(), 'performance-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }
}

// Run the test
async function main() {
  const tester = new PerformanceTester();
  await tester.runTest();
}

if (require.main === module) {
  main().catch(console.error);
}
