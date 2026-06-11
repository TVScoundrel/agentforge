import type { ExecutionMetrics, Priority } from './executor-types.js';

export function createExecutionMetrics(): ExecutionMetrics {
  return {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalDuration: 0,
    averageDuration: 0,
    byPriority: { low: 0, normal: 0, high: 0, critical: 0 },
  };
}

export function recordExecutionResult(
  metrics: ExecutionMetrics,
  priority: Priority,
  duration: number,
  successful: boolean
): void {
  metrics.totalExecutions++;
  if (successful) {
    metrics.successfulExecutions++;
  } else {
    metrics.failedExecutions++;
  }

  metrics.totalDuration += duration;
  metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
  metrics.byPriority[priority]++;
}

export function resetExecutionMetrics(metrics: ExecutionMetrics): void {
  metrics.totalExecutions = 0;
  metrics.successfulExecutions = 0;
  metrics.failedExecutions = 0;
  metrics.totalDuration = 0;
  metrics.averageDuration = 0;
  metrics.byPriority = { low: 0, normal: 0, high: 0, critical: 0 };
}

export function snapshotExecutionMetrics(metrics: ExecutionMetrics): ExecutionMetrics {
  return {
    ...metrics,
    byPriority: { ...metrics.byPriority },
  };
}
