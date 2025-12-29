import { useState, useEffect, useCallback } from 'react';
import { 
  performanceBudgetMonitor, 
  BudgetViolation, 
  BudgetReport, 
  PerformanceBudget 
} from '../utils/performanceBudgets';

interface PerformanceBudgetState {
  report: BudgetReport | null;
  violations: BudgetViolation[];
  budgets: PerformanceBudget[];
  isLoading: boolean;
  lastUpdate: number;
}

/**
 * Hook for monitoring performance budgets
 */
export function usePerformanceBudgets() {
  const [state, setState] = useState<PerformanceBudgetState>({
    report: null,
    violations: [],
    budgets: [],
    isLoading: true,
    lastUpdate: 0
  });

  const updateState = useCallback(() => {
    const report = performanceBudgetMonitor.getBudgetReport();
    const violations = performanceBudgetMonitor.getViolations();
    const budgets = performanceBudgetMonitor.getBudgets();

    setState({
      report,
      violations,
      budgets,
      isLoading: false,
      lastUpdate: Date.now()
    });
  }, []);

  useEffect(() => {
    // Initial load
    updateState();

    // Subscribe to violations
    const unsubscribe = performanceBudgetMonitor.onViolation(() => {
      updateState();
    });

    // Update periodically
    const interval = setInterval(updateState, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [updateState]);

  const addBudget = useCallback((budget: PerformanceBudget) => {
    performanceBudgetMonitor.addBudget(budget);
    updateState();
  }, [updateState]);

  const removeBudget = useCallback((metricName: string) => {
    performanceBudgetMonitor.removeBudget(metricName);
    updateState();
  }, [updateState]);

  const clearViolations = useCallback(() => {
    performanceBudgetMonitor.clearViolations();
    updateState();
  }, [updateState]);

  const getBudgetStatus = useCallback((metricName: string) => {
    const budget = state.budgets.find(b => b.metric === metricName);
    const recentViolation = state.violations
      .filter(v => v.budget.metric === metricName)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    return {
      budget,
      hasViolation: !!recentViolation,
      lastViolation: recentViolation,
      status: recentViolation 
        ? (recentViolation.severity === 'error' ? 'error' : 'warning')
        : 'ok'
    };
  }, [state.budgets, state.violations]);

  const getOverallHealth = useCallback(() => {
    if (!state.report) return { score: 0, status: 'unknown' };

    const { score } = state.report;
    let status: 'excellent' | 'good' | 'warning' | 'critical';

    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 50) status = 'warning';
    else status = 'critical';

    return { score, status };
  }, [state.report]);

  return {
    ...state,
    addBudget,
    removeBudget,
    clearViolations,
    getBudgetStatus,
    getOverallHealth,
    refresh: updateState
  };
}

/**
 * Hook for monitoring specific budget
 */
export function usePerformanceBudget(metricName: string) {
  const [budget, setBudget] = useState<PerformanceBudget | null>(null);
  const [violations, setViolations] = useState<BudgetViolation[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'ok' | 'warning' | 'error'>('ok');

  useEffect(() => {
    const updateBudgetState = () => {
      const budgets = performanceBudgetMonitor.getBudgets();
      const foundBudget = budgets.find(b => b.metric === metricName);
      const budgetViolations = performanceBudgetMonitor.getViolations()
        .filter(v => v.budget.metric === metricName);

      setBudget(foundBudget || null);
      setViolations(budgetViolations);

      // Determine current status
      const recentViolation = budgetViolations
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (recentViolation && Date.now() - recentViolation.timestamp < 300000) { // 5 minutes
        setCurrentStatus(recentViolation.severity === 'error' ? 'error' : 'warning');
      } else {
        setCurrentStatus('ok');
      }
    };

    updateBudgetState();

    const unsubscribe = performanceBudgetMonitor.onViolation((violation) => {
      if (violation.budget.metric === metricName) {
        updateBudgetState();
      }
    });

    return unsubscribe;
  }, [metricName]);

  return {
    budget,
    violations,
    currentStatus,
    hasViolations: violations.length > 0,
    lastViolation: violations[0] || null
  };
}

/**
 * Hook for budget alerts
 */
export function useBudgetAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    violation: BudgetViolation;
    dismissed: boolean;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    const unsubscribe = performanceBudgetMonitor.onViolation((violation) => {
      const alert = {
        id: `${violation.budget.metric}-${violation.timestamp}`,
        violation,
        dismissed: false,
        timestamp: Date.now()
      };

      setAlerts(prev => [alert, ...prev].slice(0, 20)); // Keep last 20 alerts
    });

    return unsubscribe;
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, dismissed: true }
          : alert
      )
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  return {
    alerts: activeAlerts,
    allAlerts: alerts,
    dismissAlert,
    clearAlerts,
    hasAlerts: activeAlerts.length > 0
  };
}

/**
 * Hook for budget configuration
 */
export function useBudgetConfiguration() {
  const [budgets, setBudgets] = useState<PerformanceBudget[]>([]);

  useEffect(() => {
    setBudgets(performanceBudgetMonitor.getBudgets());
  }, []);

  const addBudget = useCallback((budget: PerformanceBudget) => {
    performanceBudgetMonitor.addBudget(budget);
    setBudgets(performanceBudgetMonitor.getBudgets());
  }, []);

  const updateBudget = useCallback((metricName: string, updates: Partial<PerformanceBudget>) => {
    const currentBudgets = performanceBudgetMonitor.getBudgets();
    const budgetIndex = currentBudgets.findIndex(b => b.metric === metricName);
    
    if (budgetIndex >= 0) {
      performanceBudgetMonitor.removeBudget(metricName);
      performanceBudgetMonitor.addBudget({
        ...currentBudgets[budgetIndex],
        ...updates
      });
      setBudgets(performanceBudgetMonitor.getBudgets());
    }
  }, []);

  const removeBudget = useCallback((metricName: string) => {
    performanceBudgetMonitor.removeBudget(metricName);
    setBudgets(performanceBudgetMonitor.getBudgets());
  }, []);

  const resetToDefaults = useCallback(() => {
    // Clear all budgets and reinitialize with defaults
    const currentBudgets = performanceBudgetMonitor.getBudgets();
    currentBudgets.forEach(budget => {
      performanceBudgetMonitor.removeBudget(budget.metric);
    });
    
    // The monitor will reinitialize with defaults
    setBudgets(performanceBudgetMonitor.getBudgets());
  }, []);

  return {
    budgets,
    addBudget,
    updateBudget,
    removeBudget,
    resetToDefaults
  };
}
