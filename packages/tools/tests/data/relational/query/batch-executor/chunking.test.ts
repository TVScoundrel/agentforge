import { describe, expect, it } from 'vitest';
import { executeBatchedTask } from './shared.js';

describe('batch-executor chunking', () => {
  it('processes items in chunks and reports progress', async () => {
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
});
