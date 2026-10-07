import { describe, expect, it } from 'vitest';
import {
  normalizeExecutionResult,
  resolveBatchOptions,
  type MutationBatchOptions,
} from '../../../../src/data/relational/tools/mutation-execution.js';

describe('Relational Mutation batch options', () => {
  it.each([
    { name: 'missing options', input: undefined },
    { name: 'explicit disabling', input: { enabled: false, batchSize: 5 } },
  ])('disables batch mode for $name', ({ input }) => {
    expect(resolveBatchOptions(input)).toBeUndefined();
  });

  it.each([{}, { enabled: true }])('resolves established defaults for %j', (input) => {
    expect(resolveBatchOptions(input)).toEqual({
      enabled: true,
      batchSize: 100,
      continueOnError: true,
      maxRetries: 0,
      retryDelayMs: 0,
      benchmark: false,
    });
  });

  it('preserves explicitly supplied controls, including false and zero', () => {
    expect(
      resolveBatchOptions({
        enabled: true,
        batchSize: 7,
        continueOnError: false,
        maxRetries: 0,
        retryDelayMs: 0,
        benchmark: true,
      })
    ).toEqual({
      enabled: true,
      batchSize: 7,
      continueOnError: false,
      maxRetries: 0,
      retryDelayMs: 0,
      benchmark: true,
    });
  });

  it.each<MutationBatchOptions>([
    {
      enabled: true,
      batchSize: 0,
      continueOnError: false,
      maxRetries: 0,
      retryDelayMs: 0,
      benchmark: false,
    },
    {
      enabled: true,
      batchSize: 7,
      continueOnError: false,
      maxRetries: 3,
      retryDelayMs: 250,
      benchmark: true,
    },
  ])('preserves every supplied control for %j', (input) => {
    expect(resolveBatchOptions(input)).toEqual(input);
  });

  it('preserves non-default retry controls', () => {
    expect(resolveBatchOptions({ maxRetries: 3, retryDelayMs: 250 })).toEqual({
      enabled: true,
      batchSize: 100,
      continueOnError: true,
      maxRetries: 3,
      retryDelayMs: 250,
      benchmark: false,
    });
  });
});

describe('Relational Mutation driver results', () => {
  it.each([
    {
      name: 'returned rows',
      input: [{ id: 7 }, { id: 8 }],
      expected: { rows: [{ id: 7 }, { id: 8 }], rowCount: 2 },
    },
    { name: 'empty array', input: [], expected: { rows: [], rowCount: 0 } },
    {
      name: 'array count precedence',
      input: [{ affectedRows: 2, rowCount: 3, changes: 4 }],
      expected: { rows: [], rowCount: 2 },
    },
    {
      name: 'array rowCount fallback',
      input: [{ rowCount: 3, changes: 4 }],
      expected: { rows: [], rowCount: 3 },
    },
    {
      name: 'array changes fallback',
      input: [{ changes: 4 }],
      expected: { rows: [], rowCount: 4 },
    },
    {
      name: 'array zero count',
      input: [{ affectedRows: 0, rowCount: 3 }],
      expected: { rows: [], rowCount: 0 },
    },
    {
      name: 'array identifier metadata',
      input: [{ affectedRows: 2, insertId: 0, lastInsertRowid: 8 }, []],
      expected: { rows: [], rowCount: 2, insertId: 0, lastInsertRowid: 8 },
    },
    {
      name: 'identifier-only array',
      input: [{ insertId: 7 }],
      expected: { rows: [], rowCount: 0, insertId: 7 },
    },
    {
      name: 'last-rowid-only array',
      input: [{ lastInsertRowid: 7 }],
      expected: { rows: [], rowCount: 0, lastInsertRowid: 7 },
    },
    {
      name: 'zero identifier-only array',
      input: [{ insertId: 0, lastInsertRowid: 0 }],
      expected: { rows: [], rowCount: 0, insertId: 0, lastInsertRowid: 0 },
    },
    {
      name: 'object count precedence',
      input: { rows: [{ id: 7 }], rowCount: 2, affectedRows: 3, changes: 4 },
      expected: { rows: [{ id: 7 }], rowCount: 2 },
    },
    {
      name: 'object affectedRows fallback',
      input: { affectedRows: 3, changes: 4 },
      expected: { rows: [], rowCount: 3 },
    },
    { name: 'object changes fallback', input: { changes: 4 }, expected: { rows: [], rowCount: 4 } },
    {
      name: 'object row length fallback',
      input: { rows: [{ id: 7 }] },
      expected: { rows: [{ id: 7 }], rowCount: 1 },
    },
    {
      name: 'object zero count',
      input: { rowCount: 0, affectedRows: 3, rows: [{ id: 7 }] },
      expected: { rows: [{ id: 7 }], rowCount: 0 },
    },
    {
      name: 'object identifier metadata',
      input: { changes: 2, insertId: 7, lastInsertRowid: 0 },
      expected: { rows: [], rowCount: 2, insertId: 7, lastInsertRowid: 0 },
    },
    { name: 'non-array rows', input: { rows: { id: 7 } }, expected: { rows: [], rowCount: 0 } },
    {
      name: 'invalid count fallback',
      input: { rowCount: NaN, affectedRows: Infinity, changes: 4 },
      expected: { rows: [], rowCount: 4 },
    },
  ])('normalizes $name', ({ input, expected }) => {
    expect(normalizeExecutionResult(input)).toEqual(expected);
  });

  it.each([undefined, null, false, true, 5, 'result', Symbol('result'), 7n])(
    'returns an empty result for unsupported value %s',
    (input) => {
      expect(normalizeExecutionResult(input)).toEqual({ rows: [], rowCount: 0 });
    }
  );

  it.each(['7', NaN, Infinity, -Infinity, 7n, null, undefined])(
    'rejects non-numeric or non-finite metadata %s',
    (value) => {
      const metadata = {
        rowCount: value,
        affectedRows: value,
        changes: value,
        insertId: value,
        lastInsertRowid: value,
      };
      expect(normalizeExecutionResult(metadata)).toEqual({ rows: [], rowCount: 0 });
      expect(normalizeExecutionResult([metadata])).toEqual({ rows: [metadata], rowCount: 1 });
    }
  );
});
