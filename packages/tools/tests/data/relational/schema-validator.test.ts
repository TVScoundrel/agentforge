/**
 * Unit tests for schema-validator.
 */

import { describe, expect, it } from 'vitest';
import type { DatabaseSchema } from '../../../src/data/relational/schema/types.js';
import {
  validateTableExists,
  validateColumnsExist,
  validateColumnTypes,
} from '../../../src/data/relational/schema/schema-validator.js';

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

function makeSchema(overrides?: Partial<DatabaseSchema>): DatabaseSchema {
  return {
    vendor: 'postgresql',
    generatedAt: '2026-02-19T00:00:00Z',
    tables: [
      {
        name: 'users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true },
          { name: 'name', type: 'character varying(255)', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'email', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false },
          { name: 'age', type: 'integer', isNullable: true, defaultValue: '0', isPrimaryKey: false },
        ],
        primaryKey: ['id'],
        foreignKeys: [],
        indexes: [],
      },
      {
        name: 'orders',
        columns: [
          { name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true },
          { name: 'user_id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'total', type: 'numeric(10,2)', isNullable: false, defaultValue: null, isPrimaryKey: false },
        ],
        primaryKey: ['id'],
        foreignKeys: [],
        indexes: [],
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateTableExists
// ---------------------------------------------------------------------------

describe('schema-validator > validateTableExists', () => {
  it('should pass for an existing table (plain name)', () => {
    const result = validateTableExists(makeSchema(), 'orders');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass for a schema-qualified table name', () => {
    const result = validateTableExists(makeSchema(), 'public.users');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should be case-insensitive', () => {
    const result = validateTableExists(makeSchema(), 'USERS');
    expect(result.valid).toBe(true);
  });

  it('should fail for a non-existent table', () => {
    const result = validateTableExists(makeSchema(), 'products');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('does not exist');
    expect(result.errors[0]).toContain('Available tables');
  });

  it('should fail for empty table name', () => {
    const result = validateTableExists(makeSchema(), '');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('non-empty string');
  });

  it('should list available tables in error message', () => {
    const result = validateTableExists(makeSchema(), 'missing');
    expect(result.errors[0]).toContain('public.users');
    expect(result.errors[0]).toContain('orders');
  });
});

// ---------------------------------------------------------------------------
// validateColumnsExist
// ---------------------------------------------------------------------------

describe('schema-validator > validateColumnsExist', () => {
  it('should pass for existing columns', () => {
    const result = validateColumnsExist(makeSchema(), 'users', ['id', 'name', 'email']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should be case-insensitive for column names', () => {
    const result = validateColumnsExist(makeSchema(), 'users', ['ID', 'NAME']);
    expect(result.valid).toBe(true);
  });

  it('should fail for non-existent columns', () => {
    const result = validateColumnsExist(makeSchema(), 'users', ['id', 'missing_col']);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing_col');
    expect(result.errors[0]).toContain('Available columns');
  });

  it('should fail when table does not exist', () => {
    const result = validateColumnsExist(makeSchema(), 'products', ['id']);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('does not exist');
  });

  it('should report multiple missing columns', () => {
    const result = validateColumnsExist(makeSchema(), 'users', ['foo', 'bar']);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('should fail for empty table name', () => {
    const result = validateColumnsExist(makeSchema(), '', ['id']);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('non-empty string');
  });
});

// ---------------------------------------------------------------------------
// validateColumnTypes
// ---------------------------------------------------------------------------

describe('schema-validator > validateColumnTypes', () => {
  it('should pass when types match exactly', () => {
    const result = validateColumnTypes(makeSchema(), 'users', { id: 'integer' });
    expect(result.valid).toBe(true);
  });

  it('should fail when expected type is not a substring of actual type (varchar vs character varying)', () => {
    const result = validateColumnTypes(makeSchema(), 'users', { name: 'varchar' });
    // 'varchar' doesn't match 'character varying(255)' since neither string is a substring of the other.
    expect(result.valid).toBe(false);
  });

  it('should fail for empty table name', () => {
    const result = validateColumnTypes(makeSchema(), '', { id: 'integer' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('non-empty string');
  });

  it('should pass with substring type match', () => {
    const result = validateColumnTypes(makeSchema(), 'users', { name: 'character varying' });
    expect(result.valid).toBe(true);
  });

  it('should be case-insensitive', () => {
    const result = validateColumnTypes(makeSchema(), 'users', { id: 'INTEGER' });
    expect(result.valid).toBe(true);
  });

  it('should fail when type does not match', () => {
    const result = validateColumnTypes(makeSchema(), 'users', { id: 'text' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('has type');
    expect(result.errors[0]).toContain('expected type');
  });

  it('should fail when column does not exist', () => {
    const result = validateColumnTypes(makeSchema(), 'users', { nope: 'integer' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('does not exist');
  });

  it('should fail when table does not exist', () => {
    const result = validateColumnTypes(makeSchema(), 'products', { id: 'integer' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('does not exist');
  });

  it('should validate multiple columns', () => {
    const result = validateColumnTypes(makeSchema(), 'users', {
      id: 'integer',
      email: 'text',
      age: 'integer',
    });
    expect(result.valid).toBe(true);
  });
});
