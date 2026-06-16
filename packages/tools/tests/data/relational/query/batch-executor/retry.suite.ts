import { describe, expect, it } from 'vitest';
import { executeBatchedTask } from './shared.js';

describe('batch-executor retry', () => {
  it('retries failed batches and eventually succeeds', async () => {
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
});
