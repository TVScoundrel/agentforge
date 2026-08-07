/** Metric types supported by the in-memory collector. */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

/** A recorded metric sample. */
export interface MetricEntry {
  type: MetricType;
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

/** A running duration measurement. */
export interface Timer {
  end(): number;
}

/** Public metrics collector contract. */
export interface Metrics {
  increment(name: string, value?: number, labels?: Record<string, string>): void;
  decrement(name: string, value?: number, labels?: Record<string, string>): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  histogram(name: string, value: number, labels?: Record<string, string>): void;
  startTimer(name: string, labels?: Record<string, string>): Timer;
  getMetrics(): MetricEntry[];
  clear(): void;
}

/** Options controlling automatic node instrumentation. */
export interface MetricsNodeOptions {
  name: string;
  trackDuration?: boolean;
  trackErrors?: boolean;
  trackInvocations?: boolean;
  metrics?: Metrics;
}
