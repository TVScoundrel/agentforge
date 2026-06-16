import { describe, expect, it } from 'vitest';
import { executeBatchedTask } from './shared.js';

describe('batch-executor failure handling', () => {
  it('continues on error and reports partial success', async () => {
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

  it('throws when continueOnError is disabled', async () => {
    await expect(
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
});
