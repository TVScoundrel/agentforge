import { describe, expect, it } from 'vitest';
import { development, production, testing } from '../../presets.js';
import type { NodeFunction } from '../../types.js';
import { createTrackedNode, type TestState } from './shared.js';

describe('Middleware Integration Tests', () => {
  describe('Production Preset Integration', () => {
    it('should apply production middleware stack', async () => {
      const { node } = createTrackedNode();

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
          onError: (_error, state) => {
            errorCaught = true;
            return state;
          },
        },
      });

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
      const { node } = createTrackedNode();

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
      const { getCallCount, node } = createTrackedNode();

      const enhanced = testing(node, {
        nodeName: 'test-node',
        mockResponse,
      });

      const result = await enhanced({ value: 1 });
      expect(result).toEqual(mockResponse);
      expect(getCallCount()).toBe(0);
    });

    it('should track invocations', async () => {
      const { node } = createTrackedNode();

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
      const { getCallCount, node } = createTrackedNode();

      const enhanced = testing(node, {
        nodeName: 'test-node',
        simulateError: new Error('Simulated error'),
      });

      await expect(enhanced({ value: 1 })).rejects.toThrow('Simulated error');
      expect(getCallCount()).toBe(0);
    });
  });
});
