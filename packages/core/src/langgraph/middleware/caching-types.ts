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
  ttl?: number;
  maxSize?: number;
  evictionStrategy?: EvictionStrategy;
  keyGenerator?: CacheKeyGenerator<State>;
  cacheErrors?: boolean;
  onCacheHit?: (key: string, value: State | Partial<State>) => void;
  onCacheMiss?: (key: string) => void;
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
