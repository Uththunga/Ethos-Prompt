import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ActionableInsight,
  FeedbackAnalytics,
  FeedbackType,
  userFeedbackService,
} from '../../services/userFeedbackService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const FeedbackAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30); // days
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<ActionableInsight | null>(null);

  const loadAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000);

      const data = await userFeedbackService.getFeedbackAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load feedback analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, loadAnalytics]);

  const formatFeedbackTypeData = (feedbackByType: Record<FeedbackType, number>) => {
    return Object.entries(feedbackByType).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
    }));
  };

  const formatRatingData = (feedbackByRating: Record<number, number>) => {
    return Object.entries(feedbackByRating).map(([rating, count]) => ({
      rating: `${rating} Star${rating !== '1' ? 's' : ''}`,
      count,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No feedback data available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Analytics</h2>
          <p className="text-sm text-gray-500">
            Insights from user feedback over the last {timeRange} days
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Feedback</h3>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalFeedback}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.averageRating.toFixed(1)}/5.0
          </p>
          <div className="flex mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-sm ${
                  star <= Math.round(analytics.averageRating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Sentiment</h3>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Positive</span>
              <span>{(analytics.sentimentAnalysis.positive * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Negative</span>
              <span>{(analytics.sentimentAnalysis.negative * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Action Items</h3>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.actionableInsights.filter((i) => i.priority === 'high').length}
          </p>
          <p className="text-xs text-red-600 mt-1">High priority issues</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="averageRating" stroke="#8884d8" name="Avg Rating" />
              <Line
                type="monotone"
                dataKey="feedbackCount"
                stroke="#82ca9d"
                name="Feedback Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback by Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatFeedbackTypeData(analytics.feedbackByType)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {formatFeedbackTypeData(analytics.feedbackByType).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatRatingData(analytics.feedbackByRating)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Keywords */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Keywords</h3>
          <div className="flex flex-col gap-2">
            {analytics.sentimentAnalysis.keywords.slice(0, 10).map((keyword) => (
              <div key={keyword.word} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{keyword.word}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      keyword.sentiment === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : keyword.sentiment === 'negative'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {keyword.sentiment}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{keyword.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Actionable Insights</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {analytics.actionableInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedInsight(insight)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        insight.priority
                      )}`}
                    >
                      {insight.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{insight.category}</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{insight.issue}</h4>
                  <p className="text-sm text-gray-600 mb-2">{insight.impact}</p>
                  <p className="text-sm text-blue-600">{insight.recommendation}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>{insight.affectedUsers} users</div>
                  <div>{insight.estimatedEffort}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setSelectedInsight(null)}
            />
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Insight Details</h3>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div>
                <div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                      selectedInsight.priority
                    )}`}
                  >
                    {selectedInsight.priority.toUpperCase()} PRIORITY
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Issue</h4>
                  <p className="text-sm text-gray-600">{selectedInsight.issue}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Impact</h4>
                  <p className="text-sm text-gray-600">{selectedInsight.impact}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Recommendation</h4>
                  <p className="text-sm text-gray-600">{selectedInsight.recommendation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Affected Users</h4>
                    <p className="text-sm text-gray-600">{selectedInsight.affectedUsers}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Estimated Effort</h4>
                    <p className="text-sm text-gray-600">{selectedInsight.estimatedEffort}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
