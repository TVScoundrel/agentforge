/**
 * Caching Middleware for LangGraph Nodes
 *
 * Provides caching capabilities with TTL, LRU eviction, and custom key generation.
 */

import type { NodeFunction } from './types.js';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
}

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
   * Time-to-live in milliseconds
   * @default 3600000 (1 hour)
   */
  ttl?: number;

  /**
   * Maximum number of cache entries
   * @default 100
   */
  maxSize?: number;

  /**
   * Eviction strategy when cache is full
   * @default 'lru'
   */
  evictionStrategy?: EvictionStrategy;

  /**
   * Custom cache key generator
   * @default JSON.stringify
   */
  keyGenerator?: CacheKeyGenerator<State>;

  /**
   * Whether to cache errors
   * @default false
   */
  cacheErrors?: boolean;

  /**
   * Optional callback when cache hit occurs
   */
  onCacheHit?: (key: string, value: State | Partial<State>) => void;

  /**
   * Optional callback when cache miss occurs
   */
  onCacheMiss?: (key: string) => void;

  /**
   * Optional callback when cache entry is evicted
   */
  onEviction?: (key: string, value: State | Partial<State>) => void;
}

/**
 * Simple LRU cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private evictionStrategy: EvictionStrategy;

  constructor(maxSize: number, evictionStrategy: EvictionStrategy = 'lru') {
    this.maxSize = maxSize;
    this.evictionStrategy = evictionStrategy;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Update access metadata
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  set(key: string, value: T): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string | undefined;

    if (this.evictionStrategy === 'lru') {
      // Evict least recently used
      let oldestAccess = Infinity;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          keyToEvict = key;
        }
      }
    } else if (this.evictionStrategy === 'lfu') {
      // Evict least frequently used
      let lowestHits = Infinity;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.hits < lowestHits) {
          lowestHits = entry.hits;
          keyToEvict = key;
        }
      }
    } else {
      // FIFO - evict oldest entry
      keyToEvict = this.cache.keys().next().value;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }
}

/**
 * Default cache key generator using JSON.stringify
 */
function defaultKeyGenerator<State>(state: State): string {
  try {
    return JSON.stringify(state);
  } catch {
    // Fallback for non-serializable states
    return String(state);
  }
}

/**
 * Wraps a node function with caching logic.
 *
 * @example
 * ```typescript
 * const cachedNode = withCache(expensiveNode, {
 *   ttl: 3600000, // 1 hour
 *   maxSize: 100,
 *   evictionStrategy: 'lru',
 *   keyGenerator: (state) => state.userId,
 *   onCacheHit: (key) => console.log('Cache hit:', key),
 * });
 *
 * graph.addNode('cached', cachedNode);
 * ```
 *
 * @param node - The node function to wrap
 * @param options - Caching configuration options
 * @returns A wrapped node function with caching
 */
export function withCache<State>(
  node: NodeFunction<State>,
  options: CachingOptions<State> = {}
): NodeFunction<State> {
  const {
    ttl = 3600000, // 1 hour default
    maxSize = 100,
    evictionStrategy = 'lru',
    keyGenerator = defaultKeyGenerator,
    cacheErrors = false,
    onCacheHit,
    onCacheMiss,
    onEviction,
  } = options;

  const cache = new LRUCache<State | Partial<State>>(maxSize, evictionStrategy);

  return async (state: State): Promise<State | Partial<State>> => {
    // Generate cache key
    const cacheKey = keyGenerator(state);

    // Check if cached value exists and is not expired
    const cachedValue = cache.get(cacheKey);
    if (cachedValue !== undefined) {
      const entry = (cache as any).cache.get(cacheKey) as CacheEntry<State | Partial<State>>;
      const age = Date.now() - entry.timestamp;

      if (age < ttl) {
        // Cache hit
        if (onCacheHit) {
          onCacheHit(cacheKey, cachedValue);
        }
        return cachedValue;
      } else {
        // Expired - remove from cache
        cache.delete(cacheKey);
        if (onEviction) {
          onEviction(cacheKey, cachedValue);
        }
      }
    }

    // Cache miss
    if (onCacheMiss) {
      onCacheMiss(cacheKey);
    }

    try {
      // Execute node
      const result = await Promise.resolve(node(state));

      // Cache the result
      cache.set(cacheKey, result);

      return result;
    } catch (error) {
      // Cache errors if configured
      if (cacheErrors && error instanceof Error) {
        const errorResult = { error: error.message } as any as Partial<State>;
        cache.set(cacheKey, errorResult);
      }
      throw error;
    }
  };
}

/**
 * Create a cache instance that can be shared across multiple nodes
 */
export function createSharedCache<State>(
  options: Omit<CachingOptions<State>, 'keyGenerator'> = {}
): {
  withCache: (node: NodeFunction<State>, keyGenerator?: CacheKeyGenerator<State>) => NodeFunction<State>;
  clear: () => void;
  size: () => number;
} {
  const {
    ttl = 3600000,
    maxSize = 100,
    evictionStrategy = 'lru',
    cacheErrors = false,
    onCacheHit,
    onCacheMiss,
    onEviction,
  } = options;

  const cache = new LRUCache<State | Partial<State>>(maxSize, evictionStrategy);

  return {
    withCache: (node: NodeFunction<State>, keyGenerator = defaultKeyGenerator) => {
      return async (state: State): Promise<State | Partial<State>> => {
        // Generate cache key
        const cacheKey = keyGenerator(state);

        // Check if cached value exists and is not expired
        const cachedValue = cache.get(cacheKey);
        if (cachedValue !== undefined) {
          const entry = (cache as any).cache.get(cacheKey) as CacheEntry<State | Partial<State>>;
          const age = Date.now() - entry.timestamp;

          if (age < ttl) {
            // Cache hit
            if (onCacheHit) {
              onCacheHit(cacheKey, cachedValue);
            }
            return cachedValue;
          } else {
            // Expired - remove from cache
            cache.delete(cacheKey);
            if (onEviction) {
              onEviction(cacheKey, cachedValue);
            }
          }
        }

        // Cache miss
        if (onCacheMiss) {
          onCacheMiss(cacheKey);
        }

        try {
          // Execute node
          const result = await Promise.resolve(node(state));

          // Cache the result
          cache.set(cacheKey, result);

          return result;
        } catch (error) {
          // Cache errors if configured
          if (cacheErrors && error instanceof Error) {
            const errorResult = { error: error.message } as any as Partial<State>;
            cache.set(cacheKey, errorResult);
          }
          throw error;
        }
      };
    },
    clear: () => cache.clear(),
    size: () => cache.size(),
  };
}


