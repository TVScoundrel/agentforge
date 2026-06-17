import type { NodeFunction } from './types.js';
import { createCachedErrorResult, isFreshCacheEntry } from './caching-entry.js';
import { LRUCache } from './caching-store.js';
import type {
  CacheKeyGenerator,
  ResolvedCachingOptions,
} from './caching-types.js';

export function createCachedNode<State>(
  node: NodeFunction<State>,
  cache: LRUCache<State | Partial<State>>,
  options: ResolvedCachingOptions<State>,
  keyGenerator: CacheKeyGenerator<State> = options.keyGenerator
): NodeFunction<State> {
  return async (state: State): Promise<State | Partial<State>> => {
    const cacheKey = keyGenerator(state);
    const cachedValue = cache.get(cacheKey);
    const entry = cache.getEntry(cacheKey);

    if (cachedValue !== undefined && isFreshCacheEntry(entry, options.ttl)) {
      options.onCacheHit?.(cacheKey, cachedValue);
      return cachedValue;
    }

    if (cachedValue !== undefined && entry) {
      cache.delete(cacheKey);
      options.onEviction?.(cacheKey, cachedValue);
    }

    options.onCacheMiss?.(cacheKey);

    try {
      const result = await Promise.resolve(node(state));
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (options.cacheErrors && error instanceof Error) {
        cache.set(cacheKey, createCachedErrorResult<State>(error));
      }

      throw error;
    }
  };
}
