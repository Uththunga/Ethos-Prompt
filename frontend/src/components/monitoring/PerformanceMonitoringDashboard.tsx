import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { performanceMonitoringService } from '../../services/performanceMonitoringService';
import { Button } from '../marketing/ui/button';



interface PerformanceData {
  hybridSearch: {
    averageLatency: number;
    totalSearches: number;
    averageRelevance: number;
    searchTypeDistribution: Record<string, number>;
  };
  analyticsDashboard: {
    averageLoadTime: number;
    averageUpdateLatency: number;
    totalLoads: number;
  };
  abTesting: {
    totalTests: number;
    averageConversionTime: number;
    successRate: number;
  };
  costOptimization: {
    totalCost: number;
    totalSavings: number;
    providerDistribution: Record<string, number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [timeRange, setTimeRange] = useState<number>(24); // hours
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const loadPerformanceData = () => {
      setIsLoading(true);
      try {
        const data = performanceMonitoringService.getPerformanceSummary(timeRange);
        setPerformanceData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const formatSearchTypeData = (distribution: Record<string, number>) => {
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  const formatProviderData = (distribution: Record<string, number>) => {
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No performance data available</p>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last Week</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Search Latency</h3>
          <p className="text-2xl font-bold text-gray-900">
            {performanceData.hybridSearch.averageLatency.toFixed(0)}ms
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData.hybridSearch.totalSearches} searches
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Relevance Score</h3>
          <p className="text-2xl font-bold text-gray-900">
            {(performanceData.hybridSearch.averageRelevance * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-green-600 mt-1">
            Target: &gt;70%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Dashboard Load Time</h3>
          <p className="text-2xl font-bold text-gray-900">
            {performanceData.analyticsDashboard.averageLoadTime.toFixed(0)}ms
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData.analyticsDashboard.totalLoads} loads
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Cost Savings</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${performanceData.costOptimization.totalSavings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total cost: ${performanceData.costOptimization.totalCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatSearchTypeData(performanceData.hybridSearch.searchTypeDistribution)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {formatSearchTypeData(performanceData.hybridSearch.searchTypeDistribution).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Cost Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Provider Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatProviderData(performanceData.costOptimization.providerDistribution)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Metrics</h3>
        </div>
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
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Hybrid Search Latency
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {performanceData.hybridSearch.averageLatency.toFixed(0)}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  &lt;3000ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    performanceData.hybridSearch.averageLatency < 3000
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {performanceData.hybridSearch.averageLatency < 3000 ? 'Good' : 'Poor'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Dashboard Update Latency
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {performanceData.analyticsDashboard.averageUpdateLatency.toFixed(0)}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  &lt;1000ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    performanceData.analyticsDashboard.averageUpdateLatency < 1000
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {performanceData.analyticsDashboard.averageUpdateLatency < 1000 ? 'Good' : 'Poor'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  A/B Test Success Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(performanceData.abTesting.successRate * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  &gt;80%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    performanceData.abTesting.successRate > 0.8
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {performanceData.abTesting.successRate > 0.8 ? 'Good' : 'Fair'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const data = performanceMonitoringService.exportMetrics('json');
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="text-sm"
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const data = performanceMonitoringService.exportMetrics('csv');
              const blob = new Blob([data], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="text-sm"
          >
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
