import { describe, expect, it } from 'vitest';
import { streamSelectChunks } from '../../../../../src/data/relational/query/stream-executor.js';
import { asConnectionManager, baseInput, MockConnectionManager } from './shared.js';

describe('stream-executor chunking', () => {
  it('streams rows in chunks until no rows are returned', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [{ id: 5 }],
      [],
    ]);

    const chunks = [];
    for await (const chunk of streamSelectChunks(asConnectionManager(manager), baseInput, { chunkSize: 2 })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.rows).toHaveLength(2);
    expect(chunks[1]?.rows).toHaveLength(2);
    expect(chunks[2]?.rows).toHaveLength(1);
  });

  it('caps streamed rows to the smaller of query limit and maxRows', async () => {
    const manager = new MockConnectionManager([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }],
      [],
    ]);

    const chunks = [];
    for await (const chunk of streamSelectChunks(
      asConnectionManager(manager),
      { ...baseInput, limit: 5 },
      { chunkSize: 2, maxRows: 3 }
    )) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.rows.length)).toEqual([2, 1]);
    expect(chunks[0]?.offset).toBe(0);
    expect(chunks[1]?.offset).toBe(2);
  });
});
