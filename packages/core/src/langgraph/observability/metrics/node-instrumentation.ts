import { createMetrics } from './collector.js';
import type { MetricsNodeOptions } from './contracts.js';

/** Wrap a node function with automatic metrics tracking. */
export function withMetrics<State>(
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
  options: MetricsNodeOptions
): (state: State) => Promise<State | Partial<State>> {
  const {
    name,
    trackDuration = true,
    trackErrors = true,
    trackInvocations = true,
    metrics: providedMetrics,
  } = options;
  const metrics = providedMetrics ?? createMetrics(name);
  const metricSuffix = (suffix: string): string =>
    providedMetrics ? `${name}.${suffix}` : suffix;

  return async (state: State): Promise<State | Partial<State>> => {
    if (trackInvocations) metrics.increment(metricSuffix('invocations'));
    const timer = trackDuration ? metrics.startTimer(metricSuffix('duration')) : null;

    try {
      const result = await Promise.resolve(node(state));
      metrics.increment(metricSuffix('success'));
      return result;
    } catch (error) {
      if (trackErrors) metrics.increment(metricSuffix('errors'));
      throw error;
    } finally {
      timer?.end();
    }
  };
}
