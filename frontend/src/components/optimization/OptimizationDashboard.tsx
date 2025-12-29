import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    BoltIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    Cog6ToothIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    ScaleIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface OptimizationDashboardData {
  system_health: {
    score: number;
    status: string;
    message: string;
    metrics_analyzed: number;
  };
  recent_metrics: Array<{
    id: string;
    metric_type: string;
    value: number;
    unit: string;
    component: string;
    timestamp: string | Date | { toDate: () => Date };
  }>;
  active_alerts: Array<{
    id: string;
    alert_type: string;
    severity: string;
    message: string;
    metric_value: number;
    threshold: number;
    component: string;
    triggered_at: string | Date | { toDate: () => Date };
    status: string;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    impact_score: number;
    implementation_effort: string;
    estimated_improvement: string;
    component: string;
    created_at: string | Date | { toDate: () => Date };
  }>;
  scaling_status: {
    recent_events: Array<{
      id: string;
      action: string;
      metric_type: string;
      metric_value: number;
      component: string;
      timestamp: string | Date | { toDate: () => Date };
      status: string;
    }>;
    active_rules: Array<{
      id: string;
      name: string;
      metric_type: string;
      threshold_up: number;
      threshold_down: number;
      is_enabled: boolean;
    }>;
    auto_scaling_enabled: boolean;
  };
  performance_trends: {
    hourly_trends: Array<{
      timestamp: string;
      metrics: Record<string, { avg: number; count: number }>;
    }>;
    trend_period: string;
  };
  generated_at: string;
}

const OptimizationDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<OptimizationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizeForm, setOptimizeForm] = useState({
    component: '',
    optimization_type: 'caching'
  });

  useEffect(() => {
    if (currentUser) {
      loadOptimizationDashboard();
    }
  }, [currentUser]);

  const loadOptimizationDashboard = async () => {
    try {
      setLoading(true);
      const getOptimizationDashboard = httpsCallable(functions, 'get_optimization_dashboard');
      const result = await getOptimizationDashboard();
      const data = result.data as {
        success: boolean;
        data?: OptimizationDashboardData;
        error?: string;
      };

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error loading optimization dashboard:', error);
    } finally {
      setLoading(false);
    }
  };



  const optimizeComponent = async () => {
    try {
      const optimizeComponent = httpsCallable(functions, 'optimize_component');
      const result = await optimizeComponent({
        component: optimizeForm.component,
        optimization_type: optimizeForm.optimization_type
      });
      const data = result.data as { success: boolean; error?: string };

      if (data.success) {
        setShowOptimizeModal(false);
        setOptimizeForm({ component: '', optimization_type: 'caching' });
        alert('Optimization recommendation generated successfully!');
        loadOptimizationDashboard(); // Reload to show new recommendation
      } else {
        alert(`Optimization failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('Error optimizing component:', error);
      alert('Optimization failed. Please try again.');
    }
  };

  const getHealthColor = (status: string) => {
    const colors = {
      excellent: 'text-green-600',
      good: 'text-ethos-purple',
      fair: 'text-yellow-600',
      poor: 'text-orange-600',
      critical: 'text-red-600',
      unknown: 'text-gray-600',
      error: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  const getHealthIcon = (status: string) => {
    if (status === 'excellent' || status === 'good') {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    } else if (status === 'fair') {
      return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    } else {
      return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-ethos-purple bg-ethos-purple-light',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100',
      critical: 'text-red-800 bg-red-200'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getEffortColor = (effort: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100'
    };
    return colors[effort as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatTimestamp = (timestamp: string | Date | { toDate: () => Date }): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatMetricType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
        <span className="ml-3 text-lg text-gray-600">Loading optimization dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No optimization data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Optimization dashboard data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Optimization</h1>
          <p className="text-sm text-gray-500">
            Monitor system performance and optimize for better efficiency
          </p>
        </div>
        <button
          onClick={() => setShowOptimizeModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ethos-purple hover:bg-ethos-purple-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
        >
          <BoltIcon className="h-4 w-4 mr-2" />
          Optimize Component
        </button>
      </div>

      {/* System Health */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            {getHealthIcon(dashboardData.system_health.status)}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getHealthColor(dashboardData.system_health.status)}`}>
                  {dashboardData.system_health.score}/100
                </span>
                <span className={`text-lg font-medium capitalize ${getHealthColor(dashboardData.system_health.status)}`}>
                  {dashboardData.system_health.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {dashboardData.system_health.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Based on {dashboardData.system_health.metrics_analyzed} recent metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-ethos-purple" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Response Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.recent_metrics
                      .filter(m => m.metric_type === 'response_time')
                      .reduce((sum, m) => sum + m.value, 0) /
                     Math.max(dashboardData.recent_metrics.filter(m => m.metric_type === 'response_time').length, 1)
                    }ms
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
                <CpuChipIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    CPU Utilization
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.recent_metrics
                      .filter(m => m.metric_type === 'cpu_utilization')
                      .reduce((sum, m) => sum + m.value, 0) /
                     Math.max(dashboardData.recent_metrics.filter(m => m.metric_type === 'cpu_utilization').length, 1)
                    }%
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
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Alerts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.active_alerts.length}
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
                <ScaleIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Auto-scaling
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.scaling_status.auto_scaling_enabled ? 'Enabled' : 'Disabled'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {dashboardData.active_alerts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Performance Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.active_alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className={`h-5 w-5 mt-1 ${
                    alert.severity === 'critical' ? 'text-red-800' :
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span>Component: {alert.component}</span>
                      <span className="mx-2">•</span>
                      <span>Value: {alert.metric_value}</span>
                      <span className="mx-2">•</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span className="mx-2">•</span>
                      <span>Triggered: {formatTimestamp(alert.triggered_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Recommendations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Optimization Recommendations</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData.recommendations.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-gray-500">No optimization recommendations at this time</p>
            </div>
          ) : (
            dashboardData.recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="p-6">
                <div className="flex items-start gap-3">
                  <BoltIcon className="h-5 w-5 text-ethos-purple mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ethos-purple">
                          Impact: {rec.impact_score}/100
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffortColor(rec.implementation_effort)}`}>
                          {rec.implementation_effort} effort
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Component: {rec.component}</span>
                      <span className="mx-2">•</span>
                      <span>Expected: {rec.estimated_improvement}</span>
                      <span className="mx-2">•</span>
                      <span>Created: {formatTimestamp(rec.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scaling Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scaling Events */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Scaling Events</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {dashboardData.scaling_status.recent_events.length === 0 ? (
              <div className="p-6 text-center">
                <ScaleIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent scaling events</p>
              </div>
            ) : (
              dashboardData.scaling_status.recent_events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {event.action === 'scale_up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                    ) : event.action === 'scale_down' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-ethos-purple" />
                    ) : (
                      <Cog6ToothIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {event.action.replace('_', ' ')} - {event.component}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatMetricType(event.metric_type)}: {event.metric_value} • {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Scaling Rules */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Scaling Rules</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {dashboardData.scaling_status.active_rules.length === 0 ? (
              <div className="p-6 text-center">
                <Cog6ToothIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No active scaling rules</p>
              </div>
            ) : (
              dashboardData.scaling_status.active_rules.map((rule) => (
                <div key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatMetricType(rule.metric_type)}: Scale up at {rule.threshold_up}, down at {rule.threshold_down}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.is_enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                    }`}>
                      {rule.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Optimize Component Modal */}
      {showOptimizeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Optimize Component</h3>

              <div >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Component
                  </label>
                  <input
                    type="text"
                    value={optimizeForm.component}
                    onChange={(e) => setOptimizeForm({ ...optimizeForm, component: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="e.g., api, database, frontend"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Optimization Type
                  </label>
                  <select
                    value={optimizeForm.optimization_type}
                    onChange={(e) => setOptimizeForm({ ...optimizeForm, optimization_type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    <option value="caching">Caching</option>
                    <option value="database_query">Database Query</option>
                    <option value="api_response">API Response</option>
                    <option value="memory_usage">Memory Usage</option>
                    <option value="cpu_usage">CPU Usage</option>
                    <option value="network_latency">Network Latency</option>
                    <option value="batch_processing">Batch Processing</option>
                    <option value="resource_allocation">Resource Allocation</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowOptimizeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
                >
                  Cancel
                </button>
                <button
                  onClick={optimizeComponent}
                  disabled={!optimizeForm.component}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ethos-purple hover:bg-ethos-purple-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Optimization
                </button>
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

export default OptimizationDashboard;
