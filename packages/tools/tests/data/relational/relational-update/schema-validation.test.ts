/**
 * Schema Validation Tests for Relational UPDATE Tool
 */

import { describe, it, expect } from 'vitest';
import { relationalUpdate } from '../../../../src/data/relational/tools/relational-update/index.js';

describe('Relational UPDATE - Schema Validation', () => {
  it('should accept valid UPDATE with WHERE condition', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
  });

  it('should reject UPDATE without WHERE when allowFullTableUpdate is false', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
  });

  it('should accept UPDATE without WHERE when allowFullTableUpdate is true', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      allowFullTableUpdate: true,
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
  });

  it('should accept optimistic lock without explicit WHERE conditions', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      optimisticLock: { column: 'version', expectedValue: 2 },
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty update data', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: {},
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid batch update operations', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      operations: [
        {
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq', value: 1 }],
        },
        {
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq', value: 2 }],
        },
      ],
      batch: {
        batchSize: 50,
        continueOnError: true,
      },
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(true);
  });

  it('should reject mixed single and batch update payloads', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      operations: [
        {
          data: { status: 'active' },
          where: [{ column: 'id', operator: 'eq', value: 1 }],
        },
      ],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing data when operations are not provided', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject non-array value for IN operator', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'in', value: 1 }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject value for isNull operator', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'deleted_at', operator: 'isNull', value: 'x' }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject malformed table name', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users; DROP TABLE users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty connection string', () => {
    const result = relationalUpdate.schema.safeParse({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'sqlite',
      connectionString: '',
    });

    expect(result.success).toBe(false);
  });
});
