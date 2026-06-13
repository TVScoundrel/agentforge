import { describe, it, expect, beforeEach } from 'vitest';
import { testing } from '../../presets.js';
import type { NodeFunction } from '../../types.js';
import { createTestNode, type TestState } from './shared.js';

describe('Middleware Presets', () => {
  describe('testing preset', () => {
    let testNode: NodeFunction<TestState>;

    beforeEach(() => {
      testNode = createTestNode();
    });

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

      expect(duration).toBeGreaterThanOrEqual(40);
      expect(duration).toBeLessThan(200);
    });

    it('should call original node when no mock or error', async () => {
      const testingNode = testing(testNode, {
        nodeName: 'test-node',
      });

      const result = await testingNode({ value: 10 });
      expect(result.result).toBe('processed-10');
    });
  });
});
