import { describe, it, expect, vi } from 'vitest';
import {
  AgentError,
  createErrorReporter,
} from '../../../src/langgraph/observability/errors.js';

describe('Enhanced Error Handling', () => {
  describe('AgentError', () => {
    it('should create an error with message', () => {
      const error = new AgentError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AgentError');
      expect(error.timestamp).toBeDefined();
    });

    it('should include error code', () => {
      const error = new AgentError('Test error', {
        code: 'TEST_ERROR',
      });

      expect(error.code).toBe('TEST_ERROR');
    });

    it('should include node name', () => {
      const error = new AgentError('Test error', {
        node: 'test-node',
      });

      expect(error.node).toBe('test-node');
    });

    it('should include state', () => {
      const state = { count: 5 };
      const error = new AgentError('Test error', {
        state,
      });

      expect(error.state).toEqual(state);
    });

    it('should include metadata', () => {
      const metadata = { userId: 'user-123' };
      const error = new AgentError('Test error', {
        metadata,
      });

      expect(error.metadata).toEqual(metadata);
    });

    it('should include cause', () => {
      const cause = new Error('Original error');
      const error = new AgentError('Test error', {
        cause,
      });

      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON', () => {
      const error = new AgentError('Test error', {
        code: 'TEST_ERROR',
        node: 'test-node',
        metadata: { key: 'value' },
      });

      const json = error.toJSON();

      expect(json.name).toBe('AgentError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.node).toBe('test-node');
      expect(json.metadata).toEqual({ key: 'value' });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should include cause in JSON', () => {
      const cause = new Error('Original error');
      const error = new AgentError('Test error', {
        cause,
      });

      const json = error.toJSON();

      expect(json.cause).toBeDefined();
      expect(json.cause.name).toBe('Error');
      expect(json.cause.message).toBe('Original error');
      expect(json.cause.stack).toBeDefined();
    });

    it('should convert to string', () => {
      const error = new AgentError('Test error', {
        code: 'TEST_ERROR',
        node: 'test-node',
      });

      const str = error.toString();

      expect(str).toContain('AgentError: Test error');
      expect(str).toContain('Code: TEST_ERROR');
      expect(str).toContain('Node: test-node');
    });

    it('should include cause in string', () => {
      const cause = new Error('Original error');
      const error = new AgentError('Test error', {
        cause,
      });

      const str = error.toString();

      expect(str).toContain('Caused by: Original error');
    });
  });

  describe('createErrorReporter', () => {
    it('should create an error reporter', () => {
      const reporter = createErrorReporter({
        onError: () => {},
      });

      expect(reporter).toBeDefined();
      expect(reporter.wrap).toBeDefined();
      expect(reporter.report).toBeDefined();
    });

    it('should wrap a node and catch errors', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
        rethrow: false,
      });

      const node = () => {
        throw new Error('Test error');
      };

      const wrappedNode = reporter.wrap(node, 'test-node');

      await wrappedNode({ count: 0 });

      expect(onError).toHaveBeenCalledOnce();
      const error = onError.mock.calls[0][0];
      expect(error).toBeInstanceOf(AgentError);
      expect(error.message).toBe('Test error');
      expect(error.node).toBe('test-node');
    });

    it('should rethrow errors by default', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
      });

      const node = () => {
        throw new Error('Test error');
      };

      const wrappedNode = reporter.wrap(node, 'test-node');

      await expect(wrappedNode({ count: 0 })).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalledOnce();
    });

    it('should not rethrow when configured', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
        rethrow: false,
      });

      const node = () => {
        throw new Error('Test error');
      };

      const wrappedNode = reporter.wrap(node, 'test-node');

      const result = await wrappedNode({ count: 5 });

      expect(result).toEqual({ count: 5 }); // Returns original state
      expect(onError).toHaveBeenCalledOnce();
    });

    it('should include state when configured', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
        includeState: true,
        rethrow: false,
      });

      const node = () => {
        throw new Error('Test error');
      };

      const wrappedNode = reporter.wrap(node, 'test-node');

      await wrappedNode({ count: 5 });

      const error = onError.mock.calls[0][0];
      expect(error.state).toEqual({ count: 5 });
    });

    it('should not include state by default', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
        rethrow: false,
      });

      const node = () => {
        throw new Error('Test error');
      };

      const wrappedNode = reporter.wrap(node, 'test-node');

      await wrappedNode({ count: 5 });

      const error = onError.mock.calls[0][0];
      expect(error.state).toBeUndefined();
    });

    it('should handle async errors', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
        rethrow: false,
      });

      const node = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      };

      const wrappedNode = reporter.wrap(node, 'async-node');

      await wrappedNode({ count: 0 });

      expect(onError).toHaveBeenCalledOnce();
      const error = onError.mock.calls[0][0];
      expect(error.message).toBe('Async error');
    });

    it('should preserve AgentError instances', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
        rethrow: false,
      });

      const originalError = new AgentError('Original error', {
        code: 'ORIGINAL_ERROR',
      });

      const node = () => {
        throw originalError;
      };

      const wrappedNode = reporter.wrap(node, 'test-node');

      await wrappedNode({ count: 0 });

      const error = onError.mock.calls[0][0];
      expect(error).toBe(originalError);
      expect(error.code).toBe('ORIGINAL_ERROR');
    });

    it('should report errors manually', async () => {
      const onError = vi.fn();
      const reporter = createErrorReporter({
        onError,
      });

      const error = new Error('Manual error');

      await reporter.report(error, {
        node: 'manual-node',
        code: 'MANUAL_ERROR',
      });

      expect(onError).toHaveBeenCalledOnce();
      const reportedError = onError.mock.calls[0][0];
      expect(reportedError).toBeInstanceOf(AgentError);
      expect(reportedError.message).toBe('Manual error');
      expect(reportedError.node).toBe('manual-node');
      expect(reportedError.code).toBe('MANUAL_ERROR');
    });
  });
});

