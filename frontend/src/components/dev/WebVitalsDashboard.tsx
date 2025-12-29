import React, { useState } from 'react';
import { usePerformanceAlerts, useWebVitals } from '../../hooks/useWebVitals';

interface WebVitalsDashboardProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const WebVitalsDashboard: React.FC<WebVitalsDashboardProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts'>('metrics');
  const { metrics, summary, getOverallScore, clearMetrics } = useWebVitals();
  const { alerts, clearAlerts, dismissAlert } = usePerformanceAlerts();

  // Hide in runtime E2E mode to avoid intercepting clicks in tests
  const isRuntimeE2E = (() => {
    try {
      return (
        localStorage.getItem('e2eAuth') === 'true' || localStorage.getItem('e2eMode') === 'true'
      );
    } catch {
      return false;
    }
  })();

  if (!enabled || isRuntimeE2E) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const overallScore = getOverallScore();
  const hasAlerts = alerts.length > 0;

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return Math.round(value).toString();
  };

  const getUnit = (name: string) => {
    if (name === 'CLS') return '';
    return 'ms';
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${
          hasAlerts
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            : overallScore !== null && overallScore >= 80
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
        }`}
        title="Toggle Web Vitals Dashboard"
      >
        📊 Vitals {overallScore !== null && `(${overallScore})`}
        {hasAlerts && ` (${alerts.length})`}
      </button>

      {/* Dashboard Panel */}
      {isVisible && (
        <div className="mt-2 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 font-mono text-xs w-96 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold">Web Vitals</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'metrics'
                    ? 'bg-ethos-purple text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'alerts'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Alerts {alerts.length > 0 && `(${alerts.length})`}
              </button>
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
          <div className="p-3 max-h-80 overflow-y-auto">
            {activeTab === 'metrics' && (
              <div>
                {/* Overall Score */}
                {overallScore !== null && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold">Overall Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore}/100
                    </div>
                  </div>
                )}

                {/* Core Web Vitals */}
                <div>
                  <h4 className="font-semibold text-sm">Core Web Vitals</h4>
                  {['LCP', 'FID', 'CLS'].map((metricName) => {
                    const metric = summary[metricName];
                    return (
                      <div
                        key={metricName}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="font-medium">{metricName}</span>
                        {metric ? (
                          <div className="text-right">
                            <div className={`font-bold ${getRatingColor(metric.rating)}`}>
                              {formatValue(metricName, metric.value)}
                              {getUnit(metricName)}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {metric.rating.replace('-', ' ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Other Metrics */}
                <div>
                  <h4 className="font-semibold text-sm">Other Metrics</h4>
                  {['FCP', 'TTFB', 'TBT', 'TTI'].map((metricName) => {
                    const metric = summary[metricName];
                    return (
                      <div
                        key={metricName}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="font-medium">{metricName}</span>
                        {metric ? (
                          <div className="text-right">
                            <div className={`font-bold ${getRatingColor(metric.rating)}`}>
                              {formatValue(metricName, metric.value)}
                              {getUnit(metricName)}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {metric.rating.replace('-', ' ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {metrics.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No metrics collected yet</p>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No alerts</p>
                ) : (
                  alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'error'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            alert.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <button
                          onClick={() => dismissAlert(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-xs text-gray-700">{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <button
              onClick={clearMetrics}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Clear Metrics
            </button>
            {alerts.length > 0 && (
              <button
                onClick={clearAlerts}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                Clear Alerts
              </button>
            )}
            <button
              onClick={() => console.log('Web Vitals:', { metrics, summary, alerts })}
              className="bg-ethos-purple hover:bg-ethos-purple-light text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Log Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
