import { describe, expect, it } from 'vitest';
import { extractRows } from '../../../../src/data/relational/query/row-extraction.js';

describe('relational query > row extraction', () => {
  it('returns rows for array and { rows } result shapes', () => {
    const directRows = [{ id: 1 }, { id: 2 }];
    const wrappedRows = [{ id: 3 }];

    expect(extractRows(directRows)).toEqual(directRows);
    expect(extractRows({ rows: wrappedRows })).toEqual(wrappedRows);
    expect(extractRows({ rows: 'not-an-array' })).toEqual([]);
    expect(extractRows(null)).toEqual([]);
  });
});
