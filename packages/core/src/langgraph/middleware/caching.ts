/**
 * Caching Middleware for LangGraph Nodes
 *
 * Provides caching capabilities with TTL, LRU eviction, and custom key generation.
 */

import type { NodeFunction } from './types.js';
import { resolveCachingOptions } from './caching-options.js';
import { createSharedCache } from './caching-shared.js';
import { LRUCache } from './caching-store.js';
import { createCachedNode } from './caching-wrapper.js';
import type {
  CacheKeyGenerator,
  CachingOptions,
  EvictionStrategy,
} from './caching-types.js';

/**
 * Wraps a node function with caching logic.
 */
export function withCache<State>(
  node: NodeFunction<State>,
  options: CachingOptions<State> = {}
): NodeFunction<State> {
  const resolvedOptions = resolveCachingOptions(options);
  const cache = new LRUCache<State | Partial<State>>(
    resolvedOptions.maxSize,
    resolvedOptions.evictionStrategy
  );

  return createCachedNode(node, cache, resolvedOptions);
}

export { createSharedCache };
export type { CacheKeyGenerator, CachingOptions, EvictionStrategy };
