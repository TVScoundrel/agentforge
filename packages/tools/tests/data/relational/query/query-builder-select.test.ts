import { describe, expect, it } from 'vitest';
import { buildSelectQuery } from '../../../../src/data/relational/query/query-builder.js';
import type { SelectQueryInput } from '../../../../src/data/relational/query/query-builder.js';

describe('query-builder > buildSelectQuery', () => {
  it('should build a simple SELECT * query', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should build SELECT with specific columns', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        columns: ['id', 'name', 'email'],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should build SELECT with WHERE conditions', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        where: [{ column: 'age', operator: 'gte', value: 18 }],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should build SELECT with ORDER BY', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        orderBy: [{ column: 'name', direction: 'asc' }],
        vendor: 'mysql',
      }),
    ).not.toThrow();
  });

  it('should build SELECT with LIMIT and OFFSET', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        limit: 10,
        offset: 20,
        vendor: 'sqlite',
      }),
    ).not.toThrow();
  });

  it('should build SELECT with all clauses combined', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        columns: ['id', 'name'],
        where: [
          { column: 'age', operator: 'gte', value: 18 },
          { column: 'deleted_at', operator: 'isNull' },
        ],
        orderBy: [
          { column: 'name', direction: 'asc' },
          { column: 'id', direction: 'desc' },
        ],
        limit: 50,
        offset: 0,
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should throw for invalid table name', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users; DROP TABLE',
        vendor: 'postgresql',
      }),
    ).toThrow('contains invalid characters');
  });

  it('should throw for invalid column name', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        columns: ['id', 'DROP TABLE users'],
        vendor: 'postgresql',
      }),
    ).toThrow('contains invalid characters');
  });

  it('should handle schema-qualified table names', () => {
    expect(() =>
      buildSelectQuery({
        table: 'public.users',
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should handle mysql backtick quoting', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        columns: ['id', 'name'],
        vendor: 'mysql',
      }),
    ).not.toThrow();
  });

  it('should handle all WHERE operators for SELECT', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        where: [
          { column: 'id', operator: 'eq', value: 1 },
          { column: 'id', operator: 'ne', value: 2 },
          { column: 'age', operator: 'gt', value: 18 },
          { column: 'age', operator: 'lt', value: 65 },
          { column: 'score', operator: 'gte', value: 0 },
          { column: 'score', operator: 'lte', value: 100 },
          { column: 'name', operator: 'like', value: '%Alice%' },
          { column: 'role', operator: 'in', value: ['admin', 'user'] },
          { column: 'tag', operator: 'notIn', value: ['spam'] },
          { column: 'deleted_at', operator: 'isNull' },
          { column: 'email', operator: 'isNotNull' },
        ],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should throw when SELECT eq has null value', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: null }],
        vendor: 'postgresql',
      }),
    ).toThrow('null is only allowed');
  });

  it('should throw when SELECT in has empty array', () => {
    expect(() =>
      buildSelectQuery({
        table: 'users',
        where: [{ column: 'id', operator: 'in', value: [] }],
        vendor: 'postgresql',
      }),
    ).toThrow('requires a non-empty array');
  });

  it('should accept typed select inputs after facade split', () => {
    const input: SelectQueryInput = {
      table: 'users',
      columns: ['id'],
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });
});
