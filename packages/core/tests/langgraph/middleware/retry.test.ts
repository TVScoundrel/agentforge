import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../../src/langgraph/middleware/retry';

describe('Retry Pattern', () => {
  interface TestState {
    value: number;
    attempts?: number;
  }

  describe('withRetry', () => {
    it('should succeed on first attempt if node succeeds', async () => {
      const node = vi.fn((state: TestState) => ({ value: state.value + 1 }));
      const wrappedNode = withRetry(node);

      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 1 });
      expect(node).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const node = vi.fn((state: TestState) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { value: state.value + 1 };
      });

      const wrappedNode = withRetry(node, { maxAttempts: 3, initialDelay: 10 });
      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 1 });
      expect(node).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts', async () => {
      const node = vi.fn(() => {
        throw new Error('Persistent failure');
      });

      const wrappedNode = withRetry(node, { maxAttempts: 3, initialDelay: 10 });

      await expect(wrappedNode({ value: 0 })).rejects.toThrow('Persistent failure');
      expect(node).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      let attempts = 0;
      const node = vi.fn(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Retry me');
        }
        return { value: 1 };
      });

      const onRetry = vi.fn();
      const wrappedNode = withRetry(node, {
        maxAttempts: 3,
        initialDelay: 10,
        onRetry,
      });

      await wrappedNode({ value: 0 });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should respect shouldRetry predicate', async () => {
      const node = vi.fn(() => {
        throw new Error('Do not retry');
      });

      const shouldRetry = vi.fn(() => false);
      const wrappedNode = withRetry(node, {
        maxAttempts: 3,
        shouldRetry,
      });

      await expect(wrappedNode({ value: 0 })).rejects.toThrow('Do not retry');
      expect(node).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    it('should use constant backoff strategy', async () => {
      let attempts = 0;
      const node = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry');
        }
        return { value: 1 };
      });

      const start = Date.now();
      const wrappedNode = withRetry(node, {
        maxAttempts: 3,
        backoff: 'constant',
        initialDelay: 50,
      });

      await wrappedNode({ value: 0 });
      const duration = Date.now() - start;

      // Should take approximately 100ms (2 retries * 50ms)
      expect(duration).toBeGreaterThanOrEqual(90);
      expect(duration).toBeLessThan(200);
    });

    it('should use exponential backoff strategy', async () => {
      let attempts = 0;
      const node = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry');
        }
        return { value: 1 };
      });

      const start = Date.now();
      const wrappedNode = withRetry(node, {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 50,
      });

      await wrappedNode({ value: 0 });
      const duration = Date.now() - start;

      // Should take approximately 150ms (50ms + 100ms)
      expect(duration).toBeGreaterThanOrEqual(140);
      expect(duration).toBeLessThan(250);
    });

    it('should respect maxDelay', async () => {
      let attempts = 0;
      const node = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry');
        }
        return { value: 1 };
      });

      const wrappedNode = withRetry(node, {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 50,
      });

      const start = Date.now();
      await wrappedNode({ value: 0 });
      const duration = Date.now() - start;

      // Should be capped at maxDelay (50ms * 2 retries = 100ms)
      expect(duration).toBeLessThan(200);
    });
  });
});

