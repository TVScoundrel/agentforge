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
 *
 * @example
 * ```typescript
 * const cachedNode = withCache(expensiveNode, {
 *   ttl: 3600000,
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
  const resolvedOptions = resolveCachingOptions(options);
  const cache = new LRUCache<State | Partial<State>>(
    resolvedOptions.maxSize,
    resolvedOptions.evictionStrategy
  );

  return createCachedNode(node, cache, resolvedOptions);
}

export { createSharedCache };
export type { CacheKeyGenerator, CachingOptions, EvictionStrategy };
