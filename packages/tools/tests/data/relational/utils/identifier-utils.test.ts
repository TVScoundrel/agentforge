/**
 * Unit tests for identifier-utils module.
 *
 * Covers validateIdentifier, validateQualifiedIdentifier,
 * quoteIdentifier, and quoteQualifiedIdentifier.
 */

import { describe, expect, it } from 'vitest';
import {
  validateIdentifier,
  validateQualifiedIdentifier,
  quoteIdentifier,
  quoteQualifiedIdentifier,
  VALID_QUALIFIED_IDENTIFIER_PATTERN,
} from '../../../../src/data/relational/utils/identifier-utils.js';

// ---------------------------------------------------------------------------
// validateIdentifier
// ---------------------------------------------------------------------------

describe('identifier-utils > validateIdentifier', () => {
  it('should accept a simple identifier', () => {
    expect(() => validateIdentifier('id', 'Column')).not.toThrow();
  });

  it('should accept an identifier with underscores', () => {
    expect(() => validateIdentifier('first_name', 'Column')).not.toThrow();
  });

  it('should accept an identifier starting with underscore', () => {
    expect(() => validateIdentifier('_internal', 'Column')).not.toThrow();
  });

  it('should accept alphanumeric identifiers', () => {
    expect(() => validateIdentifier('col123', 'Column')).not.toThrow();
  });

  it('should reject empty string', () => {
    expect(() => validateIdentifier('', 'Column')).toThrow('must not be empty');
  });

  it('should reject whitespace-only string', () => {
    expect(() => validateIdentifier('   ', 'Column')).toThrow('must not be empty');
  });

  it('should reject identifiers starting with a digit', () => {
    expect(() => validateIdentifier('1col', 'Column')).toThrow('contains invalid characters');
  });

  it('should reject identifiers with spaces', () => {
    expect(() => validateIdentifier('my column', 'Column')).toThrow('contains invalid characters');
  });

  it('should reject identifiers with semicolons (SQL injection)', () => {
    expect(() => validateIdentifier('id;DROP', 'Column')).toThrow('contains invalid characters');
  });

  it('should reject identifiers with dots (use qualified variant)', () => {
    expect(() => validateIdentifier('public.users', 'Table')).toThrow('contains invalid characters');
  });

  it('should reject identifiers with dashes', () => {
    expect(() => validateIdentifier('my-column', 'Column')).toThrow('contains invalid characters');
  });

  it('should include context in error message', () => {
    expect(() => validateIdentifier('bad!', 'WHERE column')).toThrow('WHERE column');
  });
});

// ---------------------------------------------------------------------------
// validateQualifiedIdentifier
// ---------------------------------------------------------------------------

describe('identifier-utils > validateQualifiedIdentifier', () => {
  it('should accept a simple identifier', () => {
    expect(() => validateQualifiedIdentifier('users', 'Table')).not.toThrow();
  });

  it('should accept a schema-qualified identifier', () => {
    expect(() => validateQualifiedIdentifier('public.users', 'Table')).not.toThrow();
  });

  it('should accept multi-level qualification', () => {
    expect(() => validateQualifiedIdentifier('catalog.schema.table', 'Table')).not.toThrow();
  });

  it('should reject empty string', () => {
    expect(() => validateQualifiedIdentifier('', 'Table')).toThrow('must not be empty');
  });

  it('should reject identifiers with spaces', () => {
    expect(() => validateQualifiedIdentifier('public .users', 'Table')).toThrow('contains invalid characters');
  });

  it('should reject identifiers with SQL injection', () => {
    expect(() => validateQualifiedIdentifier('public.users;DROP', 'Table')).toThrow('contains invalid characters');
  });

  it('should reject a leading dot', () => {
    expect(() => validateQualifiedIdentifier('.users', 'Table')).toThrow('contains invalid characters');
  });

  it('should reject a trailing dot', () => {
    expect(() => validateQualifiedIdentifier('users.', 'Table')).toThrow('contains invalid characters');
  });
});

// ---------------------------------------------------------------------------
// quoteIdentifier
// ---------------------------------------------------------------------------

describe('identifier-utils > quoteIdentifier', () => {
  it('should quote with double-quotes for postgresql', () => {
    expect(quoteIdentifier('users', 'postgresql')).toBe('"users"');
  });

  it('should quote with double-quotes for sqlite', () => {
    expect(quoteIdentifier('users', 'sqlite')).toBe('"users"');
  });

  it('should quote with backticks for mysql', () => {
    expect(quoteIdentifier('users', 'mysql')).toBe('`users`');
  });

  it('should default to double-quotes when vendor is undefined', () => {
    expect(quoteIdentifier('users')).toBe('"users"');
  });
});

// ---------------------------------------------------------------------------
// quoteQualifiedIdentifier
// ---------------------------------------------------------------------------

describe('identifier-utils > quoteQualifiedIdentifier', () => {
  it('should quote simple identifier for postgresql', () => {
    expect(quoteQualifiedIdentifier('users', 'postgresql')).toBe('"users"');
  });

  it('should quote each part of a schema-qualified identifier for postgresql', () => {
    expect(quoteQualifiedIdentifier('public.users', 'postgresql')).toBe('"public"."users"');
  });

  it('should quote each part with backticks for mysql', () => {
    expect(quoteQualifiedIdentifier('mydb.users', 'mysql')).toBe('`mydb`.`users`');
  });

  it('should handle multi-level qualification', () => {
    expect(quoteQualifiedIdentifier('a.b.c', 'sqlite')).toBe('"a"."b"."c"');
  });
});

// ---------------------------------------------------------------------------
// VALID_QUALIFIED_IDENTIFIER_PATTERN
// ---------------------------------------------------------------------------

describe('identifier-utils > VALID_QUALIFIED_IDENTIFIER_PATTERN', () => {
  it('should match simple identifiers', () => {
    expect(VALID_QUALIFIED_IDENTIFIER_PATTERN.test('users')).toBe(true);
  });

  it('should match schema-qualified identifiers', () => {
    expect(VALID_QUALIFIED_IDENTIFIER_PATTERN.test('public.users')).toBe(true);
  });

  it('should not match identifiers starting with digits', () => {
    expect(VALID_QUALIFIED_IDENTIFIER_PATTERN.test('1abc')).toBe(false);
  });

  it('should not match empty string', () => {
    expect(VALID_QUALIFIED_IDENTIFIER_PATTERN.test('')).toBe(false);
  });
});
