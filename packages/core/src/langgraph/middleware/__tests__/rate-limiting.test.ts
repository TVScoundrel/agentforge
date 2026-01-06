import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRateLimit, createSharedRateLimiter, type RateLimitOptions } from '../rate-limiting.js';
import type { NodeFunction } from '../types.js';

interface TestState {
  input: string;
  output?: string;
  userId?: string;
}

describe('Rate Limiting Middleware', () => {
  describe('withRateLimit()', () => {
    describe('Token Bucket Strategy', () => {
      it('should allow requests within rate limit', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 5,
          windowMs: 1000,
          strategy: 'token-bucket',
        });

        // Should allow 5 requests
        for (let i = 0; i < 5; i++) {
          await rateLimitedNode({ input: `test${i}` });
        }

        expect(node).toHaveBeenCalledTimes(5);
      });

      it('should reject requests exceeding rate limit', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 3,
          windowMs: 1000,
          strategy: 'token-bucket',
        });

        // Should allow 3 requests
        for (let i = 0; i < 3; i++) {
          await rateLimitedNode({ input: `test${i}` });
        }

        // 4th request should be rejected
        await expect(rateLimitedNode({ input: 'test4' })).rejects.toThrow('Rate limit exceeded');
        expect(node).toHaveBeenCalledTimes(3);
      });

      it('should refill tokens over time', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 2,
          windowMs: 100, // 100ms window = 20 tokens/second
          strategy: 'token-bucket',
        });

        // Use up all tokens
        await rateLimitedNode({ input: 'test1' });
        await rateLimitedNode({ input: 'test2' });

        // Wait for tokens to refill
        await new Promise((resolve) => setTimeout(resolve, 60)); // Wait 60ms to get ~1.2 tokens

        // Should allow another request
        await rateLimitedNode({ input: 'test3' });
        expect(node).toHaveBeenCalledTimes(3);
      });

      it('should call onRateLimitExceeded callback', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
        const onRateLimitExceeded = vi.fn();

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 1,
          windowMs: 1000,
          strategy: 'token-bucket',
          onRateLimitExceeded,
        });

        await rateLimitedNode({ input: 'test1' });
        await expect(rateLimitedNode({ input: 'test2' })).rejects.toThrow();

        expect(onRateLimitExceeded).toHaveBeenCalledWith('global');
      });
    });

    describe('Sliding Window Strategy', () => {
      it('should allow requests within sliding window', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 3,
          windowMs: 100,
          strategy: 'sliding-window',
        });

        // Should allow 3 requests
        for (let i = 0; i < 3; i++) {
          await rateLimitedNode({ input: `test${i}` });
        }

        expect(node).toHaveBeenCalledTimes(3);
      });

      it('should reject requests exceeding sliding window', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 2,
          windowMs: 100,
          strategy: 'sliding-window',
        });

        await rateLimitedNode({ input: 'test1' });
        await rateLimitedNode({ input: 'test2' });

        await expect(rateLimitedNode({ input: 'test3' })).rejects.toThrow('Rate limit exceeded');
        expect(node).toHaveBeenCalledTimes(2);
      });

      it('should allow requests after window expires', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 2,
          windowMs: 50,
          strategy: 'sliding-window',
        });

        await rateLimitedNode({ input: 'test1' });
        await rateLimitedNode({ input: 'test2' });

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 60));

        // Should allow new requests
        await rateLimitedNode({ input: 'test3' });
        await rateLimitedNode({ input: 'test4' });
        expect(node).toHaveBeenCalledTimes(4);
      });
    });

    describe('Fixed Window Strategy', () => {
      it('should allow requests within fixed window', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 3,
          windowMs: 100,
          strategy: 'fixed-window',
        });

        for (let i = 0; i < 3; i++) {
          await rateLimitedNode({ input: `test${i}` });
        }

        expect(node).toHaveBeenCalledTimes(3);
      });

      it('should reject requests exceeding fixed window', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 2,
          windowMs: 100,
          strategy: 'fixed-window',
        });

        await rateLimitedNode({ input: 'test1' });
        await rateLimitedNode({ input: 'test2' });

        await expect(rateLimitedNode({ input: 'test3' })).rejects.toThrow('Rate limit exceeded');
        expect(node).toHaveBeenCalledTimes(2);
      });

      it('should reset count when window expires', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 2,
          windowMs: 50,
          strategy: 'fixed-window',
        });

        await rateLimitedNode({ input: 'test1' });
        await rateLimitedNode({ input: 'test2' });

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 60));

        // Should allow new requests in new window
        await rateLimitedNode({ input: 'test3' });
        await rateLimitedNode({ input: 'test4' });
        expect(node).toHaveBeenCalledTimes(4);
      });
    });

    describe('Custom Key Generator', () => {
      it('should rate limit per user', async () => {
        const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

        const rateLimitedNode = withRateLimit(node, {
          maxRequests: 2,
          windowMs: 1000,
          strategy: 'token-bucket',
          keyGenerator: <State,>(state: State) => (state as TestState).userId || 'anonymous',
        });

        // User1 makes 2 requests (should succeed)
        await rateLimitedNode({ input: 'test1', userId: 'user1' });
        await rateLimitedNode({ input: 'test2', userId: 'user1' });

        // User1's 3rd request should fail
        await expect(rateLimitedNode({ input: 'test3', userId: 'user1' })).rejects.toThrow();

        // User2 should still be able to make requests
        await rateLimitedNode({ input: 'test4', userId: 'user2' });
        await rateLimitedNode({ input: 'test5', userId: 'user2' });

        expect(node).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe('createSharedRateLimiter()', () => {
    it('should create a shared rate limiter', async () => {
      const sharedLimiter = createSharedRateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      const node1: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'node1' }));
      const node2: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'node2' }));

      const rateLimitedNode1 = sharedLimiter.withRateLimit(node1);
      const rateLimitedNode2 = sharedLimiter.withRateLimit(node2);

      // Both nodes share the same rate limit
      await rateLimitedNode1({ input: 'test1', output: '' });
      await rateLimitedNode2({ input: 'test2', output: '' });
      await rateLimitedNode1({ input: 'test3', output: '' });

      // 4th request should fail (shared limit of 3)
      await expect(rateLimitedNode2({ input: 'test4', output: '' })).rejects.toThrow('Rate limit exceeded');

      expect(node1).toHaveBeenCalledTimes(2);
      expect(node2).toHaveBeenCalledTimes(1);
    });

    it('should reset rate limiter', async () => {
      const onRateLimitReset = vi.fn();
      const sharedLimiter = createSharedRateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: 'token-bucket',
        onRateLimitReset,
      });

      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const rateLimitedNode = sharedLimiter.withRateLimit(node);

      // Use up all tokens
      await rateLimitedNode({ input: 'test1' });
      await rateLimitedNode({ input: 'test2' });

      // Reset the limiter
      sharedLimiter.reset('global');

      // Should allow new requests
      await rateLimitedNode({ input: 'test3' });
      await rateLimitedNode({ input: 'test4' });

      expect(node).toHaveBeenCalledTimes(4);
      expect(onRateLimitReset).toHaveBeenCalledWith('global');
    });
  });
});
