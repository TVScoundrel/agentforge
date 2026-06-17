import { describe, expect, it, vi } from 'vitest';
import { createSharedCache } from './shared.js';
import type { NodeFunction, TestState } from './shared.js';

describe('Caching Middleware createSharedCache()', () => {
  it('creates a shared cache instance', async () => {
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

    await cachedNode1({ input: 'test' });
    await cachedNode2({ input: 'test' });

    expect(callCount1).toBe(1);
    expect(callCount2).toBe(1);
    expect(sharedCache.size()).toBe(2);
  });

  it('clears shared cache', async () => {
    const sharedCache = createSharedCache<TestState>({ ttl: 1000 });
    const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({
      ...state,
      output: 'result',
    }));
    const cachedNode = sharedCache.withCache(node);

    await cachedNode({ input: 'test1' });
    await cachedNode({ input: 'test2' });

    expect(sharedCache.size()).toBe(2);

    sharedCache.clear();
    expect(sharedCache.size()).toBe(0);

    await cachedNode({ input: 'test1' });
    expect(node).toHaveBeenCalledTimes(3);
  });
});
