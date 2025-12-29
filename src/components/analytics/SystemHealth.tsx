import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Cpu,
    HardDrive,
    Network,
    Clock,
    AlertTriangle,
    CheckCircle,
    Server,
    Zap
} from 'lucide-react';

interface SystemHealthProps {
  data: {
    timestamp: string;
    overall_health: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
    uptime_hours: number;
    error_rate: number;
    response_time_p95: number;
  };
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ data }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUsageColor = (usage: number, thresholds = { warning: 70, critical: 90 }) => {
    if (usage >= thresholds.critical) return 'bg-red-500';
    if (usage >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);

    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    } else if (remainingHours > 0) {
      return `${remainingHours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getHealthIcon(data.overall_health)}
            <span>System Health Overview</span>
          </CardTitle>
          <CardDescription>
            Current system status and key health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(data.overall_health)}`}>
                {data.overall_health.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Status</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatUptime(data.uptime_hours)}
              </div>
              <div className="text-sm text-gray-600 mt-1">System Uptime</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.active_connections}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Connections</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.response_time_p95.toFixed(2)}s
              </div>
              <div className="text-sm text-gray-600 mt-1">95th Percentile Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              <span>CPU Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {data.cpu_usage.toFixed(1)}%
                </div>
              </div>

              <Progress
                value={data.cpu_usage}
                className="h-3"
              />

              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              <div className="text-center">
                <Badge
                  variant={data.cpu_usage > 90 ? "destructive" : data.cpu_usage > 70 ? "secondary" : "default"}
                >
                  {data.cpu_usage > 90 ? "Critical" : data.cpu_usage > 70 ? "Warning" : "Normal"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {data.memory_usage.toFixed(1)}%
                </div>
              </div>

              <Progress
                value={data.memory_usage}
                className="h-3"
              />

              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              <div className="text-center">
                <Badge
                  variant={data.memory_usage > 90 ? "destructive" : data.memory_usage > 80 ? "secondary" : "default"}
                >
                  {data.memory_usage > 90 ? "Critical" : data.memory_usage > 80 ? "Warning" : "Normal"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              <span>Disk Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {data.disk_usage.toFixed(1)}%
                </div>
              </div>

              <Progress
                value={data.disk_usage}
                className="h-3"
              />

              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              <div className="text-center">
                <Badge
                  variant={data.disk_usage > 95 ? "destructive" : data.disk_usage > 85 ? "secondary" : "default"}
                >
                  {data.disk_usage > 95 ? "Critical" : data.disk_usage > 85 ? "Warning" : "Normal"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Response Time</span>
            </CardTitle>
            <CardDescription>
              95th percentile response time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {data.response_time_p95.toFixed(2)}s
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Target: &lt; 3.0s
                </div>
              </div>

              <div className="text-center">
                <Badge
                  variant={data.response_time_p95 > 3 ? "destructive" : data.response_time_p95 > 2 ? "secondary" : "default"}
                >
                  {data.response_time_p95 > 3 ? "Slow" : data.response_time_p95 > 2 ? "Moderate" : "Fast"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Error Rate</span>
            </CardTitle>
            <CardDescription>
              System error rate percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600">
                  {(data.error_rate * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Target: &lt; 1.0%
                </div>
              </div>

              <div className="text-center">
                <Badge
                  variant={data.error_rate > 0.05 ? "destructive" : data.error_rate > 0.01 ? "secondary" : "default"}
                >
                  {data.error_rate > 0.05 ? "High" : data.error_rate > 0.01 ? "Moderate" : "Low"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network and Connectivity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            <span>Network & Connectivity</span>
          </CardTitle>
          <CardDescription>
            Network status and connection metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.active_connections}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Connections</div>
              <div className="text-xs text-gray-500 mt-1">
                Current concurrent connections
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                99.9%
              </div>
              <div className="text-sm text-gray-600 mt-1">Network Availability</div>
              <div className="text-xs text-gray-500 mt-1">
                Last 24 hours
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                &lt; 50ms
              </div>
              <div className="text-sm text-gray-600 mt-1">Network Latency</div>
              <div className="text-xs text-gray-500 mt-1">
                Average round-trip time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span>Health Recommendations</span>
          </CardTitle>
          <CardDescription>
            Automated system health recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {data.cpu_usage > 80 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">High CPU Usage</div>
                  <div className="text-sm text-yellow-700">
                    CPU usage is at {data.cpu_usage.toFixed(1)}%. Consider scaling up resources or optimizing processes.
                  </div>
                </div>
              </div>
            )}

            {data.memory_usage > 85 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">High Memory Usage</div>
                  <div className="text-sm text-red-700">
                    Memory usage is at {data.memory_usage.toFixed(1)}%. Memory optimization or scaling recommended.
                  </div>
                </div>
              </div>
            )}

            {data.response_time_p95 > 3 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-800">Slow Response Times</div>
                  <div className="text-sm text-orange-700">
                    95th percentile response time is {data.response_time_p95.toFixed(2)}s. Performance optimization needed.
                  </div>
                </div>
              </div>
            )}

            {data.cpu_usage < 80 && data.memory_usage < 85 && data.response_time_p95 < 3 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">System Running Optimally</div>
                  <div className="text-sm text-green-700">
                    All system metrics are within healthy ranges. No immediate action required.
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
