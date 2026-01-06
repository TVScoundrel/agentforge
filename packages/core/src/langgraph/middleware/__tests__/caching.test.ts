import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withCache, createSharedCache, type CachingOptions } from '../caching.js';
import type { NodeFunction } from '../types.js';

interface TestState {
  input: string;
  output?: string;
  count?: number;
}

describe('Caching Middleware', () => {
  describe('withCache()', () => {
    it('should cache node results', async () => {
      let callCount = 0;
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount++;
        return { ...state, output: `Result ${callCount}` };
      });

      const cachedNode = withCache(node, { ttl: 1000 });

      const state: TestState = { input: 'test' };

      // First call - cache miss
      const result1 = await cachedNode(state);
      expect(result1).toEqual({ input: 'test', output: 'Result 1' });
      expect(callCount).toBe(1);

      // Second call - cache hit
      const result2 = await cachedNode(state);
      expect(result2).toEqual({ input: 'test', output: 'Result 1' });
      expect(callCount).toBe(1); // Should not call node again
    });

    it('should respect TTL and expire cached entries', async () => {
      let callCount = 0;
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount++;
        return { ...state, output: `Result ${callCount}` };
      });

      const cachedNode = withCache(node, { ttl: 50 }); // 50ms TTL

      const state: TestState = { input: 'test' };

      // First call
      await cachedNode(state);
      expect(callCount).toBe(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should call node again after expiration
      await cachedNode(state);
      expect(callCount).toBe(2);
    });

    it('should use custom key generator', async () => {
      let callCount = 0;
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount++;
        return { ...state, output: `Result ${callCount}` };
      });

      const cachedNode = withCache(node, {
        ttl: 1000,
        keyGenerator: (state) => state.input, // Only use input for key
      });

      // Same input, different state objects
      await cachedNode({ input: 'test', count: 1 });
      await cachedNode({ input: 'test', count: 2 });

      expect(callCount).toBe(1); // Should cache based on input only
    });

    it('should call onCacheHit callback', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const onCacheHit = vi.fn();

      const cachedNode = withCache(node, { ttl: 1000, onCacheHit });

      const state: TestState = { input: 'test' };

      await cachedNode(state);
      await cachedNode(state);

      expect(onCacheHit).toHaveBeenCalledTimes(1);
      expect(onCacheHit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ output: 'result' })
      );
    });

    it('should call onCacheMiss callback', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const onCacheMiss = vi.fn();

      const cachedNode = withCache(node, { ttl: 1000, onCacheMiss });

      await cachedNode({ input: 'test1' });
      await cachedNode({ input: 'test2' });

      expect(onCacheMiss).toHaveBeenCalledTimes(2);
    });

    it('should respect maxSize and evict entries', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const onEviction = vi.fn();

      const cachedNode = withCache(node, {
        ttl: 10000,
        maxSize: 2,
        evictionStrategy: 'fifo',
        onEviction,
      });

      // Fill cache
      await cachedNode({ input: 'test1' });
      await cachedNode({ input: 'test2' });
      await cachedNode({ input: 'test3' }); // Should evict test1

      expect(node).toHaveBeenCalledTimes(3);

      // test1 should be evicted, so it should call node again
      await cachedNode({ input: 'test1' });
      expect(node).toHaveBeenCalledTimes(4);
    });

    it('should use LRU eviction strategy', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const cachedNode = withCache(node, {
        ttl: 10000,
        maxSize: 2,
        evictionStrategy: 'lru',
      });

      // Fill cache with test1 and test2
      await cachedNode({ input: 'test1' }); // Call 1
      await new Promise((resolve) => setTimeout(resolve, 10));

      await cachedNode({ input: 'test2' }); // Call 2
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Access test1 to make it recently used (cache hit, no new call)
      await cachedNode({ input: 'test1' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Add test3 - should evict test2 (least recently used)
      await cachedNode({ input: 'test3' }); // Call 3

      // test1 should still be cached (cache hit)
      await cachedNode({ input: 'test1' });
      expect(node).toHaveBeenCalledTimes(3);

      // test2 should be evicted, so calling it again should execute node
      await cachedNode({ input: 'test2' }); // Call 4
      expect(node).toHaveBeenCalledTimes(4);
    });

    it('should use LFU eviction strategy', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const cachedNode = withCache(node, {
        ttl: 10000,
        maxSize: 2,
        evictionStrategy: 'lfu',
      });

      // Fill cache
      await cachedNode({ input: 'test1' }); // Call 1
      await cachedNode({ input: 'test2' }); // Call 2

      // Access test1 multiple times (cache hits, no new calls)
      await cachedNode({ input: 'test1' });
      await cachedNode({ input: 'test1' });

      // Add test3 - should evict test2 (least frequently used)
      await cachedNode({ input: 'test3' }); // Call 3

      // test2 should be evicted, so calling it again should execute node
      await cachedNode({ input: 'test2' }); // Call 4
      expect(node).toHaveBeenCalledTimes(4);
    });

    it('should not cache errors by default', async () => {
      let callCount = 0;
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Test error');
        }
        return { ...state, output: 'success' };
      });

      const cachedNode = withCache(node, { ttl: 1000, cacheErrors: false });

      const state: TestState = { input: 'test' };

      // First call - error
      await expect(cachedNode(state)).rejects.toThrow('Test error');

      // Second call - should retry (not cached)
      const result = await cachedNode(state);
      expect(result).toEqual({ input: 'test', output: 'success' });
      expect(callCount).toBe(2);
    });

    it('should cache errors when enabled', async () => {
      let callCount = 0;
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount++;
        throw new Error('Test error');
      });

      const cachedNode = withCache(node, { ttl: 1000, cacheErrors: true });

      const state: TestState = { input: 'test' };

      // First call - error
      await expect(cachedNode(state)).rejects.toThrow('Test error');

      // Second call - should return cached error result
      const result = await cachedNode(state);
      expect(result).toEqual({ error: 'Test error' });
      expect(callCount).toBe(1); // Should not call node again
    });
  });

  describe('createSharedCache()', () => {
    it('should create a shared cache instance', async () => {
      const sharedCache = createSharedCache<TestState>({ ttl: 1000, maxSize: 10 });

      let callCount1 = 0;
      const node1: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount1++;
        return { ...state, output: 'node1' };
      });

      let callCount2 = 0;
      const node2: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
        callCount2++;
        return { ...state, output: 'node2' };
      });

      const cachedNode1 = sharedCache.withCache(node1, (state) => `node1:${state.input}`);
      const cachedNode2 = sharedCache.withCache(node2, (state) => `node2:${state.input}`);

      // Call both nodes
      await cachedNode1({ input: 'test' });
      await cachedNode2({ input: 'test' });

      expect(callCount1).toBe(1);
      expect(callCount2).toBe(1);
      expect(sharedCache.size()).toBe(2);
    });

    it('should clear shared cache', async () => {
      const sharedCache = createSharedCache<TestState>({ ttl: 1000 });

      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const cachedNode = sharedCache.withCache(node);

      await cachedNode({ input: 'test1' });
      await cachedNode({ input: 'test2' });

      expect(sharedCache.size()).toBe(2);

      sharedCache.clear();

      expect(sharedCache.size()).toBe(0);

      // Should call node again after clear
      await cachedNode({ input: 'test1' });
      expect(node).toHaveBeenCalledTimes(3);
    });
  });
});

