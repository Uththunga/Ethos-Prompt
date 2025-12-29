/**
 * Monitoring Dashboard Component
 * Displays real-time monitoring data and system health metrics
 */

import React, { useState, useEffect } from 'react';
import {
  generateMonitoringReport,
  exportMonitoringData,
  performanceMonitor,
  errorTracker,
  userAnalytics,
} from '../../utils/monitoring';
import { Button } from '../marketing/ui/button';

interface PerformanceMetric {
  timestamp: string;
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}

interface ErrorReport {
  timestamp: string;
  message: string;
  stack?: string;
  userId?: string;
  url: string;
}

interface UserAction {
  timestamp: string;
  action: string;
  userId: string;
  details: string;
}

interface MonitoringSummary {
  totalErrors: number;
  totalActions: number;
  avgPageLoadTime: number;
  errorRate: number;
}

interface MonitoringReport {
  performance: PerformanceMetric[];
  errors: ErrorReport[];
  actions: UserAction[];
  summary: MonitoringSummary;
}

export const MonitoringDashboard: React.FC = () => {
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh monitoring data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const newReport = generateMonitoringReport();
      setReport(newReport);
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Export monitoring data
  const handleExport = () => {
    const data = exportMonitoringData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all monitoring data
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all monitoring data?')) {
      performanceMonitor.clearMetrics();
      errorTracker.clearErrors();
      userAnalytics.clearActions();
      refreshData();
    }
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethos-purple"></div>
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto-refresh
          </label>
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline" size="sm">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            Export Data
          </Button>
          <Button onClick={handleClearData} variant="outline" size="sm">
            Clear Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Errors</h3>
          <p className="text-2xl font-bold text-red-600">{report.summary.totalErrors}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">User Actions</h3>
          <p className="text-2xl font-bold text-ethos-purple">{report.summary.totalActions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Load Time</h3>
          <p className="text-2xl font-bold text-green-600">
            {report.summary.avgPageLoadTime
              ? `${report.summary.avgPageLoadTime.toFixed(0)}ms`
              : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {(report.summary.errorRate * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.performance.slice(-10).map((metric, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.value.toFixed(2)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Errors</h3>
        {report.errors.length === 0 ? (
          <p className="text-gray-500">No errors recorded</p>
        ) : (
          <div className="flex flex-col gap-3">
            {report.errors.slice(-5).map((error, index) => (
              <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">
                      {error.component || 'Unknown Component'}
                    </h4>
                    <p className="text-sm text-red-700">{error.message}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent User Actions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.actions.slice(-10).map((action, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {action.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.label || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                report.summary.errorRate < 0.01
                  ? 'bg-green-100 text-green-800'
                  : report.summary.errorRate < 0.05
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {report.summary.errorRate < 0.01
                ? '🟢 Healthy'
                : report.summary.errorRate < 0.05
                ? '🟡 Warning'
                : '🔴 Critical'}
            </div>
            <p className="text-sm text-gray-500 mt-1">Error Rate</p>
          </div>
          <div className="text-center">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                report.summary.avgPageLoadTime < 2000
                  ? 'bg-green-100 text-green-800'
                  : report.summary.avgPageLoadTime < 5000
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {report.summary.avgPageLoadTime < 2000
                ? '🟢 Fast'
                : report.summary.avgPageLoadTime < 5000
                ? '🟡 Slow'
                : '🔴 Very Slow'}
            </div>
            <p className="text-sm text-gray-500 mt-1">Performance</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-ethos-purple-light text-ethos-purple-dark">
              🟢 Online
            </div>
            <p className="text-sm text-gray-500 mt-1">Status</p>
          </div>
        </div>
      </div>
    </div>
  );
};
