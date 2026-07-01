import { describe, expect, it } from 'vitest';
import { executeStreamingSelect } from '../../../../../src/data/relational/query/stream-executor.js';
import { asConnectionManager, baseInput, MockConnectionManager } from './shared.js';

describe('stream-executor execution', () => {
  it('limits sampled rows while still counting all streamed rows', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const result = await executeStreamingSelect(asConnectionManager(manager), baseInput, {
      chunkSize: 2,
      sampleSize: 2,
    });

    expect(result.rowCount).toBe(5);
    expect(result.chunkCount).toBe(3);
    expect(result.rows).toHaveLength(2);
    expect(result.rows).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.cancelled).toBe(false);
  });

  it('collects all streamed rows when collectAllRows is enabled', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const result = await executeStreamingSelect(asConnectionManager(manager), baseInput, {
      chunkSize: 2,
      collectAllRows: true,
      sampleSize: 1,
    });

    expect(result.rowCount).toBe(5);
    expect(result.chunkCount).toBe(3);
    expect(result.rows).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
  });

  it('awaits async onChunk callbacks sequentially', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [],
    ]);

    const processedChunks: number[] = [];

    const result = await executeStreamingSelect(asConnectionManager(manager), baseInput, {
      chunkSize: 2,
      sampleSize: 4,
      onChunk: async (chunk) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        processedChunks.push(chunk.chunkIndex);
      },
    });

    expect(result.rowCount).toBe(4);
    expect(result.chunkCount).toBe(2);
    expect(processedChunks).toEqual([0, 1]);
  });

  it('stops streaming after abort signal', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const controller = new AbortController();

    const result = await executeStreamingSelect(asConnectionManager(manager), baseInput, {
      chunkSize: 2,
      signal: controller.signal,
      onChunk: () => {
        controller.abort();
      },
    });

    expect(result.cancelled).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.chunkCount).toBe(1);
  });
});
