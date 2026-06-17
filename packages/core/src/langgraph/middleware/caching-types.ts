import type { NodeFunction } from './types.js';

/**
 * Cache key generator function
 */
export type CacheKeyGenerator<State> = (state: State) => string;

/**
 * Cache eviction strategy
 */
export type EvictionStrategy = 'lru' | 'lfu' | 'fifo';

/**
 * Options for caching middleware
 */
export interface CachingOptions<State> {
  /**
   * Time-to-live in milliseconds.
   * @default 3600000 (1 hour)
   */
  ttl?: number;

  /**
   * Maximum number of cache entries.
   * @default 100
   */
  maxSize?: number;

  /**
   * Eviction strategy when the cache is full.
   * @default 'lru'
   */
  evictionStrategy?: EvictionStrategy;

  /**
   * Custom cache key generator.
   * @default JSON.stringify with String(...) fallback
   */
  keyGenerator?: CacheKeyGenerator<State>;

  /**
   * Whether to cache thrown `Error` results as `{ error: message }`.
   * @default false
   */
  cacheErrors?: boolean;

  /**
   * Optional callback invoked when a fresh cached value is returned.
   */
  onCacheHit?: (key: string, value: State | Partial<State>) => void;

  /**
   * Optional callback invoked when no cached value is available.
   */
  onCacheMiss?: (key: string) => void;

  /**
   * Optional callback invoked when a stale cached value is evicted.
   */
  onEviction?: (key: string, value: State | Partial<State>) => void;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
}

export interface ResolvedCachingOptions<State> {
  ttl: number;
  maxSize: number;
  evictionStrategy: EvictionStrategy;
  keyGenerator: CacheKeyGenerator<State>;
  cacheErrors: boolean;
  onCacheHit?: (key: string, value: State | Partial<State>) => void;
  onCacheMiss?: (key: string) => void;
  onEviction?: (key: string, value: State | Partial<State>) => void;
}

export interface SharedCache<State> {
  withCache: (node: NodeFunction<State>, keyGenerator?: CacheKeyGenerator<State>) => NodeFunction<State>;
  clear: () => void;
  size: () => number;
}
