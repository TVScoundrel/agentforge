/**
 * Unit tests for the shared query-builder module.
 *
 * Covers buildInsertQuery, buildUpdateQuery, buildDeleteQuery, and buildSelectQuery
 * across all three vendors (postgresql, mysql, sqlite).
 */

import { describe, expect, it } from 'vitest';
import {
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildSelectQuery,
} from '../../../../src/data/relational/query/query-builder.js';
import type {
  InsertQueryInput,
  UpdateQueryInput,
  DeleteQueryInput,
  SelectQueryInput,
} from '../../../../src/data/relational/query/query-builder.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the raw SQL string from a Drizzle SQL object for assertion. */
function toRawSql(sqlObj: { queryChunks: unknown[] }): string {
  // Drizzle's SQL objects expose queryChunks; we walk through to build a rough SQL string
  // For simple assertions we use the `sql.toString()` or serialisation approach
  return String(sqlObj);
}

// ---------------------------------------------------------------------------
// buildInsertQuery
// ---------------------------------------------------------------------------

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
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'id' },
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.returningMode).toBe('id');
    expect(result.idColumn).toBe('id');
  });

  it('should include RETURNING * when mode is "row"', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'row' },
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.returningMode).toBe('row');
  });

  it('should allow custom idColumn when returning mode is "id"', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'id', idColumn: 'user_id' },
      vendor: 'sqlite',
    };
    const result = buildInsertQuery(input);
    expect(result.idColumn).toBe('user_id');
  });

  it('should throw when idColumn provided but mode is not "id"', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'none', idColumn: 'user_id' },
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('idColumn can only be provided');
  });

  it('should throw when returning mode "row" used with mysql', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'row' },
      vendor: 'mysql',
    };
    expect(() => buildInsertQuery(input)).toThrow('not supported for mysql');
  });

  it('should report supportsReturning false for mysql', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice' },
      vendor: 'mysql',
    };
    const result = buildInsertQuery(input);
    expect(result.supportsReturning).toBe(false);
  });

  it('should throw for empty data array', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: [],
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('must not be an empty array');
  });

  it('should throw for invalid table name', () => {
    const input: InsertQueryInput = {
      table: 'DROP TABLE users; --',
      data: { name: 'Alice' },
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('contains invalid characters');
  });

  it('should throw for invalid column name in data', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { 'name; DROP TABLE users': 'Alice' },
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('contains invalid characters');
  });

  it('should throw when insert data row is not an object', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: ['not an object'] as unknown as InsertQueryInput['data'],
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('must be an object');
  });

  it('should throw when a value is undefined', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: undefined as unknown as string },
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('must not be undefined');
  });

  it('should handle schema-qualified table names', () => {
    const input: InsertQueryInput = {
      table: 'public.users',
      data: { name: 'Alice' },
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.rows).toHaveLength(1);
  });

  it('should build DEFAULT VALUES for an empty-column row', () => {
    const input: InsertQueryInput = {
      table: 'counters',
      data: {},
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.rows).toHaveLength(1);
  });

  it('should throw for batch DEFAULT VALUES (more than 1 row)', () => {
    const input: InsertQueryInput = {
      table: 'counters',
      data: [{}, {}],
      vendor: 'postgresql',
    };
    expect(() => buildInsertQuery(input)).toThrow('Batch INSERT with only DEFAULT VALUES is not supported');
  });

  it('should handle null values in data', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice', bio: null },
      vendor: 'postgresql',
    };
    const result = buildInsertQuery(input);
    expect(result.rows[0].bio).toBeNull();
  });

  it('should handle boolean values in data', () => {
    const input: InsertQueryInput = {
      table: 'users',
      data: { name: 'Alice', active: true },
      vendor: 'sqlite',
    };
    const result = buildInsertQuery(input);
    expect(result.rows[0].active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildUpdateQuery
// ---------------------------------------------------------------------------

describe('query-builder > buildUpdateQuery', () => {
  it('should build an UPDATE with WHERE conditions', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    const result = buildUpdateQuery(input);
    expect(result.whereApplied).toBe(true);
    expect(result.usesOptimisticLock).toBe(false);
  });

  it('should throw without WHERE when allowFullTableUpdate is false', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'inactive' },
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('WHERE conditions are required');
  });

  it('should allow full-table UPDATE when allowFullTableUpdate is true', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'inactive' },
      allowFullTableUpdate: true,
      vendor: 'mysql',
    };
    const result = buildUpdateQuery(input);
    expect(result.whereApplied).toBe(false);
  });

  it('should include optimistic lock condition', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      optimisticLock: { column: 'version', expectedValue: 5 },
      vendor: 'postgresql',
    };
    const result = buildUpdateQuery(input);
    expect(result.usesOptimisticLock).toBe(true);
    expect(result.whereApplied).toBe(true);
  });

  it('should throw for empty update data', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: {},
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('must not be empty');
  });

  it('should throw for invalid table name', () => {
    const input: UpdateQueryInput = {
      table: '1invalid',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('contains invalid characters');
  });

  it('should throw when update data is not an object', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: 'not an object' as unknown as UpdateQueryInput['data'],
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('must be an object');
  });

  it('should throw when optimistic lock expectedValue is null', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      optimisticLock: { column: 'version', expectedValue: null as unknown as number },
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('Optimistic lock expectedValue must not be empty');
  });

  it('should throw when update column value is undefined', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: undefined as unknown as string },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('must not be undefined');
  });

  // WHERE operator tests
  it('should handle ne operator', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'id', operator: 'ne', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).not.toThrow();
  });

  it('should handle gt, lt, gte, lte operators', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'active' },
      where: [
        { column: 'age', operator: 'gt', value: 18 },
        { column: 'age', operator: 'lt', value: 65 },
        { column: 'score', operator: 'gte', value: 10 },
        { column: 'score', operator: 'lte', value: 100 },
      ],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).not.toThrow();
  });

  it('should handle like operator', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'name', operator: 'like', value: '%Alice%' }],
      vendor: 'mysql',
    };
    expect(() => buildUpdateQuery(input)).not.toThrow();
  });

  it('should handle in and notIn operators', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'active' },
      where: [
        { column: 'id', operator: 'in', value: [1, 2, 3] },
        { column: 'role', operator: 'notIn', value: ['admin', 'super'] },
      ],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).not.toThrow();
  });

  it('should handle isNull and isNotNull operators', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { status: 'active' },
      where: [
        { column: 'deleted_at', operator: 'isNull' },
        { column: 'email', operator: 'isNotNull' },
      ],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).not.toThrow();
  });

  it('should throw when eq operator has null value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: null }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('null is only allowed with isNull/isNotNull');
  });

  it('should throw when ne operator has null value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'ne', value: null }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('null is only allowed with isNull/isNotNull');
  });

  it('should throw when gt operator has non-scalar value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'age', operator: 'gt', value: null }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('requires a string or number value');
  });

  it('should throw when like operator has non-string value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'name', operator: 'like', value: 123 as unknown as string }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('requires a string value');
  });

  it('should throw when in operator has empty array', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'in', value: [] }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('requires a non-empty array');
  });

  it('should throw when isNull has a value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'isNull', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('must not include value');
  });

  it('should throw when isNotNull has a value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'isNotNull', value: 'x' }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('must not include value');
  });

  it('should throw when eq operator has undefined value', () => {
    const input: UpdateQueryInput = {
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: undefined }],
      vendor: 'postgresql',
    };
    expect(() => buildUpdateQuery(input)).toThrow('requires a value');
  });
});

// ---------------------------------------------------------------------------
// buildDeleteQuery
// ---------------------------------------------------------------------------

describe('query-builder > buildDeleteQuery', () => {
  it('should build a DELETE with WHERE conditions', () => {
    const input: DeleteQueryInput = {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    const result = buildDeleteQuery(input);
    expect(result.whereApplied).toBe(true);
    expect(result.usesSoftDelete).toBe(false);
    expect(result.softDeleteColumn).toBeUndefined();
  });

  it('should throw without WHERE when allowFullTableDelete is false', () => {
    const input: DeleteQueryInput = {
      table: 'users',
      vendor: 'postgresql',
    };
    expect(() => buildDeleteQuery(input)).toThrow('WHERE conditions are required');
  });

  it('should allow full-table DELETE when allowFullTableDelete is true', () => {
    const input: DeleteQueryInput = {
      table: 'temp_data',
      allowFullTableDelete: true,
      vendor: 'sqlite',
    };
    const result = buildDeleteQuery(input);
    expect(result.whereApplied).toBe(false);
  });

  it('should build soft-delete UPDATE with default column', () => {
    const input: DeleteQueryInput = {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: {},
      vendor: 'postgresql',
    };
    const result = buildDeleteQuery(input);
    expect(result.usesSoftDelete).toBe(true);
    expect(result.softDeleteColumn).toBe('deleted_at');
  });

  it('should build soft-delete with custom column', () => {
    const input: DeleteQueryInput = {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: { column: 'removed_at' },
      vendor: 'mysql',
    };
    const result = buildDeleteQuery(input);
    expect(result.usesSoftDelete).toBe(true);
    expect(result.softDeleteColumn).toBe('removed_at');
  });

  it('should throw for invalid table name', () => {
    const input: DeleteQueryInput = {
      table: ' ',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    expect(() => buildDeleteQuery(input)).toThrow('must not be empty');
  });

  it('should handle schema-qualified table names', () => {
    const input: DeleteQueryInput = {
      table: 'public.users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    };
    const result = buildDeleteQuery(input);
    expect(result.whereApplied).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildSelectQuery
// ---------------------------------------------------------------------------

describe('query-builder > buildSelectQuery', () => {
  it('should build a simple SELECT * query', () => {
    const input: SelectQueryInput = {
      table: 'users',
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should build SELECT with specific columns', () => {
    const input: SelectQueryInput = {
      table: 'users',
      columns: ['id', 'name', 'email'],
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should build SELECT with WHERE conditions', () => {
    const input: SelectQueryInput = {
      table: 'users',
      where: [{ column: 'age', operator: 'gte', value: 18 }],
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should build SELECT with ORDER BY', () => {
    const input: SelectQueryInput = {
      table: 'users',
      orderBy: [{ column: 'name', direction: 'asc' }],
      vendor: 'mysql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should build SELECT with LIMIT and OFFSET', () => {
    const input: SelectQueryInput = {
      table: 'users',
      limit: 10,
      offset: 20,
      vendor: 'sqlite',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should build SELECT with all clauses combined', () => {
    const input: SelectQueryInput = {
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
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should throw for invalid table name', () => {
    const input: SelectQueryInput = {
      table: 'users; DROP TABLE',
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).toThrow('contains invalid characters');
  });

  it('should throw for invalid column name', () => {
    const input: SelectQueryInput = {
      table: 'users',
      columns: ['id', 'DROP TABLE users'],
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).toThrow('contains invalid characters');
  });

  it('should handle schema-qualified table names', () => {
    const input: SelectQueryInput = {
      table: 'public.users',
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should handle mysql backtick quoting', () => {
    const input: SelectQueryInput = {
      table: 'users',
      columns: ['id', 'name'],
      vendor: 'mysql',
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  // WHERE operator tests (mirroring UPDATE operators)
  it('should handle all WHERE operators for SELECT', () => {
    const input: SelectQueryInput = {
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
    };
    expect(() => buildSelectQuery(input)).not.toThrow();
  });

  it('should throw when SELECT eq has null value', () => {
    const input: SelectQueryInput = {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: null }],
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).toThrow('null is only allowed');
  });

  it('should throw when SELECT in has empty array', () => {
    const input: SelectQueryInput = {
      table: 'users',
      where: [{ column: 'id', operator: 'in', value: [] }],
      vendor: 'postgresql',
    };
    expect(() => buildSelectQuery(input)).toThrow('requires a non-empty array');
  });
});
