import {
    BoltIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    ServerIcon,
    SignalIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';

interface PerformanceDashboardData {
  metrics_summary: {
    avg_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    error_rate: number;
    throughput: number;
    uptime_percentage: number;
  };
  error_summary: {
    total_errors: number;
    critical_errors: number;
    error_rate: number;
    top_errors: Array<{
      type: string;
      count: number;
    }>;
  };
  sla_status: Array<{
    metric: string;
    target: number;
    current: number;
    status: string;
    percentage: number;
  }>;
  recent_alerts: Array<{
    id: string;
    type: string;
    severity: string;
    timestamp: string | Date | { toDate: () => Date };
    message?: string;
    metric_type?: string;
    error_type?: string;
  }>;
  system_health: {
    database: {
      service: string;
      status: string;
      response_time: number;
      details: Record<string, unknown>;
    };
    api: {
      service: string;
      status: string;
      response_time: number;
      details: Record<string, unknown>;
    };
    system: {
      service: string;
      status: string;
      details: {
        cpu_percent: number;
        memory_percent: number;
        disk_percent: number;
      };
    };
    external_services: {
      service: string;
      status: string;
      response_time: number;
      details: Record<string, unknown>;
    };
  };
  performance_trends: {
    response_time_trend: Array<{
      timestamp: string;
      value: number;
    }>;
    error_rate_trend: Array<{
      timestamp: string;
      value: number;
    }>;
  };
  time_range: string;
  generated_at: string;
}

const PerformanceDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<PerformanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();

      // Auto-refresh every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, timeRange, loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const getPerformanceDashboard = httpsCallable(functions, 'get_performance_dashboard');
      const result = await getPerformanceDashboard({ time_range: timeRange });
      const data = result.data as {
        success: boolean;
        data?: PerformanceDashboardData;
        error?: string;
      };

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error loading performance dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      degraded: 'text-yellow-600 bg-yellow-100',
      unhealthy: 'text-red-600 bg-red-100',
      meeting: 'text-green-600 bg-green-100',
      at_risk: 'text-yellow-600 bg-yellow-100',
      violated: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'meeting') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (status === 'degraded' || status === 'at_risk') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: 'text-ethos-purple bg-ethos-purple/10',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      critical: 'text-red-800 bg-red-200'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatTimestamp = (timestamp: string | Date | { toDate: () => Date }): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
        <span className="ml-3 text-lg text-gray-600">Loading performance data...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Performance monitoring data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
          <p className="text-sm text-gray-500">
            System health, performance metrics, and error tracking
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            size="sm"
            className="inline-flex items-center"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(dashboardData.system_health).map(([service, health]) => (
          <div key={service} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {service === 'database' && <ServerIcon className="h-6 w-6 text-gray-400" />}
                  {service === 'api' && <BoltIcon className="h-6 w-6 text-gray-400" />}
                  {service === 'system' && <CpuChipIcon className="h-6 w-6 text-gray-400" />}
                  {service === 'external_services' && <SignalIcon className="h-6 w-6 text-gray-400" />}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate capitalize">
                      {service.replace('_', ' ')}
                    </dt>
                    <dd className="flex items-center">
                      {getStatusIcon(health.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
                        {health.status}
                      </span>
                    </dd>
                  </dl>
                </div>
              </div>
              {health.response_time > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Response time: {formatNumber(health.response_time)}ms
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Response Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(dashboardData.metrics_summary.avg_response_time)}ms
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    P95 Response Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(dashboardData.metrics_summary.p95_response_time)}ms
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Error Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(dashboardData.metrics_summary.error_rate)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BoltIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Throughput
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.metrics_summary.throughput}/h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Uptime
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(dashboardData.metrics_summary.uptime_percentage, 2)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Errors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.error_summary.total_errors}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Status and Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">SLA Status</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.sla_status.map((sla, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sla.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sla.metric}</p>
                      <p className="text-xs text-gray-500">
                        Target: {sla.target} | Current: {formatNumber(sla.current)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sla.status)}`}>
                    {formatNumber(sla.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {dashboardData.recent_alerts.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm text-gray-500">No recent alerts</p>
              </div>
            ) : (
              dashboardData.recent_alerts.map((alert, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.type === 'metric_alert' ? `${alert.metric_type} Alert` : `${alert.error_type} Error`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Resources */}
      {dashboardData.system_health.system && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <span className="text-sm text-gray-900">
                  {formatNumber(dashboardData.system_health.system.details.cpu_percent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    dashboardData.system_health.system.details.cpu_percent > 80
                      ? 'bg-red-600'
                      : dashboardData.system_health.system.details.cpu_percent > 60
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${dashboardData.system_health.system.details.cpu_percent}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <span className="text-sm text-gray-900">
                  {formatNumber(dashboardData.system_health.system.details.memory_percent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    dashboardData.system_health.system.details.memory_percent > 80
                      ? 'bg-red-600'
                      : dashboardData.system_health.system.details.memory_percent > 60
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${dashboardData.system_health.system.details.memory_percent}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                <span className="text-sm text-gray-900">
                  {formatNumber(dashboardData.system_health.system.details.disk_percent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    dashboardData.system_health.system.details.disk_percent > 80
                      ? 'bg-red-600'
                      : dashboardData.system_health.system.details.disk_percent > 60
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${dashboardData.system_health.system.details.disk_percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {new Date(dashboardData.generated_at).toLocaleString()}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
