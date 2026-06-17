import type { NodeFunction } from './types.js';
import { resolveCachingOptions, resolveSharedCacheKeyGenerator } from './caching-options.js';
import { LRUCache } from './caching-store.js';
import { createCachedNode } from './caching-wrapper.js';
import type {
  CacheKeyGenerator,
  CachingOptions,
  SharedCache,
} from './caching-types.js';

export function createSharedCache<State>(
  options: Omit<CachingOptions<State>, 'keyGenerator'> = {}
): SharedCache<State> {
  const resolvedOptions = resolveCachingOptions(options);
  const cache = new LRUCache<State | Partial<State>>(
    resolvedOptions.maxSize,
    resolvedOptions.evictionStrategy
  );

  return {
    withCache: (
      node: NodeFunction<State>,
      keyGenerator?: CacheKeyGenerator<State>
    ) => createCachedNode(
      node,
      cache,
      resolvedOptions,
      resolveSharedCacheKeyGenerator(keyGenerator)
    ),
    clear: () => cache.clear(),
    size: () => cache.size(),
  };
}
