/**
 * Real-Time Analytics Hook
 * Provides real-time analytics data using Firestore onSnapshot listeners
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface RealtimeMetrics {
  timestamp: Date;
  executionsPerMinute: number;
  activeExecutions: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  topModels: Array<{ model: string; count: number }>;
  recentRatings: Array<{ rating: number; timestamp: Date }>;
}

export interface ExecutionEvent {
  id: string;
  promptId: string;
  promptTitle: string;
  model: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  cost: number;
  duration?: number;
  rating?: number;
}

export interface CostUpdate {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
  executionId: string;
}

export interface RatingSubmission {
  id: string;
  executionId: string;
  rating: number;
  timestamp: Date;
  userId: string;
}

interface UseRealtimeAnalyticsOptions {
  enabled?: boolean;
  timeWindow?: number; // minutes
  userId?: string;
}

/**
 * Hook for real-time execution events
 */
export function useRealtimeExecutions(options: UseRealtimeAnalyticsOptions = {}) {
  const { enabled = true, timeWindow = 5, userId } = options;
  const { currentUser } = useAuth();
  const [executions, setExecutions] = useState<ExecutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !currentUser) {
      setLoading(false);
      return;
    }

    const targetUserId = userId || currentUser.uid;
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindow);

    try {
      const executionsRef = collection(db, 'executions');
      const constraints: QueryConstraint[] = [
        where('userId', '==', targetUserId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc'),
        limit(50),
      ];

      const q = query(executionsRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const executionData: ExecutionEvent[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              promptId: data.promptId || '',
              promptTitle: data.promptTitle || 'Untitled',
              model: data.model || 'Unknown',
              status: data.status || 'completed',
              timestamp: data.timestamp?.toDate() || new Date(),
              cost: data.cost || 0,
              duration: data.duration,
              rating: data.rating,
            };
          });

          setExecutions(executionData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error in realtime executions listener:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up realtime executions listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [enabled, timeWindow, userId, currentUser]);

  return { executions, loading, error };
}

/**
 * Hook for real-time rating submissions
 */
export function useRealtimeRatings(options: UseRealtimeAnalyticsOptions = {}) {
  const { enabled = true, timeWindow = 60, userId } = options;
  const { currentUser } = useAuth();
  const [ratings, setRatings] = useState<RatingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !currentUser) {
      setLoading(false);
      return;
    }

    const targetUserId = userId || currentUser.uid;
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindow);

    try {
      const ratingsRef = collection(db, 'execution_ratings');
      const constraints: QueryConstraint[] = [
        where('userId', '==', targetUserId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc'),
        limit(20),
      ];

      const q = query(ratingsRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ratingData: RatingSubmission[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              executionId: data.executionId || '',
              rating: data.rating || 0,
              timestamp: data.timestamp?.toDate() || new Date(),
              userId: data.userId || '',
            };
          });

          setRatings(ratingData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error in realtime ratings listener:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up realtime ratings listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [enabled, timeWindow, userId, currentUser]);

  return { ratings, loading, error };
}

/**
 * Hook for aggregated real-time metrics
 */
export function useRealtimeMetrics(options: UseRealtimeAnalyticsOptions = {}) {
  const { enabled = true, timeWindow = 5 } = options;
  const { executions, loading: executionsLoading } = useRealtimeExecutions({ enabled, timeWindow });
  const { ratings, loading: ratingsLoading } = useRealtimeRatings({ enabled, timeWindow: 60 });
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateMetrics = useCallback(() => {
    if (executions.length === 0) {
      setMetrics({
        timestamp: new Date(),
        executionsPerMinute: 0,
        activeExecutions: 0,
        totalCost: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        topModels: [],
        recentRatings: [],
      });
      return;
    }

    // Calculate executions per minute
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentExecutions = executions.filter((e) => e.timestamp >= oneMinuteAgo);
    const executionsPerMinute = recentExecutions.length;

    // Active executions (pending status)
    const activeExecutions = executions.filter((e) => e.status === 'pending').length;

    // Total cost
    const totalCost = executions.reduce((sum, e) => sum + e.cost, 0);

    // Average response time
    const executionsWithDuration = executions.filter((e) => e.duration !== undefined);
    const averageResponseTime =
      executionsWithDuration.length > 0
        ? executionsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) /
          executionsWithDuration.length
        : 0;

    // Success and error rates
    const completedExecutions = executions.filter((e) => e.status !== 'pending');
    const successfulExecutions = completedExecutions.filter((e) => e.status === 'completed');
    const successRate =
      completedExecutions.length > 0 ? successfulExecutions.length / completedExecutions.length : 0;
    const errorRate = 1 - successRate;

    // Top models
    const modelCounts = new Map<string, number>();
    executions.forEach((e) => {
      modelCounts.set(e.model, (modelCounts.get(e.model) || 0) + 1);
    });
    const topModels = Array.from(modelCounts.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent ratings
    const recentRatings = ratings
      .filter((r) => r.rating > 0)
      .map((r) => ({ rating: r.rating, timestamp: r.timestamp }))
      .slice(0, 10);

    setMetrics({
      timestamp: now,
      executionsPerMinute,
      activeExecutions,
      totalCost,
      averageResponseTime,
      successRate,
      errorRate,
      topModels,
      recentRatings,
    });
  }, [executions, ratings]);

  useEffect(() => {
    if (!enabled || executionsLoading || ratingsLoading) {
      return;
    }

    // Calculate metrics immediately
    calculateMetrics();

    // Update metrics every 5 seconds
    updateIntervalRef.current = setInterval(calculateMetrics, 5000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [enabled, executionsLoading, ratingsLoading, calculateMetrics]);

  return {
    metrics,
    loading: executionsLoading || ratingsLoading,
    refresh: calculateMetrics,
  };
}

