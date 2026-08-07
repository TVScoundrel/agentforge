/**
 * Stable public facade for metrics collection and node instrumentation.
 */
export { MetricType } from './metrics/contracts.js';
export type { MetricEntry, Metrics, MetricsNodeOptions, Timer } from './metrics/contracts.js';
export { createMetrics } from './metrics/collector.js';
export { withMetrics } from './metrics/node-instrumentation.js';
