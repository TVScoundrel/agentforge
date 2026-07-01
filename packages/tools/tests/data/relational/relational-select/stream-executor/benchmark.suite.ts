import { describe, expect, it } from 'vitest';
import { benchmarkStreamingSelectMemory } from '../../../../../src/data/relational/query/stream-executor.js';
import { asConnectionManager, baseInput, MockConnectionManager } from './shared.js';

describe('stream-executor benchmark', () => {
  it('provides benchmark metadata for streaming vs non-streaming execution', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [],
    ]);

    const result = await benchmarkStreamingSelectMemory(asConnectionManager(manager), baseInput, {
      chunkSize: 2,
    });

    expect(result.nonStreamingExecutionTime).toBeGreaterThanOrEqual(0);
    expect(result.streamingExecutionTime).toBeGreaterThanOrEqual(0);
    expect(result.nonStreamingPeakHeapUsed).toBeGreaterThan(0);
    expect(result.streamingPeakHeapUsed).toBeGreaterThan(0);
    expect(result.memorySavedBytes).toBeGreaterThanOrEqual(0);
  });
});
