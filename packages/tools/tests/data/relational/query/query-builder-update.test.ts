import { describe, expect, it } from 'vitest';
import { buildUpdateQuery } from '../../../../src/data/relational/query/query-builder.js';
import type { UpdateQueryInput } from '../../../../src/data/relational/query/query-builder.js';

describe('query-builder > buildUpdateQuery', () => {
  it('should build an UPDATE with WHERE conditions', () => {
    const result = buildUpdateQuery({
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
    });
    expect(result.whereApplied).toBe(true);
    expect(result.usesOptimisticLock).toBe(false);
  });

  it('should throw without WHERE when allowFullTableUpdate is false', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'inactive' },
        vendor: 'postgresql',
      }),
    ).toThrow('WHERE conditions are required');
  });

  it('should allow full-table UPDATE when allowFullTableUpdate is true', () => {
    const result = buildUpdateQuery({
      table: 'users',
      data: { status: 'inactive' },
      allowFullTableUpdate: true,
      vendor: 'mysql',
    });
    expect(result.whereApplied).toBe(false);
  });

  it('should include optimistic lock condition', () => {
    const result = buildUpdateQuery({
      table: 'users',
      data: { name: 'Bob' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      optimisticLock: { column: 'version', expectedValue: 5 },
      vendor: 'postgresql',
    });
    expect(result.usesOptimisticLock).toBe(true);
    expect(result.whereApplied).toBe(true);
  });

  it('should throw for empty update data', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: {},
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
      }),
    ).toThrow('must not be empty');
  });

  it('should throw for invalid table name', () => {
    expect(() =>
      buildUpdateQuery({
        table: '1invalid',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
      }),
    ).toThrow('contains invalid characters');
  });

  it('should throw when update data is not an object', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: 'not an object' as unknown as UpdateQueryInput['data'],
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
      }),
    ).toThrow('must be an object');
  });

  it('should throw when optimistic lock expectedValue is null', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        optimisticLock: { column: 'version', expectedValue: null as unknown as number },
        vendor: 'postgresql',
      }),
    ).toThrow('Optimistic lock expectedValue must not be empty');
  });

  it('should throw when update column value is undefined', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: undefined as unknown as string },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
      }),
    ).toThrow('must not be undefined');
  });

  it('should handle ne operator', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'active' },
        where: [{ column: 'id', operator: 'ne', value: 1 }],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should handle gt, lt, gte, lte operators', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'active' },
        where: [
          { column: 'age', operator: 'gt', value: 18 },
          { column: 'age', operator: 'lt', value: 65 },
          { column: 'score', operator: 'gte', value: 10 },
          { column: 'score', operator: 'lte', value: 100 },
        ],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should handle like operator', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'active' },
        where: [{ column: 'name', operator: 'like', value: '%Alice%' }],
        vendor: 'mysql',
      }),
    ).not.toThrow();
  });

  it('should handle in and notIn operators', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'active' },
        where: [
          { column: 'id', operator: 'in', value: [1, 2, 3] },
          { column: 'role', operator: 'notIn', value: ['admin', 'super'] },
        ],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should handle isNull and isNotNull operators', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'active' },
        where: [
          { column: 'deleted_at', operator: 'isNull' },
          { column: 'email', operator: 'isNotNull' },
        ],
        vendor: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('should throw when eq operator has null value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'eq', value: null }],
        vendor: 'postgresql',
      }),
    ).toThrow('null is only allowed with isNull/isNotNull');
  });

  it('should throw when ne operator has null value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'ne', value: null }],
        vendor: 'postgresql',
      }),
    ).toThrow('null is only allowed with isNull/isNotNull');
  });

  it('should throw when gt operator has non-scalar value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'age', operator: 'gt', value: null }],
        vendor: 'postgresql',
      }),
    ).toThrow('requires a string or number value');
  });

  it('should throw when like operator has non-string value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'name', operator: 'like', value: 123 as unknown as string }],
        vendor: 'postgresql',
      }),
    ).toThrow('requires a string value');
  });

  it('should throw when in operator has empty array', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'in', value: [] }],
        vendor: 'postgresql',
      }),
    ).toThrow('requires a non-empty array');
  });

  it('should throw when isNull has a value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'isNull', value: 1 }],
        vendor: 'postgresql',
      }),
    ).toThrow('must not include value');
  });

  it('should throw when isNotNull has a value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'isNotNull', value: 'x' }],
        vendor: 'postgresql',
      }),
    ).toThrow('must not include value');
  });

  it('should throw when eq operator has undefined value', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { name: 'Bob' },
        where: [{ column: 'id', operator: 'eq', value: undefined }],
        vendor: 'postgresql',
      }),
    ).toThrow('requires a value');
  });
});
