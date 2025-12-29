import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    Search,
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    BarChart3,
    PieChart,
    LineChart
} from 'lucide-react';

import { RealTimeMetrics } from './RealTimeMetrics';
import { PerformanceCharts } from './PerformanceCharts';
import { SearchAnalytics } from './SearchAnalytics';
import { SystemHealth } from './SystemHealth';
import { useAnalytics } from '@/hooks/useAnalytics';

interface DashboardData {
  timestamp: string;
  real_time_metrics: {
    searches_last_5min: number;
    avg_response_time: number;
    success_rate: number;
    cache_hit_rate: number;
    current_cpu_usage: number;
    current_memory_usage: number;
    search_type_distribution: Record<string, number>;
    active_sessions: number;
    error_rate: number;
  };
  system_health: {
    overall_health: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
    uptime_hours: number;
    error_rate: number;
    response_time_p95: number;
  };
  search_analytics: {
    total_searches: number;
    unique_queries: number;
    avg_results_per_search: number;
    most_popular_queries: Array<{
      query: string;
      count: number;
      avg_response_time: number;
    }>;
    search_type_breakdown: Record<string, number>;
    intent_distribution: Record<string, number>;
    spell_corrections: number;
    query_expansions: number;
  };
  performance_trends: Record<string, string>;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { fetchDashboardData, isConnected } = useAnalytics();

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDashboardData();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboardData]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  const getHealthStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading analytics dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Dashboard Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <span>No dashboard data available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring and performance analytics
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh
          </Button>

          {/* Manual Refresh */}
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <div className={`flex items-center gap-2 ${getHealthStatusColor(dashboardData.system_health.overall_health)}`}>
                  {getHealthStatusIcon(dashboardData.system_health.overall_health)}
                  <span className="font-semibold capitalize">
                    {dashboardData.system_health.overall_health}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Searches (5min)</p>
                <p className="text-2xl font-bold">
                  {dashboardData.real_time_metrics.searches_last_5min}
                </p>
              </div>
              <Search className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {dashboardData.real_time_metrics.avg_response_time.toFixed(2)}s
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">
                  {dashboardData.real_time_metrics.active_sessions}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            Key performance indicators and their trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboardData.performance_trends).map(([metric, trend]) => (
              <div key={metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium capitalize">
                  {metric.replace(/_/g, ' ')}
                </span>
                {getTrendIcon(trend)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>Active Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {dashboardData.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {alert.type}
                    </Badge>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="real-time" className="flex flex-col gap-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="real-time" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Real-time</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Search</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="real-time">
          <RealTimeMetrics data={dashboardData.real_time_metrics} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceCharts />
        </TabsContent>

        <TabsContent value="search">
          <SearchAnalytics data={dashboardData.search_analytics} />
        </TabsContent>

        <TabsContent value="system">
          <SystemHealth data={dashboardData.system_health} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
