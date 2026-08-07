import { describe, expect, it } from 'vitest';
import { createMetrics, withMetrics } from '../../../../src/langgraph/observability/metrics.js';
import { incrementNode, metricsNamed } from './fixtures.js';

export function runNodeInstrumentationTests(): void {
  describe('withMetrics', () => {
    it('tracks invocation, success, and duration for synchronous nodes', async () => {
      const metrics = createMetrics('test');
      const metricNode = withMetrics(incrementNode, { name: 'my-node', metrics });

      await expect(metricNode({ count: 0 })).resolves.toEqual({ count: 1 });

      const recorded = metrics.getMetrics();
      expect(metricsNamed(recorded, 'test.my-node.invocations')).toHaveLength(1);
      expect(metricsNamed(recorded, 'test.my-node.success')).toHaveLength(1);
      expect(metricsNamed(recorded, 'test.my-node.duration')).toHaveLength(1);
    });

    it('tracks asynchronous node results', async () => {
      const metrics = createMetrics('test');
      const metricNode = withMetrics(async (state: { count: number }) => incrementNode(state), {
        name: 'async-node',
        metrics,
      });

      await expect(metricNode({ count: 0 })).resolves.toEqual({ count: 1 });
      expect(metricsNamed(metrics.getMetrics(), 'test.async-node.duration')).toHaveLength(1);
    });

    it('tracks errors and duration before rethrowing', async () => {
      const metrics = createMetrics('test');
      const error = new Error('Test error');
      const metricNode = withMetrics(() => {
        throw error;
      }, { name: 'error-node', metrics });

      await expect(metricNode({ count: 0 })).rejects.toBe(error);

      expect(metricsNamed(metrics.getMetrics(), 'test.error-node.errors')).toHaveLength(1);
      expect(metricsNamed(metrics.getMetrics(), 'test.error-node.duration')).toHaveLength(1);
    });

    it('respects disabled invocation, duration, and error tracking', async () => {
      const metrics = createMetrics('test');
      const successfulNode = withMetrics(incrementNode, {
        name: 'success-node',
        metrics,
        trackDuration: false,
        trackInvocations: false,
      });
      const failingNode = withMetrics(() => {
        throw new Error('Test error');
      }, {
        name: 'error-node',
        metrics,
        trackDuration: false,
        trackErrors: false,
        trackInvocations: false,
      });

      await successfulNode({ count: 0 });
      await expect(failingNode({ count: 0 })).rejects.toThrow('Test error');

      expect(metrics.getMetrics().map((metric) => metric.name)).toEqual(['test.success-node.success']);
    });
  });
}
