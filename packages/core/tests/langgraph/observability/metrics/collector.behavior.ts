import { describe, expect, it, vi } from 'vitest';
import {
  createMetrics,
  MetricType,
} from '../../../../src/langgraph/observability/metrics.js';

export function runCollectorTests(): void {
  describe('createMetrics', () => {
    it('creates a collector with the public operations', () => {
      const metrics = createMetrics('test');

      expect(metrics.increment).toBeDefined();
      expect(metrics.gauge).toBeDefined();
      expect(metrics.histogram).toBeDefined();
    });

    it('increments and decrements counters independently by labels', () => {
      const metrics = createMetrics('test');

      metrics.increment('requests');
      metrics.increment('requests', 3);
      metrics.decrement('requests', 2);
      metrics.increment('requests', 1, { method: 'GET' });

      const counters = metrics.getMetrics().filter((metric) => metric.type === MetricType.COUNTER);

      expect(counters.map((metric) => metric.value)).toEqual([1, 4, 2, 1]);
      expect(counters[3].labels).toEqual({ method: 'GET' });
    });

    it('records prefixed gauges, histograms, labels, and timestamps', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1234);
      const metrics = createMetrics('my-agent');

      metrics.gauge('connections', 5, { region: 'eu' });
      metrics.histogram('duration', 100);

      expect(metrics.getMetrics()).toEqual([
        {
          type: MetricType.GAUGE,
          name: 'my-agent.connections',
          value: 5,
          timestamp: 1234,
          labels: { region: 'eu' },
        },
        {
          type: MetricType.HISTOGRAM,
          name: 'my-agent.duration',
          value: 100,
          timestamp: 1234,
        },
      ]);
      vi.restoreAllMocks();
    });

    it('records timer duration as a histogram', () => {
      vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(145).mockReturnValueOnce(145);
      const metrics = createMetrics('test');

      const duration = metrics.startTimer('operation', { phase: 'run' }).end();

      expect(duration).toBe(45);
      expect(metrics.getMetrics()[0]).toMatchObject({
        type: MetricType.HISTOGRAM,
        name: 'test.operation',
        value: 45,
        labels: { phase: 'run' },
      });
      vi.restoreAllMocks();
    });

    it('clears entries and counter state', () => {
      const metrics = createMetrics('test');
      metrics.increment('requests', 4);

      metrics.clear();
      metrics.increment('requests');

      expect(metrics.getMetrics()).toHaveLength(1);
      expect(metrics.getMetrics()[0].value).toBe(1);
    });
  });
}
