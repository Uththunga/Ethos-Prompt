import React, { useEffect, useState } from 'react';
import {
  apiPerformanceMonitor,
  type APIStats,
  type PerformanceAlert,
} from '../../utils/apiPerformanceMonitor';

interface APIPerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const APIPerformanceMonitor: React.FC<APIPerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-left',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<APIStats[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'alerts'>('stats');

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to stats updates
    const unsubscribeStats = apiPerformanceMonitor.onStatsUpdate(setStats);

    // Subscribe to alerts
    const unsubscribeAlerts = apiPerformanceMonitor.onAlert((alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    });

    // Initial load
    setStats(apiPerformanceMonitor.getStats());
    setAlerts(apiPerformanceMonitor.getRecentAlerts(60)); // Last hour

    return () => {
      unsubscribeStats();
      unsubscribeAlerts();
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getStatusColor = (errorRate: number, avgResponseTime: number) => {
    if (errorRate > 0.1 || avgResponseTime > 2000) return 'text-red-500';
    if (errorRate > 0.05 || avgResponseTime > 1000) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${
          alerts.length > 0
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
        title="Toggle API Performance Monitor"
      >
        📡 API {alerts.length > 0 && `(${alerts.length})`}
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="mt-2 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 font-mono text-xs w-96 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold">API Performance</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'alerts'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Alerts {alerts.length > 0 && `(${alerts.length})`}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {activeTab === 'stats' && (
              <div >
                {stats.length === 0 ? (
                  <p className="text-gray-400">No API calls recorded yet</p>
                ) : (
                  stats.map((stat, index) => (
                    <div key={index} className="border border-gray-700 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-semibold text-ethos-purple truncate"
                          title={stat.endpoint}
                        >
                          {stat.endpoint.length > 30
                            ? `...${stat.endpoint.slice(-30)}`
                            : stat.endpoint}
                        </span>
                        <span
                          className={`text-xs ${getStatusColor(
                            stat.errorRate,
                            stat.averageResponseTime
                          )}`}
                        >
                          {stat.totalRequests} calls
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Avg:</span>{' '}
                          {formatTime(stat.averageResponseTime)}
                        </div>
                        <div>
                          <span className="text-gray-400">P95:</span>{' '}
                          {formatTime(stat.p95ResponseTime)}
                        </div>
                        <div>
                          <span className="text-gray-400">Success:</span>{' '}
                          {formatPercentage(stat.successRate)}
                        </div>
                        <div>
                          <span className="text-gray-400">Error:</span>{' '}
                          {formatPercentage(stat.errorRate)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div >
                {alerts.length === 0 ? (
                  <p className="text-gray-400">No alerts</p>
                ) : (
                  alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`border rounded p-2 ${
                        alert.type === 'server_error' || alert.type === 'timeout'
                          ? 'border-red-500 bg-red-900/20'
                          : 'border-yellow-500 bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            alert.type === 'server_error' || alert.type === 'timeout'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 mb-1">{alert.endpoint}</div>
                      <div className="text-xs text-gray-400">{alert.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 p-3 flex gap-2">
            <button
              onClick={() => {
                setStats(apiPerformanceMonitor.getStats());
                setAlerts(apiPerformanceMonitor.getRecentAlerts(60));
              }}
              className="bg-ethos-purple hover:bg-ethos-purple-light text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                const data = apiPerformanceMonitor.exportMetrics();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `api-metrics-${new Date().toISOString().slice(0, 19)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => {
                apiPerformanceMonitor.clear();
                setStats([]);
                setAlerts([]);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Performance alert toast component
export const APIPerformanceAlerts: React.FC<{ enabled?: boolean }> = ({
  enabled = process.env.NODE_ENV === 'development',
}) => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = apiPerformanceMonitor.onAlert((alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts

      // Auto-remove alert after 10 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.timestamp !== alert.timestamp));
      }, 10000);
    });

    return unsubscribe;
  }, [enabled]);

  if (!enabled || alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {alerts.map((alert) => (
        <div
          key={`${alert.timestamp}-${alert.endpoint}-${alert.type}`}
          className={`p-3 rounded-lg shadow-lg max-w-sm animate-slide-in-right ${
            alert.type === 'server_error' || alert.type === 'timeout'
              ? 'bg-red-100 border-l-4 border-red-500 text-red-700'
              : 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{alert.type.replace('_', ' ').toUpperCase()}</h4>
            <button
              onClick={() =>
                setAlerts((prev) => prev.filter((a) => a.timestamp !== alert.timestamp))
              }
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-xs mt-1 font-mono">{alert.endpoint}</p>
          <p className="text-sm mt-1">{alert.message}</p>
        </div>
      ))}
    </div>
  );
};
