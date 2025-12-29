import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area, PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Clock,
    Activity,
    BarChart3,
    RefreshCw,
    Download
} from 'lucide-react';

import { useAnalytics } from '@/hooks/useAnalytics';

interface ChartData {
  timestamp: string;
  response_time: number;
  search_volume: number;
  success_rate: number;
  error_rate: number;
  cache_hit_rate: number;
}

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export const PerformanceCharts: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    fetchPerformanceMetrics,
    fetchTimeSeriesData,
    generatePerformanceReport,
    isConnected
  } = useAnalytics();

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert time range to hours
      const hours = timeRange === '1h' ? 1 :
                   timeRange === '6h' ? 6 :
                   timeRange === '24h' ? 24 :
                   timeRange === '7d' ? 168 : 24;

      // Fetch performance metrics
      const metrics = await fetchPerformanceMetrics(hours);
      setPerformanceMetrics(metrics);

      // Generate mock time series data for charts
      // In a real implementation, this would fetch actual time series data
      const mockData = generateMockTimeSeriesData(hours);
      setChartData(mockData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTimeSeriesData = (hours: number): ChartData[] => {
    const data: ChartData[] = [];
    const now = new Date();
    const interval = hours <= 6 ? 10 : hours <= 24 ? 60 : 360; // minutes

    for (let i = hours * 60; i >= 0; i -= interval) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        response_time: 0.5 + Math.random() * 2, // 0.5-2.5s
        search_volume: Math.floor(Math.random() * 50) + 10, // 10-60 searches
        success_rate: 0.95 + Math.random() * 0.05, // 95-100%
        error_rate: Math.random() * 0.05, // 0-5%
        cache_hit_rate: 0.8 + Math.random() * 0.2 // 80-100%
      });
    }

    return data;
  };

  const downloadReport = async () => {
    try {
      const days = timeRange === '7d' ? 7 : 1;
      const report = await generatePerformanceReport(days);

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes('rate')) {
      return `${(value * 100).toFixed(1)}%`;
    } else if (name.includes('time')) {
      return `${value.toFixed(2)}s`;
    }
    return value.toFixed(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading performance charts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Chart Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
        <Button onClick={loadPerformanceData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Live Data" : "Offline"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPerformanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={downloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Response Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>Response Time Trends</span>
          </CardTitle>
          <CardDescription>
            Average response time over time (target: &lt; 3.0s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                interval="preserveStartEnd"
              />
              <YAxis
                label={{ value: 'Response Time (s)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                labelFormatter={(value) => formatTime(value)}
                formatter={(value, name) => [formatTooltipValue(Number(value), name), 'Response Time']}
              />
              <Line
                type="monotone"
                dataKey="response_time"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
              {/* Target line */}
              <Line
                type="monotone"
                dataKey={() => 3.0}
                stroke={CHART_COLORS.danger}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Search Volume and Success Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Search Volume</span>
            </CardTitle>
            <CardDescription>
              Number of searches over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => formatTime(value)}
                  formatter={(value) => [value, 'Searches']}
                />
                <Area
                  type="monotone"
                  dataKey="search_volume"
                  stroke={CHART_COLORS.secondary}
                  fill={CHART_COLORS.secondary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span>Success & Error Rates</span>
            </CardTitle>
            <CardDescription>
              Search success and error rates over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  labelFormatter={(value) => formatTime(value)}
                  formatter={(value, name) => [formatTooltipValue(Number(value), name), name]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="success_rate"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={2}
                  name="Success Rate"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="error_rate"
                  stroke={CHART_COLORS.danger}
                  strokeWidth={2}
                  name="Error Rate"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search Type Distribution */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Search Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of search methods used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(performanceMetrics.search_type_distribution).map(([type, count]) => ({
                      name: type,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(performanceMetrics.search_type_distribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-4">
                <h4 className="font-semibold">Search Type Summary</h4>
                {Object.entries(performanceMetrics.search_type_distribution).map(([type, count], index) => {
                  const total = Object.values(performanceMetrics.search_type_distribution).reduce((a: number, b: number) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="capitalize">{type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{count}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Performance</CardTitle>
          <CardDescription>
            Cache hit rate trends and efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                labelFormatter={(value) => formatTime(value)}
                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Cache Hit Rate']}
              />
              <Area
                type="monotone"
                dataKey="cache_hit_rate"
                stroke={CHART_COLORS.purple}
                fill={CHART_COLORS.purple}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
