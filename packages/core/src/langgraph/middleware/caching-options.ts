import type {
  CacheKeyGenerator,
  CachingOptions,
  ResolvedCachingOptions,
} from './caching-types.js';

function defaultCacheKeyGenerator<State>(state: State): string {
  try {
    return JSON.stringify(state);
  } catch {
    return String(state);
  }
}

export function resolveCachingOptions<State>(
  options: CachingOptions<State>
): ResolvedCachingOptions<State> {
  return {
    ttl: options.ttl ?? 3_600_000,
    maxSize: options.maxSize ?? 100,
    evictionStrategy: options.evictionStrategy ?? 'lru',
    keyGenerator: options.keyGenerator ?? defaultCacheKeyGenerator<State>,
    cacheErrors: options.cacheErrors ?? false,
    onCacheHit: options.onCacheHit,
    onCacheMiss: options.onCacheMiss,
    onEviction: options.onEviction,
  };
}

export function resolveSharedCacheKeyGenerator<State>(
  keyGenerator: CacheKeyGenerator<State> | undefined
): CacheKeyGenerator<State> {
  return keyGenerator ?? defaultCacheKeyGenerator<State>;
}
