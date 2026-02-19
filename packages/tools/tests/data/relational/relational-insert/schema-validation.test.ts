/**
 * Schema Validation Tests for Relational INSERT Tool
 */

import { describe, it, expect } from 'vitest';
import { relationalInsert } from '../../../../src/data/relational/tools/relational-insert/index.js';

describe('Relational INSERT - Schema Validation', () => {
  it('should accept valid single-row insert input', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: { name: 'Alice', email: 'alice@example.com' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid batch insert input', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ],
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(true);
  });

  it('should accept empty object row for DEFAULT VALUES inserts', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'defaults_table',
      data: {},
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty data array', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: [],
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty table name', () => {
    const result = relationalInsert.schema.safeParse({
      table: '',
      data: { name: 'Alice' },
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid vendor', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: { name: 'Alice' },
      vendor: 'invalid',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(false);
  });

  it('should reject idColumn when mode is not id', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'none', idColumn: 'id' },
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(false);
  });

  it('should accept idColumn when mode is id', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: { name: 'Alice' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(true);
  });

  it('should reject malformed table name', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users; DROP TABLE users',
      data: { name: 'Alice' },
      vendor: 'sqlite',
      connectionString: 'data.db',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty connection string', () => {
    const result = relationalInsert.schema.safeParse({
      table: 'users',
      data: { name: 'Alice' },
      vendor: 'sqlite',
      connectionString: '',
    });

    expect(result.success).toBe(false);
  });
});
