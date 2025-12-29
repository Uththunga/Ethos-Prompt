import React, { useEffect, useState } from 'react';
import { useWebVitals } from '../../hooks/useWebVitals';
import { apiPerformanceMonitor } from '../../utils/apiPerformanceMonitor';
import { performanceProfiler } from '../../utils/performanceProfiler';

interface PerformanceDashboardProps {
  enabled?: boolean;
}

interface WebVitalData {
  value: number;
  rating?: string;
}

interface WebVitals {
  CLS: WebVitalData;
  FID: WebVitalData;
  FCP: WebVitalData;
  LCP: WebVitalData;
  TTFB: WebVitalData;
}

interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

interface ComponentMetric {
  name: string;
  renderTime: number;
  updateCount: number;
  timestamp: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface PerformanceMetrics {
  webVitals: WebVitals;
  apiMetrics: APIMetric[];
  componentMetrics: ComponentMetric[];
  memoryUsage: number;
  networkInfo: NetworkInfo;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  enabled = process.env.NODE_ENV === 'development',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'webvitals' | 'api' | 'components' | 'network'
  >('overview');
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    webVitals: {},
    apiMetrics: [],
    componentMetrics: [],
    memoryUsage: 0,
    networkInfo: {},
  });

  const { summary: webVitalsSummary, getOverallScore } = useWebVitals();

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      setMetrics({
        webVitals: webVitalsSummary,
        apiMetrics: apiPerformanceMonitor.getStats(),
        componentMetrics: performanceProfiler.getSlowestComponents(10),
        memoryUsage:
          (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
            ?.usedJSHeapSize || 0,
        networkInfo: (navigator as Navigator & { connection?: NetworkInfo }).connection || {
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0,
        },
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled, webVitalsSummary]);

  if (!enabled) return null;

  const overallScore = getOverallScore();
  const hasIssues = overallScore !== null && overallScore < 80;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${
          hasIssues
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-ethos-purple hover:bg-ethos-purple-light text-white'
        }`}
        title="Toggle Performance Dashboard"
      >
        📊 Performance {overallScore !== null && `(${overallScore})`}
      </button>

      {/* Dashboard Panel */}
      {isVisible && (
        <div className="mt-2 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 w-[600px] max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Performance Dashboard</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {['overview', 'webvitals', 'api', 'components', 'network'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setActiveTab(
                        tab as 'overview' | 'webvitals' | 'api' | 'components' | 'network'
                      )
                    }
                    className={`px-3 py-1 rounded text-xs transition-colors capitalize ${
                      activeTab === tab
                        ? 'bg-ethos-purple text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && (
              <div >
                {/* Overall Score */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Overall Performance Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore !== null ? `${overallScore}/100` : 'N/A'}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Memory Usage</div>
                    <div className="text-lg font-semibold">{formatBytes(metrics.memoryUsage)}</div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">API Calls</div>
                    <div className="text-lg font-semibold">
                      {metrics.apiMetrics.reduce((sum, api) => sum + api.totalRequests, 0)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Connection</div>
                    <div className="text-lg font-semibold">
                      {metrics.networkInfo.effectiveType || 'Unknown'}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Components</div>
                    <div className="text-lg font-semibold">{metrics.componentMetrics.length}</div>
                  </div>
                </div>

                {/* Core Web Vitals Summary */}
                <div >
                  <h4 className="font-semibold">Core Web Vitals</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['LCP', 'FID', 'CLS'].map((metric) => {
                      const data = metrics.webVitals[metric];
                      return (
                        <div key={metric} className="bg-gray-50 p-2 rounded text-center">
                          <div className="text-xs text-gray-600">{metric}</div>
                          <div
                            className={`text-sm font-semibold ${
                              data
                                ? data.rating === 'good'
                                  ? 'text-green-500'
                                  : data.rating === 'needs-improvement'
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                                : 'text-gray-400'
                            }`}
                          >
                            {data
                              ? `${Math.round(data.value)}${metric === 'CLS' ? '' : 'ms'}`
                              : 'N/A'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'webvitals' && (
              <div >
                {Object.entries(metrics.webVitals).map(([name, data]: [string, WebVitalData]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{name}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {data.rating?.replace('-', ' ') || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {Math.round(data.value)}
                        {name === 'CLS' ? '' : 'ms'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'api' && (
              <div >
                {metrics.apiMetrics.map((api, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-sm truncate">{api.endpoint}</div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <div className="text-gray-600">Avg Response</div>
                        <div className="font-semibold">{Math.round(api.averageResponseTime)}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Success Rate</div>
                        <div className="font-semibold">{Math.round(api.successRate * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Requests</div>
                        <div className="font-semibold">{api.totalRequests}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'components' && (
              <div >
                {metrics.componentMetrics.map((component, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-sm">{component.componentName}</div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <div className="text-gray-600">Avg Render</div>
                        <div className="font-semibold">
                          {component.averageRenderTime.toFixed(2)}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Renders</div>
                        <div className="font-semibold">{component.renderCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'network' && (
              <div >
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-sm">Connection Info</div>
                  <div className="mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{metrics.networkInfo.effectiveType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downlink:</span>
                      <span>{metrics.networkInfo.downlink || 'Unknown'} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RTT:</span>
                      <span>{metrics.networkInfo.rtt || 'Unknown'} ms</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-sm">Browser Info</div>
                  <div className="mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Online:</span>
                      <span>{navigator.onLine ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cores:</span>
                      <span>{navigator.hardwareConcurrency || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <button
              onClick={() => {
                performanceProfiler.clear();
                apiPerformanceMonitor.clear();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
            >
              Clear Data
            </button>
            <button
              onClick={() => {
                const data = {
                  webVitals: metrics.webVitals,
                  apiMetrics: metrics.apiMetrics,
                  componentMetrics: metrics.componentMetrics,
                  timestamp: new Date().toISOString(),
                };
                console.log('Performance Data:', data);
              }}
              className="bg-ethos-purple hover:bg-ethos-purple-light text-white px-3 py-1 rounded text-xs transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
