/**
 * Schema Validation Tests for Relational SELECT Tool
 *
 * Tests schema validation for the relational-select tool.
 */

import { describe, it, expect } from 'vitest';
import { relationalSelect } from '../../../../src/data/relational/tools/relational-select/index.js';

describe('Relational SELECT - Schema Validation', () => {
  it('should accept valid SELECT query', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should accept columns array', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      columns: ['id', 'name', 'email'],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty columns array', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      columns: [],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should accept WHERE conditions', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      where: [
        { column: 'status', operator: 'eq', value: 'active' },
        { column: 'age', operator: 'gte', value: 18 }
      ],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should accept ORDER BY clauses', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      orderBy: [
        { column: 'name', direction: 'asc' },
        { column: 'created_at', direction: 'desc' }
      ],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should accept LIMIT and OFFSET', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      limit: 10,
      offset: 20,
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid vendor', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      vendor: 'invalid',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      limit: -1,
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative offset', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      offset: -1,
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty table name', () => {
    const result = relationalSelect.schema.safeParse({
      table: '',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty connection string', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      vendor: 'postgresql',
      connectionString: ''
    });

    expect(result.success).toBe(false);
  });

  it('should reject value for isNull operator', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      where: [{ column: 'name', operator: 'isNull', value: 'test' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing value for eq operator', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      where: [{ column: 'name', operator: 'eq' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should accept isNull without value', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      where: [{ column: 'name', operator: 'isNull' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should reject non-array value for IN operator', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      where: [{ column: 'status', operator: 'in', value: 'active' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty array for IN operator', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      where: [{ column: 'status', operator: 'in', value: [] }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty ORDER BY column name', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      orderBy: [{ column: '', direction: 'asc' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });

  it('should accept schema-qualified table name', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'public.users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(true);
  });

  it('should reject malformed schema-qualified table name', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'public..users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test'
    });

    expect(result.success).toBe(false);
  });
});
