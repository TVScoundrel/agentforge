/**
 * Performance profiling for execution monitoring
 */

export interface ProfilerOptions {
  enabled?: boolean;
  sampleRate?: number;
  includeMemory?: boolean;
  includeStack?: boolean;
  maxSamples?: number;
}

export interface ProfileSample {
  timestamp: number;
  duration: number;
  memory?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  stack?: string;
}

export interface ProfileStats {
  calls: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  memory?: {
    avgHeapUsed: number;
    maxHeapUsed: number;
    minHeapUsed: number;
  };
  samples: ProfileSample[];
}

export interface ProfileReport {
  [key: string]: ProfileStats;
}

export class Profiler {
  private profiles = new Map<string, ProfileSample[]>();
  private enabled: boolean;
  private sampleRate: number;
  private includeMemory: boolean;
  private includeStack: boolean;
  private maxSamples: number;

  constructor(options: ProfilerOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.sampleRate = options.sampleRate ?? 1.0;
    this.includeMemory = options.includeMemory ?? false;
    this.includeStack = options.includeStack ?? false;
    this.maxSamples = options.maxSamples ?? 1000;
  }

  profile<TArgs extends any[], TReturn>(
    name: string,
    fn: (...args: TArgs) => Promise<TReturn>
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs) => {
      if (!this.enabled || Math.random() > this.sampleRate) {
        return fn(...args);
      }

      const startTime = Date.now();
      const startMemory = this.includeMemory ? process.memoryUsage() : undefined;
      const stack = this.includeStack ? new Error().stack : undefined;

      try {
        const result = await fn(...args);
        this.recordSample(name, startTime, startMemory, stack);
        return result;
      } catch (error) {
        this.recordSample(name, startTime, startMemory, stack);
        throw error;
      }
    };
  }

  wrap<T>(name: string, promise: Promise<T>): Promise<T> {
    if (!this.enabled || Math.random() > this.sampleRate) {
      return promise;
    }

    const startTime = Date.now();
    const startMemory = this.includeMemory ? process.memoryUsage() : undefined;
    const stack = this.includeStack ? new Error().stack : undefined;

    return promise.finally(() => {
      this.recordSample(name, startTime, startMemory, stack);
    });
  }

  private recordSample(
    name: string,
    startTime: number,
    startMemory?: NodeJS.MemoryUsage,
    stack?: string
  ): void {
    const duration = Date.now() - startTime;
    const sample: ProfileSample = {
      timestamp: startTime,
      duration,
    };

    if (this.includeMemory && startMemory) {
      const currentMemory = process.memoryUsage();
      sample.memory = {
        heapUsed: currentMemory.heapUsed - startMemory.heapUsed,
        heapTotal: currentMemory.heapTotal,
        external: currentMemory.external,
      };
    }

    if (this.includeStack && stack) {
      sample.stack = stack;
    }

    if (!this.profiles.has(name)) {
      this.profiles.set(name, []);
    }

    const samples = this.profiles.get(name)!;
    samples.push(sample);

    // Limit samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getReport(): ProfileReport {
    const report: ProfileReport = {};

    for (const [name, samples] of this.profiles.entries()) {
      if (samples.length === 0) {
        continue;
      }

      const durations = samples.map((s) => s.duration).sort((a, b) => a - b);
      const totalTime = durations.reduce((sum, d) => sum + d, 0);

      const stats: ProfileStats = {
        calls: samples.length,
        totalTime,
        avgTime: totalTime / samples.length,
        minTime: durations[0],
        maxTime: durations[durations.length - 1],
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
        samples,
      };

      if (this.includeMemory) {
        const memorySamples = samples.filter((s) => s.memory).map((s) => s.memory!.heapUsed);
        if (memorySamples.length > 0) {
          stats.memory = {
            avgHeapUsed: memorySamples.reduce((sum, m) => sum + m, 0) / memorySamples.length,
            maxHeapUsed: Math.max(...memorySamples),
            minHeapUsed: Math.min(...memorySamples),
          };
        }
      }

      report[name] = stats;
    }

    return report;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  reset(name?: string): void {
    if (name) {
      this.profiles.delete(name);
    } else {
      this.profiles.clear();
    }
  }

  export(path: string): void {
    const report = this.getReport();
    // In a real implementation, write to file
    console.log('Exporting profile report to:', path);
    console.log(JSON.stringify(report, null, 2));
  }
}

export function createProfiler(options?: ProfilerOptions): Profiler {
  return new Profiler(options);
}

