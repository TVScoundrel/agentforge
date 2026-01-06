import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { withCache, createSharedCache } from '../caching.js';
import { withValidation } from '../validation.js';
import { withRateLimit } from '../rate-limiting.js';
import { withConcurrency, createSharedConcurrencyController } from '../concurrency.js';
import { withLogging } from '../logging.js';
import { compose, MiddlewareChain } from '../compose.js';
import { production, development, testing } from '../presets.js';
import type { NodeFunction, SimpleMiddleware } from '../types.js';

interface TestState {
  value: number;
  result?: string;
}

describe('Middleware Integration Tests', () => {
  let callCount: number;
  let node: NodeFunction<TestState>;

  beforeEach(() => {
    callCount = 0;
    node = async (state: TestState) => {
      callCount++;
      return { ...state, result: `processed-${state.value}` };
    };
  });

  describe('Middleware Composition', () => {
    it('should compose multiple middleware in correct order', async () => {
      const logs: string[] = [];

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
  });

  describe('Cache + Validation Integration', () => {
    it('should validate before caching', async () => {
      const inputSchema = z.object({
        value: z.number().min(0),
      }).strict();

      const enhanced = compose<TestState>(
        (n) => withValidation(n, { inputSchema }),
        (n) => withCache(n, { ttl: 1000 })
      )(node);

      // Valid input should work
      const result1 = await enhanced({ value: 5 });
      expect(result1.result).toBe('processed-5');
      expect(callCount).toBe(1);

      // Cached result
      const result2 = await enhanced({ value: 5 });
      expect(result2.result).toBe('processed-5');
      expect(callCount).toBe(1); // Still 1, from cache

      // Invalid input should fail validation before hitting cache
      await expect(enhanced({ value: -1 } as TestState)).rejects.toThrow();
      expect(callCount).toBe(1); // Still 1, validation failed
    });
  });

  describe('Rate Limiting + Concurrency Integration', () => {
    it('should rate limit and control concurrency', async () => {
      const slowNode: NodeFunction<TestState> = async (state) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { ...state, result: 'done' };
      };

      const enhanced = compose<TestState>(
        (n) => withRateLimit(n, { maxRequests: 5, windowMs: 1000 }),
        (n) => withConcurrency(n, { maxConcurrent: 2 })
      )(slowNode);

      const start = Date.now();
      await Promise.all([
        enhanced({ value: 1 }),
        enhanced({ value: 2 }),
        enhanced({ value: 3 }),
      ]);
      const duration = Date.now() - start;

      // With max 2 concurrent, 3 tasks should take at least 100ms (2 batches)
      expect(duration).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Production Preset Integration', () => {
    it('should apply production middleware stack', async () => {
      const enhanced = production(node, {
        nodeName: 'prod-node',
        enableMetrics: false,
        enableTracing: false,
      });

      const result = await enhanced({ value: 42 });
      expect(result.result).toBe('processed-42');
    });

    it('should handle errors in production preset', async () => {
      let errorCaught = false;
      const errorNode: NodeFunction<TestState> = async (state) => {
        if (state.value < 0) {
          throw new Error('Negative value');
        }
        return { ...state, result: 'ok' };
      };

      const enhanced = production(errorNode, {
        nodeName: 'error-node',
        enableMetrics: false,
        enableTracing: false,
        errorOptions: {
          onError: (error, state) => {
            errorCaught = true;
            return state; // Return state to prevent error propagation
          },
        },
      });

      // Error is caught and state is returned
      const result = await enhanced({ value: -1 });
      expect(result.value).toBe(-1);
      expect(errorCaught).toBe(true);
    });

    it('should retry on failure when enabled', async () => {
      let attempts = 0;
      const flakyNode: NodeFunction<TestState> = async (state) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { ...state, result: 'success' };
      };

      const enhanced = production(flakyNode, {
        nodeName: 'flaky-node',
        enableMetrics: false,
        enableTracing: false,
        enableRetry: true,
        retryOptions: {
          maxAttempts: 3,
          initialDelay: 10,
        },
      });

      const result = await enhanced({ value: 1 });
      expect(result.result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('Development Preset Integration', () => {
    it('should apply development middleware stack', async () => {
      const enhanced = development(node, {
        nodeName: 'dev-node',
      });

      const result = await enhanced({ value: 42 });
      expect(result.result).toBe('processed-42');
    });

    it('should log errors in development preset', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Dev error');
      };

      const enhanced = development(errorNode, {
        nodeName: 'dev-error-node',
      });

      await expect(enhanced({ value: 1 })).rejects.toThrow('Dev error');
    });
  });

  describe('Testing Preset Integration', () => {
    it('should use mock response', async () => {
      const mockResponse = { value: 99, result: 'mocked' };
      const enhanced = testing(node, {
        nodeName: 'test-node',
        mockResponse,
      });

      const result = await enhanced({ value: 1 });
      expect(result).toEqual(mockResponse);
      expect(callCount).toBe(0); // Node not called
    });

    it('should track invocations', async () => {
      const enhanced = testing(node, {
        nodeName: 'test-node',
        trackInvocations: true,
      });

      await enhanced({ value: 1 });
      await enhanced({ value: 2 });

      expect(enhanced.invocations).toHaveLength(2);
      expect(enhanced.invocations[0].value).toBe(1);
      expect(enhanced.invocations[1].value).toBe(2);
    });

    it('should simulate errors', async () => {
      const enhanced = testing(node, {
        nodeName: 'test-node',
        simulateError: new Error('Simulated error'),
      });

      await expect(enhanced({ value: 1 })).rejects.toThrow('Simulated error');
      expect(callCount).toBe(0); // Node not called
    });
  });

  describe('Complex Middleware Stacks', () => {
    it('should compose cache, validation, rate limiting, and logging', async () => {
      const inputSchema = z.object({
        value: z.number(),
      }).strict();

      const enhanced = compose(
        withLogging({ name: 'complex-node' }),
        (n) => withRateLimit(n, { maxRequests: 10, windowMs: 1000 }),
        (n) => withValidation(n, { inputSchema }),
        (n) => withCache(n, { ttl: 1000 })
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
        (n) => withValidation(n, { inputSchema })
      )(errorNode);

      await expect(enhanced({ value: 1 })).rejects.toThrow('Node error');
    });
  });

  describe('Shared Resources', () => {
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
      await enhanced2({ value: 1 }); // Same value to test cache sharing

      // Both should use the same cache, so only 1 entry
      expect(sharedCache.size()).toBe(1);
    });

    it('should share rate limiter across multiple nodes', async () => {
      const node1: NodeFunction<TestState> = async (state) => {
        return { ...state, result: 'node1' };
      };

      const node2: NodeFunction<TestState> = async (state) => {
        return { ...state, result: 'node2' };
      };

      // Use keyGenerator to share rate limit
      const keyGen = () => 'shared-key';
      const enhanced1 = withRateLimit(node1, {
        maxRequests: 5,
        windowMs: 1000,
        keyGenerator: keyGen,
      });

      const enhanced2 = withRateLimit(node2, {
        maxRequests: 5,
        windowMs: 1000,
        keyGenerator: keyGen,
      });

      // Both should share the same rate limit
      await Promise.all([
        enhanced1({ value: 1 }),
        enhanced2({ value: 2 }),
      ]);
    });

    it('should share concurrency controller across multiple nodes', async () => {
      const controller = createSharedConcurrencyController<TestState>({ maxConcurrent: 2 });

      const slowNode1: NodeFunction<TestState> = async (state) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { ...state, result: 'node1' };
      };

      const slowNode2: NodeFunction<TestState> = async (state) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { ...state, result: 'node2' };
      };

      const enhanced1 = controller.withConcurrency(slowNode1);
      const enhanced2 = controller.withConcurrency(slowNode2);

      const start = Date.now();
      await Promise.all([
        enhanced1({ value: 1 }),
        enhanced2({ value: 2 }),
      ]);
      const duration = Date.now() - start;

      // With shared controller limiting to 2, both should run concurrently
      expect(duration).toBeLessThan(100);
    });
  });
});

