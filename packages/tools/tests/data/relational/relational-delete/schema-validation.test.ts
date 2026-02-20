/**
 * Schema Validation Tests for Relational DELETE Tool
 */

import { describe, it, expect } from 'vitest';
import { relationalDelete } from '../../../../src/data/relational/tools/relational-delete/index.js';

describe('Relational DELETE - Schema Validation', () => {
  it('should accept valid DELETE with WHERE condition', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
  });

  it('should reject DELETE without WHERE when allowFullTableDelete is false', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
  });

  it('should accept DELETE without WHERE when allowFullTableDelete is true', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      allowFullTableDelete: true,
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
  });

  it('should accept soft-delete configuration', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: { column: 'deleted_at' },
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid batch delete operations', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      operations: [
        {
          where: [{ column: 'id', operator: 'eq', value: 1 }],
        },
        {
          where: [{ column: 'id', operator: 'eq', value: 2 }],
          softDelete: { column: 'deleted_at' },
        },
      ],
      batch: {
        batchSize: 25,
        continueOnError: true,
      },
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(true);
  });

  it('should reject mixed single and batch delete payloads', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      operations: [
        {
          where: [{ column: 'id', operator: 'eq', value: 2 }],
        },
      ],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject malformed table name', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users; DROP TABLE users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty connection string', () => {
    const result = relationalDelete.schema.safeParse({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'sqlite',
      connectionString: '',
    });

    expect(result.success).toBe(false);
  });
});
