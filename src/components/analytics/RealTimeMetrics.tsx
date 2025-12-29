import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Search, Zap,
    Database,
    Cpu,
    HardDrive
} from 'lucide-react';

interface RealTimeMetricsProps {
  data: {
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
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ data }) => {
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatTime = (seconds: number) => `${seconds.toFixed(2)}s`;

  const getStatusColor = (rate: number, isError: boolean = false) => {
    if (isError) {
      if (rate < 0.01) return 'text-green-600';
      if (rate < 0.05) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (rate > 0.95) return 'text-green-600';
      if (rate > 0.8) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getProgressColor = (value: number, isError: boolean = false) => {
    if (isError) {
      if (value < 1) return 'bg-green-500';
      if (value < 5) return 'bg-yellow-500';
      return 'bg-red-500';
    } else {
      if (value > 95) return 'bg-green-500';
      if (value > 80) return 'bg-yellow-500';
      return 'bg-red-500';
    }
  };

  const totalSearches = Object.values(data.search_type_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(data.success_rate)}`}>
                  {formatPercentage(data.success_rate)}
                </p>
              </div>
              <CheckCircle className={`w-8 h-8 ${getStatusColor(data.success_rate)}`} />
            </div>
            <Progress
              value={data.success_rate * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(data.error_rate, true)}`}>
                  {formatPercentage(data.error_rate)}
                </p>
              </div>
              <AlertCircle className={`w-8 h-8 ${getStatusColor(data.error_rate, true)}`} />
            </div>
            <Progress
              value={data.error_rate * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(data.cache_hit_rate)}`}>
                  {formatPercentage(data.cache_hit_rate)}
                </p>
              </div>
              <Database className={`w-8 h-8 ${getStatusColor(data.cache_hit_rate)}`} />
            </div>
            <Progress
              value={data.cache_hit_rate * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className={`text-2xl font-bold ${data.avg_response_time < 1 ? 'text-green-600' : data.avg_response_time < 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatTime(data.avg_response_time)}
                </p>
              </div>
              <Clock className={`w-8 h-8 ${data.avg_response_time < 1 ? 'text-green-600' : data.avg_response_time < 3 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Target: &lt; 3.0s
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span>Search Activity</span>
            </CardTitle>
            <CardDescription>Recent search volume and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Searches (5min)</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {data.searches_last_5min}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Sessions</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {data.active_sessions}
                </Badge>
              </div>

              <div className="text-xs text-gray-500">
                Rate: {(data.searches_last_5min / 5).toFixed(1)} searches/min
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Search Types</span>
            </CardTitle>
            <CardDescription>Distribution of search methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Object.entries(data.search_type_distribution).map(([type, count]) => {
                const percentage = totalSearches > 0 ? (count / totalSearches) * 100 : 0;
                return (
                  <div key={type} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span>System Resources</span>
            </CardTitle>
            <CardDescription>Current system utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm font-bold">{data.current_cpu_usage.toFixed(1)}%</span>
                </div>
                <Progress
                  value={data.current_cpu_usage}
                  className="h-2"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm font-bold">{data.current_memory_usage.toFixed(1)}%</span>
                </div>
                <Progress
                  value={data.current_memory_usage}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Performance Summary</span>
          </CardTitle>
          <CardDescription>
            Real-time performance indicators and health status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.searches_last_5min}
              </div>
              <div className="text-sm text-gray-600">Recent Searches</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getStatusColor(data.success_rate)}`}>
                {formatPercentage(data.success_rate)}
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(data.avg_response_time)}
              </div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.active_sessions}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge
              variant={data.success_rate > 0.95 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Search Success: {formatPercentage(data.success_rate)}</span>
            </Badge>

            <Badge
              variant={data.avg_response_time < 3 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Response Time: {formatTime(data.avg_response_time)}</span>
            </Badge>

            <Badge
              variant={data.cache_hit_rate > 0.8 ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              <Database className="w-3 h-3" />
              <span>Cache Hit: {formatPercentage(data.cache_hit_rate)}</span>
            </Badge>

            <Badge
              variant={data.error_rate < 0.05 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Error Rate: {formatPercentage(data.error_rate)}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
