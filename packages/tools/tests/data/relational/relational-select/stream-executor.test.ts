/**
 * Unit tests for relational stream executor helpers.
 */

import { describe, it, expect } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import {
  streamSelectChunks,
  executeStreamingSelect,
  benchmarkStreamingSelectMemory,
} from '../../../../src/data/relational/query/stream-executor.js';
import type { SelectQueryInput } from '../../../../src/data/relational/query/query-builder.js';

class MockConnectionManager {
  private callIndex = 0;

  constructor(private readonly responses: unknown[]) {}

  async execute(): Promise<unknown> {
    const response = this.responses[this.callIndex] ?? [];
    this.callIndex += 1;
    return response;
  }
}

const baseInput: SelectQueryInput = {
  table: 'users',
  vendor: 'postgresql',
};

describe('stream-executor', () => {
  it('should stream rows in chunks until no rows are returned', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const chunks = [];
    for await (const chunk of streamSelectChunks(manager as unknown as ConnectionManager, baseInput, { chunkSize: 2 })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.rows).toHaveLength(2);
    expect(chunks[1]?.rows).toHaveLength(2);
    expect(chunks[2]?.rows).toHaveLength(1);
  });

  it('should limit sampled rows while still counting all streamed rows', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const result = await executeStreamingSelect(
      manager as unknown as ConnectionManager,
      baseInput,
      {
        chunkSize: 2,
        sampleSize: 2,
      }
    );

    expect(result.rowCount).toBe(5);
    expect(result.chunkCount).toBe(3);
    expect(result.rows).toHaveLength(2);
    expect(result.cancelled).toBe(false);
  });

  it('should await async onChunk callbacks sequentially (backpressure)', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [],
    ]);

    const processedChunks: number[] = [];

    const result = await executeStreamingSelect(
      manager as unknown as ConnectionManager,
      baseInput,
      {
        chunkSize: 2,
        sampleSize: 4,
        onChunk: async (chunk) => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          processedChunks.push(chunk.chunkIndex);
        },
      }
    );

    expect(result.rowCount).toBe(4);
    expect(result.chunkCount).toBe(2);
    expect(processedChunks).toEqual([0, 1]);
  });

  it('should stop streaming after abort signal', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const controller = new AbortController();

    const result = await executeStreamingSelect(
      manager as unknown as ConnectionManager,
      baseInput,
      {
        chunkSize: 2,
        signal: controller.signal,
        onChunk: () => {
          controller.abort();
        },
      }
    );

    expect(result.cancelled).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.chunkCount).toBe(1);
  });

  it('should provide benchmark metadata for streaming vs non-streaming execution', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [],
    ]);

    const result = await benchmarkStreamingSelectMemory(
      manager as unknown as ConnectionManager,
      baseInput,
      { chunkSize: 2 }
    );

    expect(result.nonStreamingExecutionTime).toBeGreaterThanOrEqual(0);
    expect(result.streamingExecutionTime).toBeGreaterThanOrEqual(0);
    expect(result.nonStreamingPeakHeapUsed).toBeGreaterThan(0);
    expect(result.streamingPeakHeapUsed).toBeGreaterThan(0);
    expect(result.memorySavedBytes).toBeGreaterThanOrEqual(0);
  });
});
