import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMetrics,
  withMetrics,
  MetricType,
} from '../../../src/langgraph/observability/metrics.js';

describe('Metrics Collection', () => {
  describe('createMetrics', () => {
    it('should create a metrics collector', () => {
      const metrics = createMetrics('test');
      expect(metrics).toBeDefined();
      expect(metrics.increment).toBeDefined();
      expect(metrics.gauge).toBeDefined();
      expect(metrics.histogram).toBeDefined();
    });

    it('should increment counters', () => {
      const metrics = createMetrics('test');

      metrics.increment('requests');
      metrics.increment('requests');
      metrics.increment('requests', 3);

      const recorded = metrics.getMetrics();
      const counterMetrics = recorded.filter((m) => m.type === MetricType.COUNTER);

      expect(counterMetrics.length).toBe(3);
      expect(counterMetrics[0].value).toBe(1);
      expect(counterMetrics[1].value).toBe(2);
      expect(counterMetrics[2].value).toBe(5);
    });

    it('should decrement counters', () => {
      const metrics = createMetrics('test');

      metrics.increment('requests', 10);
      metrics.decrement('requests', 3);

      const recorded = metrics.getMetrics();
      const counterMetrics = recorded.filter((m) => m.type === MetricType.COUNTER);

      expect(counterMetrics[1].value).toBe(7);
    });

    it('should record gauge values', () => {
      const metrics = createMetrics('test');

      metrics.gauge('connections', 5);
      metrics.gauge('connections', 10);

      const recorded = metrics.getMetrics();
      const gaugeMetrics = recorded.filter((m) => m.type === MetricType.GAUGE);

      expect(gaugeMetrics.length).toBe(2);
      expect(gaugeMetrics[0].value).toBe(5);
      expect(gaugeMetrics[1].value).toBe(10);
    });

    it('should record histogram values', () => {
      const metrics = createMetrics('test');

      metrics.histogram('duration', 100);
      metrics.histogram('duration', 200);
      metrics.histogram('duration', 150);

      const recorded = metrics.getMetrics();
      const histogramMetrics = recorded.filter((m) => m.type === MetricType.HISTOGRAM);

      expect(histogramMetrics.length).toBe(3);
      expect(histogramMetrics.map((m) => m.value)).toEqual([100, 200, 150]);
    });

    it('should support labels', () => {
      const metrics = createMetrics('test');

      metrics.increment('requests', 1, { method: 'GET' });
      metrics.increment('requests', 1, { method: 'POST' });

      const recorded = metrics.getMetrics();

      expect(recorded[0].labels).toEqual({ method: 'GET' });
      expect(recorded[1].labels).toEqual({ method: 'POST' });
    });

    it('should prefix metric names', () => {
      const metrics = createMetrics('my-agent');

      metrics.increment('requests');

      const recorded = metrics.getMetrics();

      expect(recorded[0].name).toBe('my-agent.requests');
    });

    it('should track timers', async () => {
      const metrics = createMetrics('test');

      const timer = metrics.startTimer('operation');
      await new Promise((resolve) => setTimeout(resolve, 50));
      const duration = timer.end();

      // Allow for timing imprecision - setTimeout is not guaranteed to be exact
      // We just need to verify it's a reasonable duration (at least 45ms for a 50ms wait)
      expect(duration).toBeGreaterThanOrEqual(45);

      const recorded = metrics.getMetrics();
      const histogramMetrics = recorded.filter((m) => m.type === MetricType.HISTOGRAM);

      expect(histogramMetrics.length).toBe(1);
      expect(histogramMetrics[0].name).toBe('test.operation');
      expect(histogramMetrics[0].value).toBeGreaterThanOrEqual(45);
    });

    it('should clear metrics', () => {
      const metrics = createMetrics('test');

      metrics.increment('requests');
      metrics.gauge('connections', 5);

      expect(metrics.getMetrics().length).toBe(2);

      metrics.clear();

      expect(metrics.getMetrics().length).toBe(0);
    });

    it('should include timestamps', () => {
      const metrics = createMetrics('test');

      const before = Date.now();
      metrics.increment('requests');
      const after = Date.now();

      const recorded = metrics.getMetrics();

      expect(recorded[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(recorded[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('withMetrics', () => {
    it('should wrap a node with metrics tracking', async () => {
      const metrics = createMetrics('test');
      const node = (state: { count: number }) => ({ count: state.count + 1 });

      const metricNode = withMetrics(node, {
        name: 'my-node',
        metrics,
      });

      await metricNode({ count: 0 });

      const recorded = metrics.getMetrics();
      const invocations = recorded.filter((m) => m.name === 'test.my-node.invocations');
      const success = recorded.filter((m) => m.name === 'test.my-node.success');
      const duration = recorded.filter((m) => m.name === 'test.my-node.duration');

      expect(invocations.length).toBe(1);
      expect(success.length).toBe(1);
      expect(duration.length).toBe(1);
    });

    it('should track errors', async () => {
      const metrics = createMetrics('test');
      const node = () => {
        throw new Error('Test error');
      };

      const metricNode = withMetrics(node, {
        name: 'error-node',
        metrics,
      });

      await expect(metricNode({ count: 0 })).rejects.toThrow('Test error');

      const recorded = metrics.getMetrics();
      const errors = recorded.filter((m) => m.name === 'test.error-node.errors');

      expect(errors.length).toBe(1);
    });

    it('should respect tracking options', async () => {
      const metrics = createMetrics('test');
      const node = (state: { count: number }) => ({ count: state.count + 1 });

      const metricNode = withMetrics(node, {
        name: 'my-node',
        metrics,
        trackDuration: false,
        trackInvocations: false,
      });

      await metricNode({ count: 0 });

      const recorded = metrics.getMetrics();

      expect(recorded.length).toBe(1); // Only success metric
      expect(recorded[0].name).toBe('test.my-node.success');
    });

    it('should work with async nodes', async () => {
      const metrics = createMetrics('test');
      const node = async (state: { count: number }) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { count: state.count + 1 };
      };

      const metricNode = withMetrics(node, {
        name: 'async-node',
        metrics,
      });

      await metricNode({ count: 0 });

      const recorded = metrics.getMetrics();
      const duration = recorded.filter((m) => m.name === 'test.async-node.duration');

      expect(duration.length).toBe(1);
      expect(duration[0].value).toBeGreaterThanOrEqual(10);
    });
  });
});

