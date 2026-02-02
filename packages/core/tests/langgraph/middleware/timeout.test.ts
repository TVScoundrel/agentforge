import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from '../../../src/langgraph/middleware/timeout';

describe('Timeout Pattern', () => {
  interface TestState {
    value: number;
    timedOut?: boolean;
    error?: string;
  }

  describe('withTimeout', () => {
    it('should return result if node completes within timeout', async () => {
      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { value: state.value + 1 };
      });

      const onTimeout = vi.fn();
      const wrappedNode = withTimeout(node, {
        timeout: 100,
        onTimeout,
      });

      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 1 });
      expect(node).toHaveBeenCalledTimes(1);
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should call onTimeout if node exceeds timeout', async () => {
      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { value: state.value + 1 };
      });

      const onTimeout = vi.fn((state: TestState) => ({
        ...state,
        timedOut: true,
        error: 'Operation timed out',
      }));

      const wrappedNode = withTimeout(node, {
        timeout: 50,
        onTimeout,
      });

      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({
        value: 0,
        timedOut: true,
        error: 'Operation timed out',
      });
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('should call logTimeout callback if provided', async () => {
      const node = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { value: 1 };
      });

      const onTimeout = vi.fn((state: TestState) => state);
      const logTimeout = vi.fn();

      const wrappedNode = withTimeout(node, {
        timeout: 50,
        onTimeout,
        logTimeout,
      });

      await wrappedNode({ value: 0 });

      expect(logTimeout).toHaveBeenCalledTimes(1);
      expect(logTimeout).toHaveBeenCalledWith({ value: 0 });
    });

    it('should throw TimeoutError if throwOnTimeout is true', async () => {
      const node = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { value: 1 };
      });

      const onTimeout = vi.fn((state: TestState) => state);

      const wrappedNode = withTimeout(node, {
        timeout: 50,
        onTimeout,
        throwOnTimeout: true,
      });

      await expect(wrappedNode({ value: 0 })).rejects.toThrow(TimeoutError);
      await expect(wrappedNode({ value: 0 })).rejects.toThrow(
        'Node execution timed out after 50ms'
      );
    });

    it('should handle async onTimeout callback', async () => {
      const node = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { value: 1 };
      });

      const onTimeout = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ...state, timedOut: true };
      });

      const wrappedNode = withTimeout(node, {
        timeout: 50,
        onTimeout,
      });

      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 0, timedOut: true });
    });

    it('should propagate non-timeout errors', async () => {
      const node = vi.fn(async () => {
        throw new Error('Node error');
      });

      const onTimeout = vi.fn((state: TestState) => state);

      const wrappedNode = withTimeout(node, {
        timeout: 100,
        onTimeout,
      });

      await expect(wrappedNode({ value: 0 })).rejects.toThrow('Node error');
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should work with synchronous nodes', async () => {
      const node = vi.fn((state: TestState) => ({ value: state.value + 1 }));

      const onTimeout = vi.fn();
      const wrappedNode = withTimeout(node, {
        timeout: 100,
        onTimeout,
      });

      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 1 });
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should work with partial state updates', async () => {
      const node = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { value: 1 };
      });

      const onTimeout = vi.fn(() => ({
        timedOut: true,
      }));

      const wrappedNode = withTimeout(node, {
        timeout: 50,
        onTimeout,
      });

      const result = await wrappedNode({ value: 42 });

      expect(result).toEqual({ timedOut: true });
    });
  });
});

