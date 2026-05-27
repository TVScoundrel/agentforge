import { describe, expect, it } from 'vitest';
import { buildDeleteQuery } from '../../../../src/data/relational/query/query-builder.js';

describe('query-builder > buildDeleteQuery', () => {
  it('should build a DELETE with WHERE conditions', () => {
    const result = buildDeleteQuery({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    });
    expect(result.whereApplied).toBe(true);
    expect(result.usesSoftDelete).toBe(false);
    expect(result.softDeleteColumn).toBeUndefined();
  });

  it('should throw without WHERE when allowFullTableDelete is false', () => {
    expect(() =>
      buildDeleteQuery({
        table: 'users',
        vendor: 'postgresql',
      }),
    ).toThrow('WHERE conditions are required');
  });

  it('should allow full-table DELETE when allowFullTableDelete is true', () => {
    const result = buildDeleteQuery({
      table: 'temp_data',
      allowFullTableDelete: true,
      vendor: 'sqlite',
    });
    expect(result.whereApplied).toBe(false);
  });

  it('should build soft-delete UPDATE with default column', () => {
    const result = buildDeleteQuery({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: {},
      vendor: 'postgresql',
    });
    expect(result.usesSoftDelete).toBe(true);
    expect(result.softDeleteColumn).toBe('deleted_at');
  });

  it('should build soft-delete with custom column', () => {
    const result = buildDeleteQuery({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: { column: 'removed_at' },
      vendor: 'mysql',
    });
    expect(result.usesSoftDelete).toBe(true);
    expect(result.softDeleteColumn).toBe('removed_at');
  });

  it('should throw for invalid table name', () => {
    expect(() =>
      buildDeleteQuery({
        table: ' ',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
      }),
    ).toThrow('must not be empty');
  });

  it('should handle schema-qualified table names', () => {
    const result = buildDeleteQuery({
      table: 'public.users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    });
    expect(result.whereApplied).toBe(true);
  });
});
