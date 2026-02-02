import { describe, it, expect, vi } from 'vitest';
import { withErrorHandler } from '../../../src/langgraph/middleware/error-handler';

describe('Error Handler Pattern', () => {
  interface TestState {
    value: number;
    error?: string;
    failed?: boolean;
  }

  describe('withErrorHandler', () => {
    it('should return result if node succeeds', async () => {
      const node = vi.fn((state: TestState) => ({ value: state.value + 1 }));
      const onError = vi.fn();

      const wrappedNode = withErrorHandler(node, { onError });
      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 1 });
      expect(node).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onError and return error state if node fails', async () => {
      const node = vi.fn(() => {
        throw new Error('Node failed');
      });

      const onError = vi.fn((error: Error, state: TestState) => ({
        ...state,
        error: error.message,
        failed: true,
      }));

      const wrappedNode = withErrorHandler(node, { onError });
      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({
        value: 0,
        error: 'Node failed',
        failed: true,
      });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { value: 0 });
    });

    it('should call logError callback if provided', async () => {
      const node = vi.fn(() => {
        throw new Error('Test error');
      });

      const onError = vi.fn((error: Error, state: TestState) => state);
      const logError = vi.fn();

      const wrappedNode = withErrorHandler(node, { onError, logError });
      await wrappedNode({ value: 0 });

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith(expect.any(Error), { value: 0 });
    });

    it('should rethrow error if rethrow option is true', async () => {
      const node = vi.fn(() => {
        throw new Error('Rethrow me');
      });

      const onError = vi.fn((error: Error, state: TestState) => ({
        ...state,
        error: error.message,
      }));

      const wrappedNode = withErrorHandler(node, { onError, rethrow: true });

      await expect(wrappedNode({ value: 0 })).rejects.toThrow('Rethrow me');
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should handle async onError callback', async () => {
      const node = vi.fn(() => {
        throw new Error('Async error');
      });

      const onError = vi.fn(async (error: Error, state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ...state, error: error.message };
      });

      const wrappedNode = withErrorHandler(node, { onError });
      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 0, error: 'Async error' });
    });

    it('should handle non-Error objects', async () => {
      const node = vi.fn(() => {
        throw 'String error';
      });

      const onError = vi.fn((error: Error, state: TestState) => ({
        ...state,
        error: error.message,
      }));

      const wrappedNode = withErrorHandler(node, { onError });
      const result = await wrappedNode({ value: 0 });

      expect(result).toEqual({ value: 0, error: 'String error' });
    });

    it('should work with partial state updates', async () => {
      const node = vi.fn(() => {
        throw new Error('Partial update');
      });

      const onError = vi.fn((error: Error) => ({
        error: error.message,
        failed: true,
      }));

      const wrappedNode = withErrorHandler(node, { onError });
      const result = await wrappedNode({ value: 42 });

      expect(result).toEqual({
        error: 'Partial update',
        failed: true,
      });
    });
  });
});

