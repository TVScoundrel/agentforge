import type { CacheEntry, EvictionStrategy } from './caching-types.js';

/**
 * Simple cache implementation with pluggable eviction strategies.
 */
export class LRUCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxSize: number,
    private readonly evictionStrategy: EvictionStrategy = 'lru'
  ) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    entry.hits++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  getEntry(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      hits: 0,
      lastAccessed: now,
    });
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
    if (this.cache.size === 0) {
      return;
    }

    const keyToEvict = this.findKeyToEvict();
    if (keyToEvict !== undefined) {
      this.cache.delete(keyToEvict);
    }
  }

  private findKeyToEvict(): string | undefined {
    if (this.evictionStrategy === 'fifo') {
      return this.cache.keys().next().value;
    }

    let selectedKey: string | undefined;
    let selectedValue = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const candidateValue = this.evictionStrategy === 'lfu'
        ? entry.hits
        : entry.lastAccessed;

      if (candidateValue < selectedValue) {
        selectedValue = candidateValue;
        selectedKey = key;
      }
    }

    return selectedKey;
  }
}
