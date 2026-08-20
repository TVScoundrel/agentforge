import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Metrics } from '../../../src/langgraph/observability/metrics/contracts.js';

const { createMetricsMock, metricsMock } = vi.hoisted(() => {
  const metrics: Metrics = {
    increment: vi.fn(),
    decrement: vi.fn(),
    gauge: vi.fn(),
    histogram: vi.fn(),
    startTimer: vi.fn(() => ({ end: vi.fn() })),
    getMetrics: vi.fn(() => []),
    clear: vi.fn(),
  };

  return {
    createMetricsMock: vi.fn(() => metrics),
    metricsMock: metrics,
  };
});

vi.mock('../../../src/langgraph/observability/metrics/collector.js', () => ({
  createMetrics: createMetricsMock,
}));

import { withMetrics } from '../../../src/langgraph/observability/metrics/node-instrumentation.js';

describe('withMetrics default collector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses unqualified suffixes with the node namespace supplied by the collector', async () => {
    const metricNode = withMetrics((state: { count: number }) => ({ count: state.count + 1 }), {
      name: 'my-node',
    });

    await expect(metricNode({ count: 0 })).resolves.toEqual({ count: 1 });

    expect(createMetricsMock).toHaveBeenCalledWith('my-node');
    expect(metricsMock.increment).toHaveBeenCalledTimes(2);
    expect(metricsMock.increment).toHaveBeenNthCalledWith(1, 'invocations');
    expect(metricsMock.increment).toHaveBeenNthCalledWith(2, 'success');
    expect(metricsMock.startTimer).toHaveBeenCalledTimes(1);
    expect(metricsMock.startTimer).toHaveBeenCalledWith('duration');
  });

  it('uses an unqualified error suffix and rethrows the original error', async () => {
    const error = new Error('Test error');
    const metricNode = withMetrics(() => {
      throw error;
    }, { name: 'error-node' });

    await expect(metricNode({ count: 0 })).rejects.toBe(error);

    expect(metricsMock.increment).toHaveBeenCalledTimes(2);
    expect(metricsMock.increment).toHaveBeenNthCalledWith(1, 'invocations');
    expect(metricsMock.increment).toHaveBeenNthCalledWith(2, 'errors');
    expect(metricsMock.startTimer).toHaveBeenCalledTimes(1);
    expect(metricsMock.startTimer).toHaveBeenCalledWith('duration');
  });
});
