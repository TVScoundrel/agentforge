import type { CacheEntry } from './caching-types.js';

export function isFreshCacheEntry<T>(entry: CacheEntry<T> | undefined, ttl: number): entry is CacheEntry<T> {
  if (!entry) {
    return false;
  }

  return Date.now() - entry.timestamp < ttl;
}

export function createCachedErrorResult<State>(error: Error): Partial<State> & { error: string } {
  return { error: error.message } as Partial<State> & { error: string };
}
