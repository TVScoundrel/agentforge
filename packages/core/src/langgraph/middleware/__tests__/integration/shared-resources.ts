import { describe, expect, it } from 'vitest';
import { createSharedConcurrencyController } from '../../concurrency.js';
import { createSharedRateLimiter } from '../../rate-limiting.js';
import type { NodeFunction } from '../../types.js';
import type { TestState } from './shared.js';

describe('Middleware Integration Tests', () => {
  describe('Shared Resources', () => {
    it('should share rate limiter across multiple nodes', async () => {
      const node1: NodeFunction<TestState> = async (state) => {
        return { ...state, result: 'node1' };
      };

      const node2: NodeFunction<TestState> = async (state) => {
        return { ...state, result: 'node2' };
      };

      const sharedLimiter = createSharedRateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      const rateLimitedNode1 = sharedLimiter.withRateLimit(node1, () => 'shared-key');
      const rateLimitedNode2 = sharedLimiter.withRateLimit(node2, () => 'shared-key');

      await rateLimitedNode1({ value: 1 });
      await rateLimitedNode2({ value: 2 });

      await expect(rateLimitedNode1({ value: 3 })).rejects.toThrow(
        'Rate limit exceeded for key: shared-key'
      );
    });

    it('should share concurrency controller across multiple nodes', async () => {
      const controller = createSharedConcurrencyController<TestState>({ maxConcurrent: 2 });

      const slowNode1: NodeFunction<TestState> = async (state) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, result: 'node1' };
      };

      const slowNode2: NodeFunction<TestState> = async (state) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, result: 'node2' };
      };

      const enhanced1 = controller.withConcurrency(slowNode1);
      const enhanced2 = controller.withConcurrency(slowNode2);

      const start = Date.now();
      await Promise.all([enhanced1({ value: 1 }), enhanced2({ value: 2 })]);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
