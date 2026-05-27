import { describe, expect, it } from 'vitest';
import { buildInsertQuery } from '../../../../src/data/relational/query/query-builder.js';
import type { InsertQueryInput } from '../../../../src/data/relational/query/query-builder.js';

describe('query-builder > buildInsertQuery', () => {
  it('should build a single-row INSERT for postgresql', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice', age: 30 },
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.rows).toHaveLength(1);
    expect(result.returningMode).toBe('none');
    expect(result.idColumn).toBe('id');
    expect(result.supportsReturning).toBe(true);
  });

  it('should build a batch INSERT with multiple rows', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.rows).toHaveLength(2);
  });

  it('should include RETURNING id when mode is "id"', () => {
    const result = buildInsertQuery({
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'id' },
      vendor: 'postgresql',
    });
    expect(result.returningMode).toBe('id');
    expect(result.idColumn).toBe('id');
  });

  it('should include RETURNING * when mode is "row"', () => {
    const result = buildInsertQuery({
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'row' },
      vendor: 'postgresql',
    });
    expect(result.returningMode).toBe('row');
  });

  it('should allow custom idColumn when returning mode is "id"', () => {
    const result = buildInsertQuery({
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'id', idColumn: 'user_id' },
      vendor: 'sqlite',
    });
    expect(result.idColumn).toBe('user_id');
  });

  it('should throw when idColumn provided but mode is not "id"', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: { name: 'Alice' },
        returning: { mode: 'none', idColumn: 'user_id' },
        vendor: 'postgresql',
      }),
    ).toThrow('idColumn can only be provided');
  });

  it('should throw when returning mode "row" used with mysql', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: { name: 'Alice' },
        returning: { mode: 'row' },
        vendor: 'mysql',
      }),
    ).toThrow('not supported for mysql');
  });

  it('should report supportsReturning false for mysql', () => {
    const result = buildInsertQuery({
      table: 'users',
      data: { name: 'Alice' },
      vendor: 'mysql',
    });
    expect(result.supportsReturning).toBe(false);
  });

  it('should throw for empty data array', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: [],
        vendor: 'postgresql',
      }),
    ).toThrow('must not be an empty array');
  });

  it('should throw for invalid table name', () => {
    expect(() =>
      buildInsertQuery({
        table: 'DROP TABLE users; --',
        data: { name: 'Alice' },
        vendor: 'postgresql',
      }),
    ).toThrow('contains invalid characters');
  });

  it('should throw for invalid column name in data', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: { 'name; DROP TABLE users': 'Alice' },
        vendor: 'postgresql',
      }),
    ).toThrow('contains invalid characters');
  });

  it('should throw when insert data row is not an object', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: ['not an object'] as unknown as InsertQueryInput['data'],
        vendor: 'postgresql',
      }),
    ).toThrow('must be an object');
  });

  it('should throw when a value is undefined', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: { name: undefined as unknown as string },
        vendor: 'postgresql',
      }),
    ).toThrow('must not be undefined');
  });

  it('should handle schema-qualified table names', () => {
    const result = buildInsertQuery({
      table: 'public.users',
      data: { name: 'Alice' },
      vendor: 'postgresql',
    });
    expect(result.rows).toHaveLength(1);
  });

  it('should build DEFAULT VALUES for an empty-column row', () => {
    const result = buildInsertQuery({
      table: 'counters',
      data: {},
      vendor: 'postgresql',
    });
    expect(result.rows).toHaveLength(1);
  });

  it('should throw for batch DEFAULT VALUES (more than 1 row)', () => {
    expect(() =>
      buildInsertQuery({
        table: 'counters',
        data: [{}, {}],
        vendor: 'postgresql',
      }),
    ).toThrow('Batch INSERT with only DEFAULT VALUES is not supported');
  });

  it('should handle null values in data', () => {
    const result = buildInsertQuery({
      table: 'users',
      data: { name: 'Alice', bio: null },
      vendor: 'postgresql',
    });
    expect(result.rows[0].bio).toBeNull();
  });

  it('should handle boolean values in data', () => {
    const result = buildInsertQuery({
      table: 'users',
      data: { name: 'Alice', active: true },
      vendor: 'sqlite',
    });
    expect(result.rows[0].active).toBe(true);
  });
});
