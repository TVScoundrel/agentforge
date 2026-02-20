/**
 * Unit tests for relational-insert error-utils.
 */

import { describe, expect, it } from 'vitest';
import {
  isSafeInsertValidationError,
  getConstraintViolationMessage,
  isSafeInsertError,
} from '../../../../src/data/relational/tools/relational-insert/error-utils.js';

// ---------------------------------------------------------------------------
// isSafeInsertValidationError
// ---------------------------------------------------------------------------

describe('relational-insert > error-utils > isSafeInsertValidationError', () => {
  it('should return true for "must not be empty" error', () => {
    expect(isSafeInsertValidationError(new Error('Table name must not be empty'))).toBe(true);
  });

  it('should return true for "contains invalid characters" error', () => {
    expect(isSafeInsertValidationError(new Error('Column contains invalid characters'))).toBe(true);
  });

  it('should return true for "must be an object" error', () => {
    expect(isSafeInsertValidationError(new Error('Insert row at index 0 must be an object'))).toBe(true);
  });

  it('should return true for "must not be an empty array" error', () => {
    expect(isSafeInsertValidationError(new Error('Insert data must not be an empty array'))).toBe(true);
  });

  it('should return true for "must not be undefined" error', () => {
    expect(isSafeInsertValidationError(new Error('Value must not be undefined'))).toBe(true);
  });

  it('should return true for "idColumn can only be provided" error', () => {
    expect(isSafeInsertValidationError(new Error('idColumn can only be provided when mode is id'))).toBe(true);
  });

  it('should return true for "Returning full rows is not supported for mysql" error', () => {
    expect(isSafeInsertValidationError(new Error('Returning full rows is not supported for mysql'))).toBe(true);
  });

  it('should return true for "Batch INSERT with only DEFAULT VALUES" error', () => {
    expect(isSafeInsertValidationError(new Error('Batch INSERT with only DEFAULT VALUES is not supported'))).toBe(true);
  });

  it('should return false for generic error', () => {
    expect(isSafeInsertValidationError(new Error('Connection refused'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isSafeInsertValidationError('string')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getConstraintViolationMessage
// ---------------------------------------------------------------------------

describe('relational-insert > error-utils > getConstraintViolationMessage', () => {
  it('should detect unique constraint violation', () => {
    const msg = getConstraintViolationMessage(new Error('unique constraint violated'));
    expect(msg).toBe('Insert failed: unique constraint violation.');
  });

  it('should detect duplicate key violation', () => {
    const msg = getConstraintViolationMessage(new Error('ERROR: duplicate key value'));
    expect(msg).toBe('Insert failed: unique constraint violation.');
  });

  it('should detect duplicate entry (MySQL)', () => {
    const msg = getConstraintViolationMessage(new Error("Duplicate entry '1' for key 'PRIMARY'"));
    expect(msg).toBe('Insert failed: unique constraint violation.');
  });

  it('should detect foreign key constraint violation', () => {
    const msg = getConstraintViolationMessage(new Error('violates foreign key constraint'));
    expect(msg).toBe('Insert failed: foreign key constraint violation.');
  });

  it('should detect NOT NULL constraint violation', () => {
    const msg = getConstraintViolationMessage(new Error('not null constraint'));
    expect(msg).toBe('Insert failed: NOT NULL constraint violation.');
  });

  it('should detect "cannot be null" (MySQL variant)', () => {
    const msg = getConstraintViolationMessage(new Error("Column 'name' cannot be null"));
    expect(msg).toBe('Insert failed: NOT NULL constraint violation.');
  });

  it('should return null for non-constraint error', () => {
    const msg = getConstraintViolationMessage(new Error('timeout exceeded'));
    expect(msg).toBeNull();
  });

  it('should return null for non-Error', () => {
    const msg = getConstraintViolationMessage({ message: 'unique constraint' });
    expect(msg).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isSafeInsertError
// ---------------------------------------------------------------------------

describe('relational-insert > error-utils > isSafeInsertError', () => {
  it('should return true for validation errors', () => {
    expect(isSafeInsertError(new Error('Table name must not be empty'))).toBe(true);
  });

  it('should return true for constraint violations', () => {
    expect(isSafeInsertError(new Error('duplicate key value'))).toBe(true);
  });

  it('should return false for generic database errors', () => {
    expect(isSafeInsertError(new Error('connection reset'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isSafeInsertError(42)).toBe(false);
  });
});
