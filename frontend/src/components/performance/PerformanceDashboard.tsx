import React, { useEffect, useState } from 'react';
import { runLoadTest } from '../../scripts/load-test';
import { runPerformanceTests } from '../../scripts/performance-test';
import { getPerformanceSummary } from '../../utils/monitoring';

interface PerformanceMetrics {
  apiMetrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    totalCalls: number;
  };
  coreWebVitals: Array<{
    name: string;
    value: number;
    timestamp: number;
  }>;
  errorCount: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      const summary = getPerformanceSummary();
      setMetrics(summary);
    }, 5000);

    // Initial load
    const summary = getPerformanceSummary();
    setMetrics(summary);

    return () => clearInterval(interval);
  }, []);

  const handleRunPerformanceTests = async () => {
    setIsRunningTests(true);
    setTestResults('Running performance tests...\n');

    try {
      // Capture console output
      const originalLog = console.log;
      let output = '';

      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog(...args);
      };

      await runPerformanceTests();

      console.log = originalLog;
      setTestResults(output);
    } catch (error) {
      setTestResults(`Error running tests: ${error}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunLoadTest = async () => {
    setIsRunningLoadTest(true);
    setTestResults('Running load test...\n');

    try {
      const originalLog = console.log;
      let output = '';

      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog(...args);
      };

      await runLoadTest({
        concurrentUsers: 10,
        testDurationMs: 30000, // 30 seconds for demo
        rampUpTimeMs: 5000
      });

      console.log = originalLog;
      setTestResults(output);
    } catch (error) {
      setTestResults(`Error running load test: ${error}`);
    } finally {
      setIsRunningLoadTest(false);
    }
  };

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? '✅' : '❌';
  };

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div >
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Performance Dashboard
        </h2>
        <div className="gap-2">
          <button
            onClick={handleRunPerformanceTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-ethos-purple text-white rounded-md hover:bg-ethos-purple-light disabled:opacity-50"
          >
            {isRunningTests ? 'Running...' : 'Run Performance Tests'}
          </button>
          <button
            onClick={handleRunLoadTest}
            disabled={isRunningLoadTest}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isRunningLoadTest ? 'Running...' : 'Run Load Test'}
          </button>
        </div>
      </div>

      {/* API Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          API Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Response Time</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.apiMetrics.averageResponseTime, 100, true)}`}>
              {metrics.apiMetrics.averageResponseTime.toFixed(1)}ms
              <span className="ml-2">
                {getStatusIcon(metrics.apiMetrics.averageResponseTime, 100, true)}
              </span>
            </div>
            <div className="text-xs text-gray-500">Target: &lt; 100ms</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">P95 Response Time</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.apiMetrics.p95ResponseTime, 200, true)}`}>
              {metrics.apiMetrics.p95ResponseTime.toFixed(1)}ms
              <span className="ml-2">
                {getStatusIcon(metrics.apiMetrics.p95ResponseTime, 200, true)}
              </span>
            </div>
            <div className="text-xs text-gray-500">Target: &lt; 200ms</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.apiMetrics.successRate, 99)}`}>
              {metrics.apiMetrics.successRate.toFixed(1)}%
              <span className="ml-2">
                {getStatusIcon(metrics.apiMetrics.successRate, 99)}
              </span>
            </div>
            <div className="text-xs text-gray-500">Target: &gt; 99%</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total API Calls</div>
            <div className="text-2xl font-bold text-ethos-purple">
              {metrics.apiMetrics.totalCalls}
            </div>
            <div className="text-xs text-gray-500">Since page load</div>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Core Web Vitals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.coreWebVitals.map((vital) => (
            <div key={vital.name} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">{vital.name}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {vital.value.toFixed(1)}
                {vital.name === 'CLS' ? '' : 'ms'}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(vital.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Tracking */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Error Tracking
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Errors</div>
          <div className={`text-2xl font-bold ${metrics.errorCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.errorCount}
            <span className="ml-2">
              {metrics.errorCount === 0 ? '✅' : '⚠️'}
            </span>
          </div>
          <div className="text-xs text-gray-500">Since page load</div>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Results
          </h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 font-mono">
            {testResults}
          </pre>
        </div>
      )}

      {/* Performance Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Optimization Tips
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>• Bundle size optimized with lazy loading and code splitting</div>
          <div>• API calls are monitored for response times and success rates</div>
          <div>• Core Web Vitals are tracked for user experience metrics</div>
          <div>• Error tracking helps identify and fix issues quickly</div>
          <div>• Performance tests validate response time targets</div>
          <div>• Load tests ensure the app can handle concurrent users</div>
        </div>
      </div>
    </div>
  );
};
