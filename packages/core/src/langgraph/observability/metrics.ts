/**
 * Metrics Collection Utilities
 *
 * Provides utilities for collecting performance and usage metrics.
 */

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

/**
 * Metric entry
 */
export interface MetricEntry {
  type: MetricType;
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

/**
 * Timer interface for measuring durations
 */
export interface Timer {
  /**
   * End the timer and record the duration
   */
  end(): number;
}

/**
 * Metrics collector interface
 */
export interface Metrics {
  /**
   * Increment a counter metric
   */
  increment(name: string, value?: number, labels?: Record<string, string>): void;

  /**
   * Decrement a counter metric
   */
  decrement(name: string, value?: number, labels?: Record<string, string>): void;

  /**
   * Set a gauge metric
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Start a timer for measuring duration
   */
  startTimer(name: string, labels?: Record<string, string>): Timer;

  /**
   * Get all recorded metrics
   */
  getMetrics(): MetricEntry[];

  /**
   * Clear all metrics
   */
  clear(): void;
}

/**
 * Metrics collector implementation
 */
class MetricsImpl implements Metrics {
  private name: string;
  private metrics: MetricEntry[] = [];
  private counters: Map<string, number> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + value);

    this.record({
      type: MetricType.COUNTER,
      name: this.prefixName(name),
      value: current + value,
      timestamp: Date.now(),
      labels,
    });
  }

  decrement(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.increment(name, -value, labels);
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.record({
      type: MetricType.GAUGE,
      name: this.prefixName(name),
      value,
      timestamp: Date.now(),
      labels,
    });
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.record({
      type: MetricType.HISTOGRAM,
      name: this.prefixName(name),
      value,
      timestamp: Date.now(),
      labels,
    });
  }

  startTimer(name: string, labels?: Record<string, string>): Timer {
    const startTime = Date.now();

    return {
      end: (): number => {
        const duration = Date.now() - startTime;
        this.histogram(name, duration, labels);
        return duration;
      },
    };
  }

  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
    this.counters.clear();
  }

  private record(entry: MetricEntry): void {
    this.metrics.push(entry);
  }

  private prefixName(name: string): string {
    return `${this.name}.${name}`;
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    const labelStr = labels ? JSON.stringify(labels) : '';
    return `${name}:${labelStr}`;
  }
}

/**
 * Create a metrics collector.
 *
 * @example
 * ```typescript
 * import { createMetrics } from '@agentforge/core';
 *
 * const metrics = createMetrics('my-agent');
 *
 * // Track counters
 * metrics.increment('requests.total');
 * metrics.increment('requests.success');
 *
 * // Track gauges
 * metrics.gauge('active.connections', 5);
 *
 * // Track histograms
 * metrics.histogram('request.duration', 150);
 *
 * // Track timers
 * const timer = metrics.startTimer('operation.duration');
 * // ... do work ...
 * timer.end();
 * ```
 *
 * @param name - Metrics namespace (typically the agent or component name)
 * @returns A metrics collector instance
 */
export function createMetrics(name: string): Metrics {
  return new MetricsImpl(name);
}

/**
 * Options for metrics tracking on nodes
 */
export interface MetricsNodeOptions {
  /**
   * Name for the metrics
   */
  name: string;

  /**
   * Whether to track execution duration
   * @default true
   */
  trackDuration?: boolean;

  /**
   * Whether to track errors
   * @default true
   */
  trackErrors?: boolean;

  /**
   * Whether to track invocation count
   * @default true
   */
  trackInvocations?: boolean;

  /**
   * Metrics collector to use
   * If not provided, a new one will be created
   */
  metrics?: Metrics;
}

/**
 * Wrap a node function with automatic metrics tracking.
 *
 * @example
 * ```typescript
 * import { withMetrics, createMetrics } from '@agentforge/core';
 *
 * const metrics = createMetrics('my-agent');
 *
 * const metricNode = withMetrics(myNode, {
 *   name: 'research-node',
 *   metrics,
 * });
 * ```
 *
 * @param node - The node function to wrap
 * @param options - Metrics tracking options
 * @returns A wrapped node function with metrics tracking
 */
export function withMetrics<State>(
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
  options: MetricsNodeOptions
): (state: State) => Promise<State | Partial<State>> {
  const {
    name,
    trackDuration = true,
    trackErrors = true,
    trackInvocations = true,
    metrics = createMetrics(name),
  } = options;

  return async (state: State): Promise<State | Partial<State>> => {
    if (trackInvocations) {
      metrics.increment(`${name}.invocations`);
    }

    const timer = trackDuration ? metrics.startTimer(`${name}.duration`) : null;

    try {
      const result = await Promise.resolve(node(state));

      // Always track success (separate from invocations)
      metrics.increment(`${name}.success`);

      return result;
    } catch (error) {
      if (trackErrors) {
        metrics.increment(`${name}.errors`);
      }

      throw error;
    } finally {
      if (timer) {
        timer.end();
      }
    }
  };
}

