/**
 * Advanced Memory Caching System
 * Implements intelligent caching with TTL, LRU eviction, and cache warming
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
  enableLRU?: boolean; // Enable LRU eviction
  enableStats?: boolean; // Enable cache statistics
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private stats: CacheStats;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 300000, // 5 minutes default
      maxSize: options.maxSize || 50 * 1024 * 1024, // 50MB default
      maxEntries: options.maxEntries || 1000,
      enableLRU: options.enableLRU !== false,
      enableStats: options.enableStats !== false
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0
    };

    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Set cache entry
   */
  set(key: string, data: T, ttl?: number): void {
    const entryTTL = ttl || this.options.ttl;
    const size = this.calculateSize(data);

    // Check if we need to evict entries
    this.evictIfNeeded(size);

    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size
    };

    this.cache.set(key, entry);
    this.updateStats(size, 'add');

    // Set expiration timer
    if (entryTTL > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, entryTTL);
      this.timers.set(key, timer);
    }
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.updateStats(entry.size, 'remove');

    // Clear timer
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size in bytes
   */
  size(): number {
    return this.stats.totalSize;
  }

  /**
   * Get number of entries
   */
  count(): number {
    return this.cache.size;
  }

  /**
   * Warm cache with data
   */
  async warm(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      this.set(entry.key, entry.data, entry.ttl);
    }
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Memoize function with caching
   */
  memoize<Args extends unknown[], Return>(
    fn: (...args: Args) => Promise<Return> | Return,
    keyGenerator?: (...args: Args) => string,
    ttl?: number
  ) {
    return async (...args: Args): Promise<Return> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      return this.getOrSet(key, () => fn(...args), ttl);
    };
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (entry.ttl <= 0) return false; // No expiration
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback for non-serializable data
      return 1024; // 1KB estimate
    }
  }

  /**
   * Evict entries if needed
   */
  private evictIfNeeded(newEntrySize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.options.maxEntries) {
      this.evictLRU();
    }

    // Check size limit
    while (this.stats.totalSize + newEntrySize > this.options.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Update cache statistics
   */
  private updateStats(size: number, operation: 'add' | 'remove'): void {
    if (operation === 'add') {
      this.stats.totalSize += size;
      this.stats.entryCount++;
    } else {
      this.stats.totalSize -= size;
      this.stats.entryCount--;
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Cache manager for different cache instances
 */
class CacheManager {
  private caches = new Map<string, MemoryCache>();

  /**
   * Get or create cache instance
   */
  getCache<T = unknown>(name: string, options?: CacheOptions): MemoryCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MemoryCache<T>(options));
    }
    return this.caches.get(name) as MemoryCache<T>;
  }

  /**
   * Delete cache instance
   */
  deleteCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      this.caches.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Get all cache names
   */
  getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Get combined statistics
   */
  getAllStats(): { [cacheName: string]: CacheStats } {
    const stats: { [cacheName: string]: CacheStats } = {};

    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }

    return stats;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
}

// Global cache manager
export const cacheManager = new CacheManager();

// Pre-configured cache instances
export const apiCache = cacheManager.getCache('api', {
  ttl: 300000, // 5 minutes
  maxEntries: 500
});

export const userCache = cacheManager.getCache('user', {
  ttl: 600000, // 10 minutes
  maxEntries: 100
});

export const documentCache = cacheManager.getCache('documents', {
  ttl: 900000, // 15 minutes
  maxEntries: 200
});

export const searchCache = cacheManager.getCache('search', {
  ttl: 180000, // 3 minutes
  maxEntries: 300
});

// Export classes and types
export { CacheManager, MemoryCache };
export type { CacheEntry, CacheOptions, CacheStats };
