import { describe, expect, it } from 'vitest';
import { benchmarkBatchExecution } from './shared.js';

describe('batch-executor benchmark', () => {
  it('returns benchmark metrics for individual vs batched execution', async () => {
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
