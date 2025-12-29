/**
 * Browser Cache Hook for Marketing Chat
 *
 * Phase 0 - Task 0.1.1: Browser Cache Implementation
 * Provides client-side caching for instant responses (10-50ms TTFT)
 *
 * Features:
 * - IndexedDB storage for structured data
 * - 24-hour TTL
 * - Automatic cleanup of expired entries
 * - Hit/miss statistics tracking
 * - Max 50MB storage
 */

import { useCallback, useEffect, useState } from 'react';

// Types
interface CachedResponse {
  queryHash: string;
  query: string;
  response: string;
  metadata?: any;
  timestamp: number;
  hitCount: number;
}

interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  cacheSize: number;
}

// Config
const CACHE_NAME = 'molē-cache';
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE_MB = 50;
const MAX_CACHE_ENTRIES = 500; // Maximum number of cached items
const CLEANUP_THRESHOLD_MB = 45; // Start cleanup at 90% capacity
const LRU_CLEANUP_BATCH = 50; // Remove 50 oldest items when over threshold

// Auto-cleanup configuration
const AUTO_CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes (more frequent)

// Production-safe logging (only in development)
const isDev = import.meta.env.DEV;
const log = isDev ? console.log.bind(console) : () => {};
const warn = isDev ? console.warn.bind(console) : () => {};

/**
 * CACHE BYPASS FIX: Short/confirmatory responses like "yes", "no", "ok" are
 * context-dependent and must NOT be cached. These queries need to reach the
 * backend agent which has full conversation history via LangGraph checkpointing.
 *
 * Without this, typing "yes" would return a cached response from a previous
 * "yes" in a completely different conversation context, causing infinite loops.
 */
const UNCACHEABLE_PATTERNS = [
  /^(yes|no|ok|okay|sure|yeah|yep|nope|please|thanks|y|n)$/i,
  /^(go ahead|do it|sounds good|let's do it|proceed|continue)$/i,
  /^(that's it|that's all|nothing else|cheers|ta|too easy|legend)$/i,
];

// Minimum query length for caching (very short queries are usually confirmatory)
const MIN_CACHEABLE_LENGTH = 5;

const shouldCache = (query: string): boolean => {
  const normalized = query.toLowerCase().trim();

  // Don't cache very short queries
  if (normalized.length < MIN_CACHEABLE_LENGTH) {
    return false;
  }

  // Don't cache confirmatory/conversational patterns
  return !UNCACHEABLE_PATTERNS.some(pattern => pattern.test(normalized));
};

// Improved hash function with length suffix to reduce collisions
const hashQuery = (query: string): string => {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Append length to reduce collision probability
  return `${hash.toString(36)}-${normalized.length}`;
};

// Check if entry is expired
const isExpired = (timestamp: number, ttl: number = CACHE_TTL_MS): boolean => {
  return Date.now() - timestamp > ttl;
};

// IndexedDB wrapper
class BrowserCacheDB {
  private db: IDBDatabase | null = null;
  private dbName = CACHE_NAME;
  private storeName = 'responses';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, CACHE_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'queryHash' });
          objectStore.createIndex('timestamp', 'timestamp', {unique: false});
        }
      };
    });
  }

  async get(queryHash: string): Promise<CachedResponse | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(queryHash);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as CachedResponse | undefined;
        if (result && !isExpired(result.timestamp)) {
          resolve(result);
        } else {
          // Entry expired or doesn't exist
          if (result) {
            // Clean up expired entry
            this.delete(queryHash);
          }
          resolve(null);
        }
      };
    });
  }

  async set(entry: CachedResponse): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(queryHash: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(queryHash);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async  getAll(): Promise<CachedResponse[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as CachedResponse[];
        // Filter out expired entries
        const validResults = results.filter(r => !isExpired(r.timestamp));
        resolve(validResults);
      };
    });
  }

  async cleanupExpired(): Promise<number> {
    const all = await this.getAll();
    let deleted = 0;

    for (const entry of all) {
      if (isExpired(entry.timestamp)) {
        await this.delete(entry.queryHash);
        deleted++;
      }
    }

    return deleted;
  }

  async calculateCacheSize(): Promise<number> {
    const all = await this.getAll();
    let totalBytes = 0;

    for (const entry of all) {
      // Estimate size: query + response + metadata
      const entrySize = new Blob([JSON.stringify(entry)]).size;
      totalBytes += entrySize;
    }

    return totalBytes / (1024 * 1024); // Return MB
  }

  async cleanupLRU(count: number = LRU_CLEANUP_BATCH): Promise<number> {
    const all = await this.getAll();

    // Sort by last access time (timestamp) and hit count (least used first)
    const sorted = all.sort((a, b) => {
      // Prioritize: low hit count + old timestamp = first to delete
      const scoreA = a.hitCount + (Date.now() - a.timestamp) / (24 * 60 * 60 * 1000);
      const scoreB = b.hitCount + (Date.now() - b.timestamp) / (24 * 60 * 60 * 1000);
      return scoreA - scoreB;
    });

    // Delete least recently/frequently used items
    const toDelete = sorted.slice(0, count);
    let deleted = 0;

    for (const entry of toDelete) {
      await this.delete(entry.queryHash);
      deleted++;
    }

    console.log(`🗑️ LRU cleanup: Removed ${deleted} least-used cache entries`);
    return deleted;
  }

  async enforceStorageLimit(): Promise<void> {
    const currentSize = await this.calculateCacheSize();
    const entryCount = (await this.getAll()).length;

    // Check size limit
    if (currentSize > CLEANUP_THRESHOLD_MB) {
      console.warn(`⚠️ Cache size ${currentSize.toFixed(1)}MB exceeds ${CLEANUP_THRESHOLD_MB}MB threshold`);
      await this.cleanupLRU(LRU_CLEANUP_BATCH);
    }

    // Check entry count limit
    if (entryCount > MAX_CACHE_ENTRIES) {
      console.warn(`⚠️ Cache entries ${entryCount} exceeds ${MAX_CACHE_ENTRIES} limit`);
      const excess = entryCount - MAX_CACHE_ENTRIES;
      await this.cleanupLRU(excess + 10); // Delete excess + 10 more for buffer
    }
  }

  async getStats(): Promise<{ size: number; count: number; oldest: number | null }> {
    const all = await this.getAll();
    const size = await this.calculateCacheSize();
    const count = all.length;
    const oldest = all.length > 0
      ? Math.min(...all.map(e => e.timestamp))
      : null;

    return { size, count, oldest };
  }
}

// Singleton instance
let cacheDB: BrowserCacheDB | null = null;

const getCacheDB = (): BrowserCacheDB => {
  if (!cacheDB) {
    cacheDB = new BrowserCacheDB();
  }
  return cacheDB;
};

/**
 * Hook for browser-based query caching
 */
export const useBrowserCache = () => {
  const [stats, setStats] = useState<CacheStats>({
    totalHits: 0,
    totalMisses: 0,
    hitRate: 0,
    cacheSize: 0,
  });

  const db = getCacheDB();

  // Initialize and cleanup expired entries on mount
  useEffect(() => {
    const init = async () => {
      try {
        await db.init();

        // Initial cleanup
        const deleted = await db.cleanupExpired();
        if (deleted > 0) {
          log(`🧹 Initial cleanup: Removed ${deleted} expired entries`);
        }

        // Enforce storage limits
        await db.enforceStorageLimit();

        await updateStats();

        // Log cache stats
        const cacheStats = await db.getStats();
        log(`📊 Cache initialized: ${cacheStats.count} items, ${cacheStats.size.toFixed(1)}MB`);
      } catch (error) {
        console.error('Browser cache initialization error:', error);
      }
    };

    init();

    // Smart cleanup interval (adaptive based on storage usage)
    const smartCleanup = async () => {
      try {
        // Step 1: Clean expired entries
        const deleted = await db.cleanupExpired();
        if (deleted > 0) {
          log(`🧹 Auto-cleanup: Removed ${deleted} expired entries`);
        }

        // Step 2: Check storage limits
        const cacheStats = await db.getStats();
        const usagePercent = (cacheStats.size / MAX_CACHE_SIZE_MB) * 100;

        if (usagePercent > 90) {
          warn(`⚠️ Cache usage: ${usagePercent.toFixed(1)}% - Running aggressive cleanup`);
          await db.enforceStorageLimit();
        }

        // Step 3: Update stats
        await updateStats();

        if (deleted > 0 || usagePercent > 80) {
          const newStats = await db.getStats();
          log(`📊 Cache stats: ${newStats.count} items, ${newStats.size.toFixed(1)}MB (${usagePercent.toFixed(1)}%)`);
        }
      } catch (error) {
        console.error('Cache cleanup error:', error);
      }
    };

    // Run cleanup every 30 minutes (more frequent than before)
    const cleanupInterval = setInterval(smartCleanup, AUTO_CLEANUP_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      clearInterval(cleanupInterval);
      // Final cleanup before closing
      db.cleanupExpired().catch(e => console.error('Final cleanup error:', e));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // db is a singleton, intentionally not in deps

  // Update statistics
  const updateStats = useCallback(async () => {
    try {
      const all = await db.getAll();
      const totalRequests = stats.totalHits + stats.totalMisses;
      const hitRate = totalRequests > 0 ? (stats.totalHits / totalRequests) * 100 : 0;

      setStats(prev => ({
        ...prev,
        hitRate,
        cacheSize: all.length,
      }));
    } catch (error) {
      console.error('Stats update error:', error);
    }
  }, [stats.totalHits, stats.totalMisses]);

  /**
   * Get cached response for a query
   */
  const getCached = useCallback(async (query: string): Promise<CachedResponse | null> => {
    try {
      // LOOP FIX: Skip cache for confirmatory responses - they must reach backend for context
      if (!shouldCache(query)) {
        log(`⏭️ Bypassing cache for context-dependent query: "${query}"`);
        return null;
      }

      const queryHash = hashQuery(query);
      const cached = await db.get(queryHash);

      if (cached) {
        // Cache hit - increment hit count
        cached.hitCount++;
        await db.set(cached);

        setStats(prev => ({
          ...prev,
          totalHits: prev.totalHits + 1,
        }));

        log(`✅ Browser cache HIT (hash: ${queryHash}, hits: ${cached.hitCount})`);
        return cached;
      } else {
        // Cache miss
        setStats(prev => ({
          ...prev,
          totalMisses: prev.totalMisses + 1,
        }));

        log(`❌ Browser cache MISS (hash: ${queryHash})`);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }, []);

  /**
   * Cache a query-response pair
   */
  const setCached = useCallback(async (query: string, response: string, metadata?: any): Promise<boolean> => {
    try {
      // LOOP FIX: Don't cache confirmatory responses - they're context-dependent
      if (!shouldCache(query)) {
        log(`⏭️ Not caching context-dependent query: "${query}"`);
        return false;
      }

      const queryHash = hashQuery(query);
      const entry: CachedResponse = {
        queryHash,
        query,
        response,
        metadata,
        timestamp: Date.now(),
        hitCount: 0,
      };

      await db.set(entry);
      await updateStats();

      log(`💾 Cached response (hash: ${queryHash})`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }, [updateStats]);

  /**
   * Clear all cached entries
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      await db.clear();
      setStats({
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
        cacheSize: 0,
      });

      log('🗑️ Browser cache cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }, []);

  /**
   * Get all cached entries (for debugging)
   */
  const getAllCached = useCallback(async (): Promise<CachedResponse[]> => {
    try {
      return await db.getAll();
    } catch (error) {
      console.error('Get all cached error:', error);
      return [];
    }
  }, []);

  return {
    getCached,
    setCached,
    clearCache,
    getAllCached,
    stats,
  };
};

export default useBrowserCache;
