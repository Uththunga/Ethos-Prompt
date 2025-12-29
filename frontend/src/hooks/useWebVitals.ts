import { useCallback, useEffect, useMemo, useState } from 'react';
import { webVitalsTracker, type WebVitalMetric } from '../utils/webVitals';

interface WebVitalsState {
  metrics: WebVitalMetric[];
  summary: { [key: string]: { value: number; rating: string } };
  isLoading: boolean;
  lastMetric: WebVitalMetric | null;
}

/**
 * Hook for tracking and accessing Web Vitals metrics
 */
export function useWebVitals() {
  const [state, setState] = useState<WebVitalsState>({
    metrics: [],
    summary: {},
    isLoading: true,
    lastMetric: null
  });

  useEffect(() => {
    // Subscribe to new metrics
    const unsubscribe = webVitalsTracker.onMetric((metric) => {
      setState(prev => ({
        ...prev,
        metrics: [...prev.metrics, metric],
        summary: webVitalsTracker.getSummary(),
        lastMetric: metric,
        isLoading: false
      }));
    });

    // Initial load
    setState(prev => ({
      ...prev,
      metrics: webVitalsTracker.getMetrics(),
      summary: webVitalsTracker.getSummary(),
      isLoading: false
    }));

    return unsubscribe;
  }, []);

  const clearMetrics = useCallback(() => {
    webVitalsTracker.clear();
    setState({
      metrics: [],
      summary: {},
      isLoading: false,
      lastMetric: null
    });
  }, []);

  const getMetricsByName = useCallback((name: string) => {
    return state.metrics.filter(metric => metric.name === name);
  }, [state.metrics]);

  const getLatestMetric = useCallback((name: string) => {
    const metrics = getMetricsByName(name);
    return metrics[metrics.length - 1] || null;
  }, [getMetricsByName]);

  const getOverallScore = useCallback(() => {
    const coreMetrics = ['LCP', 'FID', 'CLS'];
    const scores = coreMetrics.map(name => {
      const metric = getLatestMetric(name);
      if (!metric) return null;

      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return null;
      }
    }).filter(score => score !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [getLatestMetric]);

  return {
    ...state,
    clearMetrics,
    getMetricsByName,
    getLatestMetric,
    getOverallScore
  };
}

/**
 * Hook for monitoring specific Web Vital
 */
export function useWebVital(metricName: string) {
  const [metric, setMetric] = useState<WebVitalMetric | null>(null);
  const [history, setHistory] = useState<WebVitalMetric[]>([]);

  useEffect(() => {
    const unsubscribe = webVitalsTracker.onMetric((newMetric) => {
      if (newMetric.name === metricName) {
        setMetric(newMetric);
        setHistory(prev => [...prev, newMetric]);
      }
    });

    // Get existing metrics
    const existingMetrics = webVitalsTracker.getMetrics().filter(m => m.name === metricName);
    if (existingMetrics.length > 0) {
      setMetric(existingMetrics[existingMetrics.length - 1]);
      setHistory(existingMetrics);
    }

    return unsubscribe;
  }, [metricName]);

  return { metric, history };
}

/**
 * Hook for performance alerts
 */
export function usePerformanceAlerts(thresholds?: { [key: string]: number }) {
  const [alerts, setAlerts] = useState<Array<{
    metric: WebVitalMetric;
    message: string;
    severity: 'warning' | 'error';
    timestamp: number;
  }>>([]);

  const defaultThresholds = useMemo(() => ({
    LCP: 4000, // 4 seconds
    FID: 300,  // 300ms
    CLS: 0.25, // 0.25
    FCP: 3000, // 3 seconds
    TTFB: 1800 // 1.8 seconds
  }), []);

  const activeThresholds = useMemo(() => ({ ...defaultThresholds, ...thresholds }), [thresholds, defaultThresholds]);

  useEffect(() => {
    const unsubscribe = webVitalsTracker.onMetric((metric) => {
      const threshold = activeThresholds[metric.name];
      if (!threshold) return;

      let severity: 'warning' | 'error' | null = null;
      let message = '';

      if (metric.rating === 'poor') {
        severity = 'error';
        message = `Poor ${metric.name}: ${metric.value.toFixed(2)}${getMetricUnit(metric.name)} (threshold: ${threshold}${getMetricUnit(metric.name)})`;
      } else if (metric.rating === 'needs-improvement') {
        severity = 'warning';
        message = `${metric.name} needs improvement: ${metric.value.toFixed(2)}${getMetricUnit(metric.name)}`;
      }

      if (severity) {
        setAlerts(prev => [...prev, {
          metric,
          message,
          severity,
          timestamp: Date.now()
        }].slice(-10)); // Keep only last 10 alerts
      }
    });

    return unsubscribe;
  }, [activeThresholds]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const dismissAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { alerts, clearAlerts, dismissAlert };
}

/**
 * Hook for real user monitoring
 */
export function useRealUserMonitoring() {
  const [sessionData, setSessionData] = useState({
    sessionId: '',
    startTime: Date.now(),
    pageViews: 0,
    interactions: 0,
    errors: 0
  });

  useEffect(() => {
    // Track page views
    const handlePageView = () => {
      setSessionData(prev => ({
        ...prev,
        pageViews: prev.pageViews + 1
      }));
    };

    // Track user interactions
    const handleInteraction = () => {
      setSessionData(prev => ({
        ...prev,
        interactions: prev.interactions + 1
      }));
    };

    // Track errors
    const handleError = () => {
      setSessionData(prev => ({
        ...prev,
        errors: prev.errors + 1
      }));
    };

    // Set up event listeners
    window.addEventListener('popstate', handlePageView);
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('popstate', handlePageView);
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const getSessionDuration = useCallback(() => {
    return Date.now() - sessionData.startTime;
  }, [sessionData.startTime]);

  return {
    ...sessionData,
    getSessionDuration
  };
}

// Helper function to get metric unit
function getMetricUnit(metricName: string): string {
  switch (metricName) {
    case 'LCP':
    case 'FID':
    case 'FCP':
    case 'TTFB':
    case 'TBT':
    case 'TTI':
      return 'ms';
    case 'CLS':
      return '';
    default:
      return '';
  }
}
