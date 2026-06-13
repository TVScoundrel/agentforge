import { describe, it, expect, beforeEach, vi } from 'vitest';
import { development } from '../../presets.js';
import { createLogger, LogLevel } from '../../../observability/logger.js';
import type { NodeFunction } from '../../types.js';
import { createTestNode, type TestState } from './shared.js';

describe('Middleware Presets', () => {
  describe('development preset', () => {
    let testNode: NodeFunction<TestState>;

    beforeEach(() => {
      testNode = createTestNode();
    });

    it('should apply development middleware', async () => {
      const logger = createLogger('test-logger', { level: LogLevel.DEBUG });
      const devNode = development(testNode, {
        nodeName: 'test-node',
        logger,
        verbose: true,
      });

      const result = await devNode({ value: 42 });
      expect(result.result).toBe('processed-42');
    });

    it('should log input and output when verbose', async () => {
      const logger = createLogger('test-logger', { level: LogLevel.DEBUG });
      const infoSpy = vi.spyOn(logger, 'info');
      const devNode = development(testNode, {
        nodeName: 'test-node',
        logger,
        verbose: true,
      });

      await devNode({ value: 5 });

      expect(infoSpy).toHaveBeenCalledWith('Node execution started', expect.objectContaining({ state: { value: 5 } }));
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Node execution completed'),
        expect.objectContaining({ result: expect.objectContaining({ result: 'processed-5' }) })
      );
    });

    it('should not log when verbose is false', async () => {
      const logger = createLogger('test-logger', { level: LogLevel.DEBUG });
      const infoSpy = vi.spyOn(logger, 'info');
      const devNode = development(testNode, {
        nodeName: 'test-node',
        logger,
        verbose: false,
      });

      await devNode({ value: 5 });

      const calls = infoSpy.mock.calls;
      const hasInputLog = calls.some(call => call[0].includes('started'));
      const hasOutputLog = calls.some((call) => {
        if (!call[0].includes('completed')) {
          return false;
        }

        const payload = call[1];
        return typeof payload === 'object' && payload !== null && !Array.isArray(payload) && 'result' in payload;
      });

      expect(hasInputLog).toBe(false);
      expect(hasOutputLog).toBe(false);
    });

    it('should log errors with stack trace', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Dev error');
      };

      const logger = createLogger('test-logger', { level: LogLevel.DEBUG });
      const errorSpy = vi.spyOn(logger, 'error');
      const devNode = development(errorNode, {
        nodeName: 'error-node',
        logger,
      });

      await expect(devNode({ value: 1 })).rejects.toThrow('Dev error');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Node execution failed'),
        expect.objectContaining({
          error: 'Dev error',
          stack: expect.any(String),
        })
      );
    });
  });
});
