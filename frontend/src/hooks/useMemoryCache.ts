import { useCallback, useEffect, useRef, useState } from 'react';
import { apiCache, cacheManager, CacheStats, MemoryCache } from '../utils/memoryCache';

/**
 * Hook for using memory cache with React state
 */
export function useMemoryCache<T>(
  cacheName: string = 'default',
  options?: { ttl?: number; maxEntries?: number }
) {
  const cache = useRef<MemoryCache<T>>();
  const [stats, setStats] = useState<CacheStats | null>(null);

  // Initialize cache
  useEffect(() => {
    cache.current = cacheManager.getCache<T>(cacheName, options);
    setStats(cache.current.getStats());
  }, [cacheName, options]);

  const set = useCallback((key: string, data: T, ttl?: number) => {
    if (cache.current) {
      cache.current.set(key, data, ttl);
      setStats(cache.current.getStats());
    }
  }, []);

  const get = useCallback((key: string): T | null => {
    if (!cache.current) return null;
    const result = cache.current.get(key);
    setStats(cache.current.getStats());
    return result;
  }, []);

  const has = useCallback((key: string): boolean => {
    return cache.current ? cache.current.has(key) : false;
  }, []);

  const remove = useCallback((key: string): boolean => {
    if (!cache.current) return false;
    const result = cache.current.delete(key);
    setStats(cache.current.getStats());
    return result;
  }, []);

  const clear = useCallback(() => {
    if (cache.current) {
      cache.current.clear();
      setStats(cache.current.getStats());
    }
  }, []);

  const getOrSet = useCallback(async (
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> => {
    if (!cache.current) {
      return await factory();
    }

    const result = await cache.current.getOrSet(key, factory, ttl);
    setStats(cache.current.getStats());
    return result;
  }, []);

  const invalidatePattern = useCallback((pattern: RegExp): number => {
    if (!cache.current) return 0;
    const count = cache.current.invalidatePattern(pattern);
    setStats(cache.current.getStats());
    return count;
  }, []);

  return {
    set,
    get,
    has,
    remove,
    clear,
    getOrSet,
    invalidatePattern,
    stats
  };
}

/**
 * Hook for cached API calls
 */
export function useCachedAPI<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refreshInterval?: number;
    staleTime?: number;
  } = {}
) {
  const {
    ttl = 300000, // 5 minutes
    enabled = true,
    refreshInterval,
    staleTime = 60000 // 1 minute
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    const cached = apiCache.get(key);
    if (cached && !force) {
      setData(cached);
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      apiCache.set(key, result, ttl);
      setData(result);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetch;
      if (timeSinceLastFetch >= staleTime) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, enabled, lastFetch, staleTime, fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  const invalidate = useCallback(() => {
    apiCache.delete(key);
    setData(null);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    lastFetch
  };
}

/**
 * Hook for memoized computations with caching
 */
export function useMemoizedComputation<T, Args extends unknown[]>(
  computation: (...args: Args) => T | Promise<T>,
  dependencies: Args,
  options: {
    ttl?: number;
    cacheName?: string;
    keyGenerator?: (...args: Args) => string;
  } = {}
) {
  const {
    ttl = 300000,
    cacheName = 'computations',
    keyGenerator = (...args) => JSON.stringify(args)
  } = options;

  const [result, setResult] = useState<T | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cache = useRef<MemoryCache<T>>();

  useEffect(() => {
    cache.current = cacheManager.getCache<T>(cacheName);
  }, [cacheName]);

  useEffect(() => {
    const computeResult = async () => {
      if (!cache.current) return;

      const key = keyGenerator(...dependencies);

      // Check cache first
      const cached = cache.current.get(key);
      if (cached !== null) {
        setResult(cached);
        return;
      }

      setIsComputing(true);
      setError(null);

      try {
        const computed = await computation(...dependencies);
        cache.current.set(key, computed, ttl);
        setResult(computed);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsComputing(false);
      }
    };

    computeResult();
  }, [computation, keyGenerator, ttl, dependencies]);

  const invalidate = useCallback(() => {
    if (cache.current) {
      const key = keyGenerator(...dependencies);
      cache.current.delete(key);
      setResult(null);
    }
  }, [keyGenerator, dependencies]);

  return {
    result,
    isComputing,
    error,
    invalidate
  };
}

/**
 * Hook for cache warming
 */
export function useCacheWarming() {
  const [isWarming, setIsWarming] = useState(false);
  const [warmingProgress, setWarmingProgress] = useState(0);

  const warmCache = useCallback(async (
    cacheName: string,
    entries: Array<{
      key: string;
      fetcher: () => Promise<unknown>;
      ttl?: number;
    }>
  ) => {
    setIsWarming(true);
    setWarmingProgress(0);

    const cache = cacheManager.getCache(cacheName);
    const total = entries.length;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        const data = await entry.fetcher();
        cache.set(entry.key, data, entry.ttl);
      } catch (error) {
        console.warn(`Failed to warm cache for key ${entry.key}:`, error);
      }

      setWarmingProgress((i + 1) / total);
    }

    setIsWarming(false);
  }, []);

  const warmAPICache = useCallback(async (
    endpoints: Array<{
      key: string;
      url: string;
      ttl?: number;
    }>
  ) => {
    const entries = endpoints.map(endpoint => ({
      key: endpoint.key,
      fetcher: () => fetch(endpoint.url).then(res => res.json()),
      ttl: endpoint.ttl
    }));

    await warmCache('api', entries);
  }, [warmCache]);

  return {
    warmCache,
    warmAPICache,
    isWarming,
    warmingProgress
  };
}

/**
 * Hook for cache statistics monitoring
 */
export function useCacheStats(cacheName?: string) {
  const [stats, setStats] = useState<CacheStats | { [key: string]: CacheStats } | null>(null);

  useEffect(() => {
    const updateStats = () => {
      if (cacheName) {
        const cache = cacheManager.getCache(cacheName);
        setStats(cache.getStats());
      } else {
        setStats(cacheManager.getAllStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [cacheName]);

  const clearCache = useCallback((name?: string) => {
    if (name) {
      const cache = cacheManager.getCache(name);
      cache.clear();
    } else {
      cacheManager.clearAll();
    }
  }, []);

  return {
    stats,
    clearCache
  };
}

/**
 * Hook for cache invalidation patterns
 */
export function useCacheInvalidation() {
  const invalidateByPattern = useCallback((
    cacheName: string,
    pattern: RegExp
  ): number => {
    const cache = cacheManager.getCache(cacheName);
    return cache.invalidatePattern(pattern);
  }, []);

  const invalidateByPrefix = useCallback((
    cacheName: string,
    prefix: string
  ): number => {
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    return invalidateByPattern(cacheName, pattern);
  }, [invalidateByPattern]);

  const invalidateAll = useCallback((cacheName: string) => {
    const cache = cacheManager.getCache(cacheName);
    cache.clear();
  }, []);

  return {
    invalidateByPattern,
    invalidateByPrefix,
    invalidateAll
  };
}
