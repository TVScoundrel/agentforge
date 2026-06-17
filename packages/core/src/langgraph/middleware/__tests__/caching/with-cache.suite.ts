import { describe, expect, it, vi } from 'vitest';
import { withCache } from './shared.js';
import type { NodeFunction, TestState } from './shared.js';

describe('Caching Middleware withCache()', () => {
  it('caches node results', async () => {
    let callCount = 0;
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
      callCount++;
      return { ...state, output: `Result ${callCount}` };
    });

    const cachedNode = withCache(node, { ttl: 1000 });
    const state: TestState = { input: 'test' };

    const result1 = await cachedNode(state);
    expect(result1).toEqual({ input: 'test', output: 'Result 1' });
    expect(callCount).toBe(1);

    const result2 = await cachedNode(state);
    expect(result2).toEqual({ input: 'test', output: 'Result 1' });
    expect(callCount).toBe(1);
  });

  it('respects TTL and expires cached entries', async () => {
    vi.useFakeTimers();

    let callCount = 0;
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
      callCount++;
      return { ...state, output: `Result ${callCount}` };
    });

    const cachedNode = withCache(node, { ttl: 50 });
    const state: TestState = { input: 'test' };

    try {
      await cachedNode(state);
      expect(callCount).toBe(1);

      await vi.advanceTimersByTimeAsync(60);

      await cachedNode(state);
      expect(callCount).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses a custom key generator', async () => {
    let callCount = 0;
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => {
      callCount++;
      return { ...state, output: `Result ${callCount}` };
    });

    const cachedNode = withCache(node, {
      ttl: 1000,
      keyGenerator: (state) => state.input,
    });

    await cachedNode({ input: 'test', count: 1 });
    await cachedNode({ input: 'test', count: 2 });

    expect(callCount).toBe(1);
  });

  it('calls onCacheHit callback', async () => {
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: 'result',
    }));
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

  it('calls onCacheMiss callback', async () => {
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: 'result',
    }));
    const onCacheMiss = vi.fn();

    const cachedNode = withCache(node, { ttl: 1000, onCacheMiss });

    await cachedNode({ input: 'test1' });
    await cachedNode({ input: 'test2' });

    expect(onCacheMiss).toHaveBeenCalledTimes(2);
  });

  it('respects maxSize and evicts entries', async () => {
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: 'result',
    }));
    const onEviction = vi.fn();

    const cachedNode = withCache(node, {
      ttl: 10000,
      maxSize: 2,
      evictionStrategy: 'fifo',
      onEviction,
    });

    await cachedNode({ input: 'test1' });
    await cachedNode({ input: 'test2' });
    await cachedNode({ input: 'test3' });

    expect(node).toHaveBeenCalledTimes(3);

    await cachedNode({ input: 'test1' });
    expect(node).toHaveBeenCalledTimes(4);
  });

  it('evicts entries even when the cache key is an empty string', async () => {
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: `result:${state.count ?? 0}`,
    }));

    const cachedNode = withCache(node, {
      ttl: 10000,
      maxSize: 1,
      evictionStrategy: 'fifo',
      keyGenerator: (state) => state.input,
    });

    await cachedNode({ input: '', count: 1 });
    await cachedNode({ input: 'next', count: 2 });
    await cachedNode({ input: '', count: 3 });

    expect(node).toHaveBeenCalledTimes(3);
  });

  it('uses LRU eviction strategy', async () => {
    vi.useFakeTimers();

    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: 'result',
    }));

    const cachedNode = withCache(node, {
      ttl: 10000,
      maxSize: 2,
      evictionStrategy: 'lru',
    });

    try {
      await cachedNode({ input: 'test1' });
      await vi.advanceTimersByTimeAsync(10);
      await cachedNode({ input: 'test2' });
      await vi.advanceTimersByTimeAsync(10);
      await cachedNode({ input: 'test1' });
      await vi.advanceTimersByTimeAsync(10);
      await cachedNode({ input: 'test3' });
      await cachedNode({ input: 'test1' });

      expect(node).toHaveBeenCalledTimes(3);

      await cachedNode({ input: 'test2' });
      expect(node).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses LFU eviction strategy', async () => {
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: 'result',
    }));

    const cachedNode = withCache(node, {
      ttl: 10000,
      maxSize: 2,
      evictionStrategy: 'lfu',
    });

    await cachedNode({ input: 'test1' });
    await cachedNode({ input: 'test2' });
    await cachedNode({ input: 'test1' });
    await cachedNode({ input: 'test1' });
    await cachedNode({ input: 'test3' });
    await cachedNode({ input: 'test2' });

    expect(node).toHaveBeenCalledTimes(4);
  });

  it('does not cache errors by default', async () => {
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

    await expect(cachedNode(state)).rejects.toThrow('Test error');

    const result = await cachedNode(state);
    expect(result).toEqual({ input: 'test', output: 'success' });
    expect(callCount).toBe(2);
  });

  it('caches errors when enabled', async () => {
    let callCount = 0;
    const node: NodeFunction<TestState> = vi.fn(async () => {
      callCount++;
      throw new Error('Test error');
    });

    const cachedNode = withCache(node, { ttl: 1000, cacheErrors: true });
    const state: TestState = { input: 'test' };

    await expect(cachedNode(state)).rejects.toThrow('Test error');

    const result = await cachedNode(state);
    expect(result).toEqual({ error: 'Test error' });
    expect(callCount).toBe(1);
  });
});
