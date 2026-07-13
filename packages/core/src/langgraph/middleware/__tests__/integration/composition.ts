import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createSharedCache, withCache } from '../../caching.js';
import { compose, MiddlewareChain } from '../../compose.js';
import { withConcurrency } from '../../concurrency.js';
import { withLogging } from '../../logging.js';
import { withRateLimit } from '../../rate-limiting.js';
import { withValidation } from '../../validation.js';
import type { NodeFunction, SimpleMiddleware } from '../../types.js';
import { createTrackedNode, type TestState } from './shared.js';

describe('Middleware Integration Tests', () => {
  describe('Middleware Composition', () => {
    it('should compose multiple middleware in correct order', async () => {
      const logs: string[] = [];
      const { node } = createTrackedNode();

      const middleware1: SimpleMiddleware<TestState> = (next) => async (state) => {
        logs.push('m1-before');
        const result = await next(state);
        logs.push('m1-after');
        return result;
      };

      const middleware2: SimpleMiddleware<TestState> = (next) => async (state) => {
        logs.push('m2-before');
        const result = await next(state);
        logs.push('m2-after');
        return result;
      };

      const enhanced = compose(middleware1, middleware2)(node);
      await enhanced({ value: 1 });

      expect(logs).toEqual(['m1-before', 'm2-before', 'm2-after', 'm1-after']);
    });

    it('should compose using fluent chain API', async () => {
      const { node } = createTrackedNode();

      const enhanced = new MiddlewareChain<TestState>()
        .use(withLogging({ name: 'test-node' }))
        .build(node);

      const result = await enhanced({ value: 42 });
      expect(result.result).toBe('processed-42');
    });

    it('should handle errors through middleware chain', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Test error');
      };

      const enhanced = new MiddlewareChain<TestState>()
        .use(withLogging({ name: 'error-node' }))
        .build(errorNode);

      await expect(enhanced({ value: 1 })).rejects.toThrow('Test error');
    });

    it('should validate before caching', async () => {
      const { getCallCount, node } = createTrackedNode();
      const inputSchema = z.object({
        value: z.number().min(0),
      }).strict();

      const enhanced = compose<TestState>(
        (next) => withValidation(next, { inputSchema }),
        (next) => withCache(next, { ttl: 1000 })
      )(node);

      const result1 = await enhanced({ value: 5 });
      expect(result1.result).toBe('processed-5');
      expect(getCallCount()).toBe(1);

      const result2 = await enhanced({ value: 5 });
      expect(result2.result).toBe('processed-5');
      expect(getCallCount()).toBe(1);

      await expect(enhanced({ value: -1 } as TestState)).rejects.toThrow();
      expect(getCallCount()).toBe(1);
    });

    it('should rate limit and control concurrency', async () => {
      const slowNode: NodeFunction<TestState> = async (state) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, result: 'done' };
      };

      const enhanced = compose<TestState>(
        (next) => withRateLimit(next, { maxRequests: 5, windowMs: 1000 }),
        (next) => withConcurrency(next, { maxConcurrent: 2 })
      )(slowNode);

      const start = Date.now();
      await Promise.all([enhanced({ value: 1 }), enhanced({ value: 2 }), enhanced({ value: 3 })]);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(90);
    });

    it('should compose cache, validation, rate limiting, and logging', async () => {
      const { node } = createTrackedNode();
      const inputSchema = z.object({
        value: z.number(),
      }).strict();

      const enhanced = compose(
        withLogging({ name: 'complex-node' }),
        (next) => withRateLimit(next, { maxRequests: 10, windowMs: 1000 }),
        (next) => withValidation(next, { inputSchema }),
        (next) => withCache(next, { ttl: 1000 })
      )(node);

      const result = await enhanced({ value: 5 });
      expect(result.result).toBe('processed-5');
    });

    it('should handle errors in complex stacks', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Node error');
      };

      const inputSchema = z.object({
        value: z.number(),
      }).strict();

      const enhanced = compose(
        withLogging({ name: 'error-node' }),
        (next) => withValidation(next, { inputSchema })
      )(errorNode);

      await expect(enhanced({ value: 1 })).rejects.toThrow('Node error');
    });

    it('should share cache across multiple nodes', async () => {
      const node1: NodeFunction<TestState> = async (state) => {
        return { ...state, result: 'node1' };
      };

      const node2: NodeFunction<TestState> = async (state) => {
        return { ...state, result: 'node2' };
      };

      const sharedCache = createSharedCache<TestState>({ ttl: 1000 });
      const enhanced1 = sharedCache.withCache(node1);
      const enhanced2 = sharedCache.withCache(node2);

      await enhanced1({ value: 1 });
      await enhanced2({ value: 1 });

      expect(sharedCache.size()).toBe(1);
    });
  });
});
