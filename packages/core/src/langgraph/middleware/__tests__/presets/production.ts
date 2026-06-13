import { describe, it, expect, beforeEach, vi } from 'vitest';
import { production } from '../../presets.js';
import { createLogger, LogLevel } from '../../../observability/logger.js';
import type { NodeFunction } from '../../types.js';
import { createTestNode, type TestState } from './shared.js';

describe('Middleware Presets', () => {
  describe('production preset', () => {
    let testNode: NodeFunction<TestState>;

    beforeEach(() => {
      testNode = createTestNode();
    });

    it('should apply production middleware stack', async () => {
      const logger = createLogger('test-logger', { level: LogLevel.ERROR });
      const productionNode = production(testNode, {
        nodeName: 'test-node',
        logger,
      });

      const result = await productionNode({ value: 42 });
      expect(result.result).toBe('processed-42');
    });

    it('should handle errors with logging', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Test error');
      };
      const logger = createLogger('test-logger', { level: LogLevel.ERROR });
      const logSpy = vi.spyOn(logger, 'error');
      const productionNode = production(errorNode, {
        nodeName: 'error-node',
        logger,
        enableRetry: false,
        errorOptions: { rethrow: true },
      });

      await expect(productionNode({ value: 1 })).rejects.toThrow('Test error');
      expect(logSpy).toHaveBeenCalled();
    });

    it('should retry on failure when enabled', async () => {
      let attempts = 0;
      const flakyNode: NodeFunction<TestState> = async (state) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return { ...state, result: 'success' };
      };

      const logger = createLogger('test-logger', { level: LogLevel.ERROR });
      const productionNode = production(flakyNode, {
        nodeName: 'flaky-node',
        logger,
        enableRetry: true,
        retryOptions: {
          maxAttempts: 3,
          initialDelay: 10,
        },
      });

      const result = await productionNode({ value: 1 });
      expect(result.result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should timeout long-running operations', async () => {
      const slowNode: NodeFunction<TestState> = async (state) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return state;
      };

      const logger = createLogger('test-logger', { level: LogLevel.ERROR });
      const productionNode = production(slowNode, {
        nodeName: 'slow-node',
        logger,
        timeout: 100,
        enableRetry: false,
      });

      const result = await productionNode({ value: 1 });
      expect(result.value).toBe(1);
    });

    it('should allow disabling metrics', async () => {
      const productionNode = production(testNode, {
        nodeName: 'test-node',
        enableMetrics: false,
      });

      const result = await productionNode({ value: 10 });
      expect(result.result).toBe('processed-10');
    });

    it('should allow disabling tracing', async () => {
      const productionNode = production(testNode, {
        nodeName: 'test-node',
        enableTracing: false,
      });

      const result = await productionNode({ value: 20 });
      expect(result.result).toBe('processed-20');
    });
  });
});
