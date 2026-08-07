import type { MetricEntry } from '../../../../src/langgraph/observability/metrics.js';

export interface CounterState {
  count: number;
}

export const incrementNode = (state: CounterState): CounterState => ({
  count: state.count + 1,
});

export function metricsNamed(metrics: MetricEntry[], name: string): MetricEntry[] {
  return metrics.filter((metric) => metric.name === name);
}
