import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@/components/icons';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface CostAnalyticsResponse {
  success: boolean;
  data?: CostAnalytics;
  error?: string;
}

interface BudgetResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface CostAnalytics {
  time_range: string;
  summary: {
    total_cost: number;
    average_cost_per_day: number;
    total_executions: number;
    average_cost_per_execution: number;
  };
  breakdown: {
    by_category: Record<string, number>;
    by_model: Record<string, number>;
  };
  trends: Array<{
    date: string;
    cost: number;
  }>;
  top_operations: Array<{
    operation: string;
    total_cost: number;
    average_cost: number;
    execution_count: number;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    potential_savings: number;
    confidence_score: number;
    implementation_effort: string;
  }>;
  budget_status: {
    has_budget: boolean;
    budgets?: Array<{
      budget_amount: number;
      current_usage: number;
      usage_percentage: number;
      period: string;
      threshold_percentage: number;
      is_over_threshold: boolean;
    }>;
  };
  forecast: {
    available: boolean;
    next_30_days?: number;
    daily_average?: number;
    confidence?: string;
    trend?: string;
    reason?: string;
  };
  generated_at: string;
}

const CostDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    amount: '',
    period: 'monthly',
    threshold: '80',
  });

  const loadCostAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      const getCostAnalytics = httpsCallable(functions, 'get_cost_analytics');
      const result = await getCostAnalytics({ time_range: timeRange });
      const data = result.data as CostAnalyticsResponse;

      if (data.success && data.data) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error loading cost analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (currentUser) {
      loadCostAnalytics();
    }
  }, [currentUser, timeRange, loadCostAnalytics]);

  const setBudgetAlert = async () => {
    try {
      const setBudgetAlert = httpsCallable(functions, 'set_budget_alert');
      const result = await setBudgetAlert({
        budget_amount: parseFloat(budgetForm.amount),
        period: budgetForm.period,
        threshold_percentage: parseFloat(budgetForm.threshold),
      });
      const data = result.data as BudgetResponse;

      if (data.success) {
        setShowBudgetForm(false);
        setBudgetForm({ amount: '', period: 'monthly', threshold: '80' });
        loadCostAnalytics(); // Reload to show new budget
      } else {
        alert(`Failed to set budget alert: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting budget alert:', error);
      alert('Failed to set budget alert. Please try again.');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const getEffortColor = (effort: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100',
    };
    return colors[effort as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
    } else if (trend === 'decreasing') {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
    }
    return <ClockIcon className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
        <span className="ml-3 text-lg text-gray-600">Loading cost analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No cost data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start using the platform to see cost analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">Cost Analytics</h1>
          <p className="text-sm text-gray-500">Track usage costs and optimize spending</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="1d">Last Day</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ethos-purple hover:bg-ethos-purple-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
          >
            Set Budget
          </button>
        </div>
      </div>

      {/* Budget Alerts */}
      {analytics.budget_status.has_budget && analytics.budget_status.budgets && (
        <div className="flex flex-col gap-3">
          {analytics.budget_status.budgets.map((budget, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                budget.is_over_threshold
                  ? 'bg-red-50 border-red-200'
                  : budget.usage_percentage > 70
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon
                    className={`h-5 w-5 ${
                      budget.is_over_threshold
                        ? 'text-red-500'
                        : budget.usage_percentage > 70
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-gray-900">
                      {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(budget.current_usage)} of{' '}
                      {formatCurrency(budget.budget_amount)} used
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {budget.usage_percentage.toFixed(1)}%
                  </p>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        budget.is_over_threshold
                          ? 'bg-red-500'
                          : budget.usage_percentage > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.usage_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cost</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analytics.summary.total_cost)}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Daily Average</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analytics.summary.average_cost_per_day)}
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
                <CpuChipIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cost per Execution</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analytics.summary.average_cost_per_execution)}
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
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Executions</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.summary.total_executions.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown and Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown by Model */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost by Model</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(analytics.breakdown.by_model)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([model, cost]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{model}</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(cost)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Forecast */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Forecast</h3>
          {analytics.forecast.available ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Predicted Cost</span>
                <span className="text-lg font-medium text-gray-900">
                  {formatCurrency(analytics.forecast.next_30_days || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily Average</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(analytics.forecast.daily_average || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trend</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(analytics.forecast.trend || 'stable')}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {analytics.forecast.trend || 'stable'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{analytics.forecast.reason}</p>
          )}
        </div>
      </div>

      {/* Optimization Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cost Optimization Recommendations</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.recommendations.map((rec) => (
              <div key={rec.id} className="p-6">
                <div className="flex items-start gap-3">
                  <LightBulbIcon className="h-6 w-6 text-yellow-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          Save {formatCurrency(rec.potential_savings)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffortColor(
                            rec.implementation_effort
                          )}`}
                        >
                          {rec.implementation_effort} effort
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Expensive Operations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Most Expensive Operations</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {analytics.top_operations.slice(0, 5).map((operation, index) => (
            <div key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-900">{operation.operation}</p>
                  <p className="text-xs text-gray-500">{operation.execution_count} executions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(operation.total_cost)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(operation.average_cost)} avg
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Set Budget Alert</h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Budget Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Period</label>
                  <select
                    value={budgetForm.period}
                    onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={budgetForm.threshold}
                    onChange={(e) => setBudgetForm({ ...budgetForm, threshold: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Alert when {budgetForm.threshold}% of budget is used
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowBudgetForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
                >
                  Cancel
                </button>
                <button
                  onClick={setBudgetAlert}
                  disabled={!budgetForm.amount || !budgetForm.threshold}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ethos-purple hover:bg-ethos-purple-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Budget Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {new Date(analytics.generated_at).toLocaleString()}
      </div>
    </div>
  );
};

export default CostDashboard;
