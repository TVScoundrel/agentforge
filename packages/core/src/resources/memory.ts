/**
 * Memory management and tracking
 */

export interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface MemoryManagerOptions {
  maxMemory?: number;
  checkInterval?: number;
  thresholdPercentage?: number;
  onThreshold?: (stats: MemoryStats) => void;
  onLimit?: (stats: MemoryStats) => Promise<void>;
  onLeak?: (stats: MemoryStats) => void;
  leakDetection?: {
    enabled?: boolean;
    sampleInterval?: number;
    growthThreshold?: number;
  };
}

type CleanupHandler = () => Promise<void>;

export class MemoryManager {
  private cleanupHandlers = new Map<string, CleanupHandler>();
  private checkTimer?: NodeJS.Timeout;
  private leakDetectionTimer?: NodeJS.Timeout;
  private previousMemory?: MemoryStats;
  private running = false;

  constructor(private options: MemoryManagerOptions) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    const interval = this.options.checkInterval || 10000;

    this.checkTimer = setInterval(() => {
      this.checkMemory();
    }, interval);

    // Start leak detection if enabled
    const leakDetection = this.options.leakDetection || {};
    if (leakDetection.enabled) {
      const sampleInterval = leakDetection.sampleInterval || 60000;
      this.leakDetectionTimer = setInterval(() => {
        this.detectLeaks();
      }, sampleInterval);
    }
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }

    if (this.leakDetectionTimer) {
      clearInterval(this.leakDetectionTimer);
      this.leakDetectionTimer = undefined;
    }
  }

  registerCleanup(name: string, handler: CleanupHandler): void {
    this.cleanupHandlers.set(name, handler);
  }

  unregisterCleanup(name: string): void {
    this.cleanupHandlers.delete(name);
  }

  async cleanup(name?: string): Promise<void> {
    if (name) {
      const handler = this.cleanupHandlers.get(name);
      if (handler) {
        await handler();
      }
    } else {
      // Run all cleanup handlers
      for (const handler of this.cleanupHandlers.values()) {
        await handler();
      }
    }
  }

  getStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const total = this.options.maxMemory || memUsage.heapTotal;
    const used = memUsage.heapUsed;

    return {
      used,
      total,
      percentage: (used / total) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
    };
  }

  forceGC(): void {
    if (global.gc) {
      global.gc();
    } else {
      console.warn('Garbage collection is not exposed. Run with --expose-gc flag.');
    }
  }

  private checkMemory(): void {
    const stats = this.getStats();
    const threshold = this.options.thresholdPercentage || 80;

    if (stats.percentage >= threshold) {
      this.options.onThreshold?.(stats);
    }

    if (this.options.maxMemory && stats.used >= this.options.maxMemory) {
      this.options.onLimit?.(stats).catch((error) => {
        console.error('Error in onLimit handler:', error);
      });
    }
  }

  private detectLeaks(): void {
    const stats = this.getStats();

    if (this.previousMemory) {
      const growth = stats.used - this.previousMemory.used;
      const growthPercentage = (growth / this.previousMemory.used) * 100;
      const threshold = this.options.leakDetection?.growthThreshold || 10;

      if (growthPercentage > threshold) {
        this.options.onLeak?.(stats);
      }
    }

    this.previousMemory = stats;
  }
}

export function createMemoryManager(options: MemoryManagerOptions): MemoryManager {
  return new MemoryManager(options);
}

