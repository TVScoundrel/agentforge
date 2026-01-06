/**
 * Tests for middleware presets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { presets, production, development, testing } from '../presets.js';
import { createLogger, LogLevel } from '../../observability/logger.js';
import type { NodeFunction } from '../types.js';

interface TestState {
  value: number;
  result?: string;
}

describe('Middleware Presets', () => {
  let testNode: NodeFunction<TestState>;

  beforeEach(() => {
    testNode = async (state: TestState) => ({
      ...state,
      result: `processed-${state.value}`,
    });
  });

  describe('production preset', () => {
    it('should apply production middleware stack', async () => {
      const logger = createLogger({ level: LogLevel.ERROR });
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

      const logger = createLogger({ level: LogLevel.ERROR });
      const logSpy = vi.spyOn(logger, 'error');

      const productionNode = production(errorNode, {
        nodeName: 'error-node',
        logger,
        enableRetry: false, // Disable retry for faster test
        errorOptions: {
          rethrow: true, // Rethrow error after logging
        },
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

      const logger = createLogger({ level: LogLevel.ERROR });
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

      const logger = createLogger({ level: LogLevel.ERROR });
      const productionNode = production(slowNode, {
        nodeName: 'slow-node',
        logger,
        timeout: 100,
        enableRetry: false,
      });

      const result = await productionNode({ value: 1 });

      // Should return original state on timeout
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

  describe('development preset', () => {
    it('should apply development middleware', async () => {
      const logger = createLogger({ level: LogLevel.DEBUG });
      const devNode = development(testNode, {
        nodeName: 'test-node',
        logger,
        verbose: true,
      });

      const result = await devNode({ value: 42 });

      expect(result.result).toBe('processed-42');
    });

    it('should log input and output when verbose', async () => {
      const logger = createLogger({ level: LogLevel.DEBUG });
      const debugSpy = vi.spyOn(logger, 'debug');

      const devNode = development(testNode, {
        nodeName: 'test-node',
        logger,
        verbose: true,
      });

      await devNode({ value: 5 });

      expect(debugSpy).toHaveBeenCalledWith('[test-node] Input:', { value: 5 });
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[test-node] Output'),
        expect.objectContaining({ result: 'processed-5' })
      );
    });

    it('should not log when verbose is false', async () => {
      const logger = createLogger({ level: LogLevel.DEBUG });
      const debugSpy = vi.spyOn(logger, 'debug');

      const devNode = development(testNode, {
        nodeName: 'test-node',
        logger,
        verbose: false,
      });

      await devNode({ value: 5 });

      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('should log errors with stack trace', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Dev error');
      };

      const logger = createLogger({ level: LogLevel.DEBUG });
      const errorSpy = vi.spyOn(logger, 'error');

      const devNode = development(errorNode, {
        nodeName: 'error-node',
        logger,
      });

      await expect(devNode({ value: 1 })).rejects.toThrow('Dev error');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[error-node] Error'),
        expect.objectContaining({
          error: 'Dev error',
          stack: expect.any(String),
        })
      );
    });
  });

  describe('testing preset', () => {
    it('should return mock response when provided', async () => {
      const testingNode = testing(testNode, {
        nodeName: 'test-node',
        mockResponse: { result: 'mocked' },
      });

      const result = await testingNode({ value: 1 });

      expect(result.result).toBe('mocked');
      expect(result.value).toBe(1);
    });

    it('should simulate errors when provided', async () => {
      const testingNode = testing(testNode, {
        nodeName: 'test-node',
        simulateError: new Error('Simulated error'),
      });

      await expect(testingNode({ value: 1 })).rejects.toThrow('Simulated error');
    });

    it('should track invocations when enabled', async () => {
      const testingNode = testing(testNode, {
        nodeName: 'test-node',
        trackInvocations: true,
      });

      await testingNode({ value: 1 });
      await testingNode({ value: 2 });
      await testingNode({ value: 3 });

      expect(testingNode.invocations).toHaveLength(3);
      expect(testingNode.invocations[0].value).toBe(1);
      expect(testingNode.invocations[1].value).toBe(2);
      expect(testingNode.invocations[2].value).toBe(3);
    });

    it('should add delay when specified', async () => {
      const testingNode = testing(testNode, {
        nodeName: 'test-node',
        delay: 50,
      });

      const start = Date.now();
      await testingNode({ value: 1 });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should call original node when no mock or error', async () => {
      const testingNode = testing(testNode, {
        nodeName: 'test-node',
      });

      const result = await testingNode({ value: 10 });

      expect(result.result).toBe('processed-10');
    });
  });

  describe('presets object', () => {
    it('should export all presets', () => {
      expect(presets.production).toBe(production);
      expect(presets.development).toBe(development);
      expect(presets.testing).toBe(testing);
    });
  });
});

