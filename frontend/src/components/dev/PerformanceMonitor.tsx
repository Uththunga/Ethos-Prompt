import React, { useEffect, useState } from 'react';
import { performanceProfiler } from '../../utils/performanceProfiler';

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setReport(performanceProfiler.generateReport());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setReport(performanceProfiler.generateReport());
    }
  };

  const clearMetrics = () => {
    performanceProfiler.clear();
    setReport('Metrics cleared');
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="bg-ethos-purple hover:bg-ethos-purple-light text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
        title="Toggle Performance Monitor"
      >
        📊 Perf
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="mt-2 bg-white text-ethos-navy rounded-lg shadow-xl border border-gray-200 font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-ethos-navy">Performance Monitor</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-600 hover:text-ethos-purple transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '📈' : '📉'}
              </button>
              <button
                onClick={clearMetrics}
                className="text-gray-600 hover:text-red-600 transition-colors"
                title="Clear Metrics"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-600 hover:text-ethos-purple transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="p-3">
              <div className="max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                  {report || 'No performance data available'}
                </pre>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => setReport(performanceProfiler.generateReport())}
                  className="bg-ethos-purple hover:bg-ethos-purple-light text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => console.log(performanceProfiler.generateReport())}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Log to Console
                </button>
                <button
                  onClick={() => {
                    const slowest = performanceProfiler.getSlowestComponents(5);
                    console.table(slowest);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Log Slowest
                </button>
              </div>
            </div>
          )}

          {/* Minimized View */}
          {isMinimized && (
            <div className="p-3">
              <div className="text-xs">
                <div>Renders: {performanceProfiler['metrics']?.length || 0}</div>
                <div>Enabled: {performanceProfiler.enabled ? '✅' : '❌'}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Performance warning component for slow renders
export const PerformanceWarning: React.FC<{ threshold?: number }> = ({ threshold = 16 }) => {
  const [slowRenders, setSlowRenders] = useState<string[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const checkInterval = setInterval(() => {
      const slowComponents = performanceProfiler
        .getSlowestComponents(3)
        .filter((comp) => comp.avgTime > threshold)
        .map((comp) => `${comp.name}: ${comp.avgTime.toFixed(1)}ms`);

      setSlowRenders(slowComponents);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [threshold]);

  if (process.env.NODE_ENV !== 'development' || slowRenders.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg max-w-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Performance Warning</p>
            <div className="mt-1 text-sm">
              <p>Slow components detected:</p>
              <ul className="list-disc list-inside mt-1">
                {slowRenders.map((render, index) => (
                  <li key={index} className="text-xs">
                    {render}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
