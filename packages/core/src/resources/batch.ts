/**
 * Batch processing for efficient request handling
 */

export interface BatchProcessorOptions<TInput, TOutput> {
  maxBatchSize: number;
  maxWaitTime: number;
  processor: (batch: TInput[]) => Promise<TOutput[]>;
  onBatchStart?: (batch: TInput[]) => void;
  onBatchComplete?: (batch: TInput[], results: TOutput[]) => void;
  onBatchError?: (batch: TInput[], error: Error) => void;
  onItemError?: (item: TInput, error: Error) => TOutput | undefined;
}

export interface BatchStats {
  totalBatches: number;
  totalItems: number;
  averageBatchSize: number;
  averageWaitTime: number;
  successfulBatches: number;
  failedBatches: number;
}

interface PendingItem<TInput, TOutput> {
  input: TInput;
  resolve: (output: TOutput) => void;
  reject: (error: Error) => void;
  addedAt: number;
}

export class BatchProcessor<TInput, TOutput> {
  private pending: PendingItem<TInput, TOutput>[] = [];
  private timer?: NodeJS.Timeout;
  private processing = false;
  private stats: BatchStats = {
    totalBatches: 0,
    totalItems: 0,
    averageBatchSize: 0,
    averageWaitTime: 0,
    successfulBatches: 0,
    failedBatches: 0,
  };

  constructor(private options: BatchProcessorOptions<TInput, TOutput>) {}

  add(input: TInput): Promise<TOutput> {
    return new Promise<TOutput>((resolve, reject) => {
      this.pending.push({
        input,
        resolve,
        reject,
        addedAt: Date.now(),
      });

      // Schedule batch processing
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.options.maxWaitTime);
      }

      // Process immediately if batch is full
      if (this.pending.length >= this.options.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  async flush(): Promise<void> {
    if (this.pending.length > 0) {
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.pending.length === 0) {
      return;
    }

    this.processing = true;

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    // Take items for this batch
    const batchSize = Math.min(this.pending.length, this.options.maxBatchSize);
    const batch = this.pending.splice(0, batchSize);
    const inputs = batch.map((item) => item.input);

    // Calculate wait time
    const now = Date.now();
    const waitTimes = batch.map((item) => now - item.addedAt);
    const avgWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;

    // Update stats
    this.stats.totalBatches++;
    this.stats.totalItems += batch.length;
    this.stats.averageBatchSize =
      (this.stats.averageBatchSize * (this.stats.totalBatches - 1) + batch.length) /
      this.stats.totalBatches;
    this.stats.averageWaitTime =
      (this.stats.averageWaitTime * (this.stats.totalBatches - 1) + avgWaitTime) /
      this.stats.totalBatches;

    this.options.onBatchStart?.(inputs);

    try {
      const results = await this.options.processor(inputs);

      if (results.length !== batch.length) {
        throw new Error(
          `Processor returned ${results.length} results for ${batch.length} inputs`
        );
      }

      // Resolve all items
      for (let i = 0; i < batch.length; i++) {
        batch[i].resolve(results[i]);
      }

      this.stats.successfulBatches++;
      this.options.onBatchComplete?.(inputs, results);
    } catch (error) {
      this.stats.failedBatches++;
      this.options.onBatchError?.(inputs, error as Error);

      // Handle individual item errors
      for (const item of batch) {
        if (this.options.onItemError) {
          const fallback = this.options.onItemError(item.input, error as Error);
          if (fallback !== undefined) {
            item.resolve(fallback);
          } else {
            item.reject(error as Error);
          }
        } else {
          item.reject(error as Error);
        }
      }
    } finally {
      this.processing = false;

      // Process next batch if there are pending items
      if (this.pending.length > 0) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.options.maxWaitTime);
      }
    }
  }

  getStats(): BatchStats {
    return { ...this.stats };
  }

  getPendingCount(): number {
    return this.pending.length;
  }
}

export function createBatchProcessor<TInput, TOutput>(
  options: BatchProcessorOptions<TInput, TOutput>
): BatchProcessor<TInput, TOutput> {
  return new BatchProcessor(options);
}

