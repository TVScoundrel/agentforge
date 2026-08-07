import { MetricType } from './contracts.js';
import type { MetricEntry, Metrics, Timer } from './contracts.js';

class InMemoryMetrics implements Metrics {
  private metrics: MetricEntry[] = [];
  private readonly counters = new Map<string, number>();

  constructor(private readonly namespace: string) {}

  increment(name: string, value = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const nextValue = (this.counters.get(key) ?? 0) + value;
    this.counters.set(key, nextValue);
    this.record(MetricType.COUNTER, name, nextValue, labels);
  }

  decrement(name: string, value = 1, labels?: Record<string, string>): void {
    this.increment(name, -value, labels);
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.record(MetricType.GAUGE, name, value, labels);
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.record(MetricType.HISTOGRAM, name, value, labels);
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

  private record(
    type: MetricType,
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    this.metrics.push({ type, name: `${this.namespace}.${name}`, value, timestamp: Date.now(), labels });
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    return `${name}:${labels ? JSON.stringify(labels) : ''}`;
  }
}

/** Create an in-memory metrics collector for a namespace. */
export function createMetrics(name: string): Metrics {
  return new InMemoryMetrics(name);
}
