/**
 * Unit tests for generic relational batch executor helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  benchmarkBatchExecution,
  executeBatchedTask,
} from '../../../src/data/relational/query/batch-executor.js';

describe('batch-executor', () => {
  it('should process items in chunks and report progress', async () => {
    const progressUpdates: number[] = [];

    const result = await executeBatchedTask<number, { values: number[] }>(
      {
        operation: 'test-op',
        items: [1, 2, 3, 4, 5],
        executeBatch: async (batchItems) => ({ values: batchItems }),
      },
      {
        batchSize: 2,
        onProgress: (progress) => {
          progressUpdates.push(progress.processedItems);
        },
      }
    );

    expect(result.totalBatches).toBe(3);
    expect(result.processedItems).toBe(5);
    expect(result.successfulItems).toBe(5);
    expect(result.failedItems).toBe(0);
    expect(progressUpdates).toEqual([2, 4, 5]);
  });

  it('should retry failed batches and eventually succeed', async () => {
    let attempts = 0;

    const result = await executeBatchedTask<number, { values: number[] }>(
      {
        operation: 'retry-op',
        items: [1, 2],
        executeBatch: async (batchItems) => {
          attempts += 1;
          if (attempts === 1) {
            throw new Error('transient error');
          }
          return { values: batchItems };
        },
      },
      {
        batchSize: 2,
        maxRetries: 1,
      }
    );

    expect(result.retries).toBe(1);
    expect(result.failedItems).toBe(0);
    expect(result.successfulItems).toBe(2);
    expect(result.failures).toHaveLength(0);
  });

  it('should continue on error and report partial success', async () => {
    const result = await executeBatchedTask<number, { values: number[] }>(
      {
        operation: 'partial-op',
        items: [1, 2, 3],
        executeBatch: async (batchItems) => {
          if (batchItems.includes(2)) {
            throw new Error('forced failure');
          }
          return { values: batchItems };
        },
      },
      {
        batchSize: 1,
        continueOnError: true,
      }
    );

    expect(result.successfulItems).toBe(2);
    expect(result.failedItems).toBe(1);
    expect(result.partialSuccess).toBe(true);
    expect(result.failures).toHaveLength(1);
  });

  it('should throw when continueOnError is disabled', async () => {
    await expect(() =>
      executeBatchedTask<number, { values: number[] }>(
        {
          operation: 'strict-op',
          items: [1, 2],
          executeBatch: async () => {
            throw new Error('forced failure');
          },
        },
        {
          batchSize: 1,
          continueOnError: false,
        }
      )
    ).rejects.toThrow(/failed/i);
  });

  it('should return benchmark metrics for individual vs batched execution', async () => {
    const result = await benchmarkBatchExecution({
      items: [1, 2, 3, 4],
      batchSize: 2,
      runIndividual: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      },
      runBatch: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      },
    });

    expect(result.itemCount).toBe(4);
    expect(result.batchCount).toBe(2);
    expect(result.batchSize).toBe(2);
    expect(result.individualExecutionTime).toBeGreaterThan(0);
    expect(result.batchedExecutionTime).toBeGreaterThan(0);
    expect(result.speedupRatio).toBeGreaterThan(0);
  });
});
