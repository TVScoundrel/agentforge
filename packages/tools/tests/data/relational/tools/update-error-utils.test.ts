/**
 * Unit tests for relational-update error-utils.
 */

import { describe, expect, it } from 'vitest';
import {
  isSafeUpdateValidationError,
  getUpdateConstraintViolationMessage,
  isSafeUpdateError,
} from '../../../../src/data/relational/tools/relational-update/error-utils.js';

// ---------------------------------------------------------------------------
// isSafeUpdateValidationError
// ---------------------------------------------------------------------------

describe('relational-update > error-utils > isSafeUpdateValidationError', () => {
  it('should return true for "must not be empty" error', () => {
    expect(isSafeUpdateValidationError(new Error('Table name must not be empty'))).toBe(true);
  });

  it('should return true for "contains invalid characters" error', () => {
    expect(isSafeUpdateValidationError(new Error('Identifier contains invalid characters'))).toBe(true);
  });

  it('should return true for "Update data must be an object" error', () => {
    expect(isSafeUpdateValidationError(new Error('Update data must be an object'))).toBe(true);
  });

  it('should return true for "Update data must not be empty" error', () => {
    expect(isSafeUpdateValidationError(new Error('Update data must not be empty'))).toBe(true);
  });

  it('should return true for "must not be undefined" error', () => {
    expect(isSafeUpdateValidationError(new Error('Value must not be undefined'))).toBe(true);
  });

  it('should return true for WHERE conditions required error', () => {
    expect(isSafeUpdateValidationError(new Error('WHERE conditions are required for UPDATE queries'))).toBe(true);
  });

  it('should return true for null isNull/isNotNull error', () => {
    expect(isSafeUpdateValidationError(new Error('null is only allowed with isNull/isNotNull operators'))).toBe(true);
  });

  it('should return true for operator type errors', () => {
    expect(isSafeUpdateValidationError(new Error('operator requires a string or number value'))).toBe(true);
    expect(isSafeUpdateValidationError(new Error('operator requires a non-empty array value'))).toBe(true);
    expect(isSafeUpdateValidationError(new Error('operator requires a string value'))).toBe(true);
  });

  it('should return true for "must not include value" error', () => {
    expect(isSafeUpdateValidationError(new Error('isNull must not include value'))).toBe(true);
  });

  it('should return true for optimistic lock errors', () => {
    expect(isSafeUpdateValidationError(new Error('Optimistic lock expectedValue must not be empty'))).toBe(true);
    expect(isSafeUpdateValidationError(new Error('optimistic lock check failed'))).toBe(true);
  });

  it('should return true for allowFullTableUpdate error', () => {
    expect(
      isSafeUpdateValidationError(
        new Error('WHERE conditions are required unless allowFullTableUpdate is true'),
      ),
    ).toBe(true);
  });

  it('should return false for generic error', () => {
    expect(isSafeUpdateValidationError(new Error('Connection refused'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isSafeUpdateValidationError('string')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getUpdateConstraintViolationMessage
// ---------------------------------------------------------------------------

describe('relational-update > error-utils > getUpdateConstraintViolationMessage', () => {
  it('should detect unique constraint violation', () => {
    const msg = getUpdateConstraintViolationMessage(new Error('unique constraint violated'));
    expect(msg).toBe('Update failed: unique constraint violation.');
  });

  it('should detect duplicate key violation', () => {
    const msg = getUpdateConstraintViolationMessage(new Error('ERROR: duplicate key value'));
    expect(msg).toBe('Update failed: unique constraint violation.');
  });

  it('should detect duplicate entry (MySQL)', () => {
    const msg = getUpdateConstraintViolationMessage(new Error("Duplicate entry '1' for key 'email'"));
    expect(msg).toBe('Update failed: unique constraint violation.');
  });

  it('should detect foreign key constraint violation', () => {
    const msg = getUpdateConstraintViolationMessage(new Error('violates foreign key constraint'));
    expect(msg).toBe('Update failed: foreign key constraint violation.');
  });

  it('should detect NOT NULL constraint violation', () => {
    const msg = getUpdateConstraintViolationMessage(new Error('not null constraint'));
    expect(msg).toBe('Update failed: NOT NULL constraint violation.');
  });

  it('should detect "cannot be null" (MySQL variant)', () => {
    const msg = getUpdateConstraintViolationMessage(new Error("Column 'name' cannot be null"));
    expect(msg).toBe('Update failed: NOT NULL constraint violation.');
  });

  it('should return null for non-constraint error', () => {
    const msg = getUpdateConstraintViolationMessage(new Error('timeout exceeded'));
    expect(msg).toBeNull();
  });

  it('should return null for non-Error', () => {
    const msg = getUpdateConstraintViolationMessage({ message: 'unique constraint' });
    expect(msg).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isSafeUpdateError
// ---------------------------------------------------------------------------

describe('relational-update > error-utils > isSafeUpdateError', () => {
  it('should return true for validation errors', () => {
    expect(isSafeUpdateError(new Error('Table name must not be empty'))).toBe(true);
  });

  it('should return true for constraint violations', () => {
    expect(isSafeUpdateError(new Error('duplicate key value'))).toBe(true);
  });

  it('should return false for generic database errors', () => {
    expect(isSafeUpdateError(new Error('connection reset'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isSafeUpdateError(42)).toBe(false);
  });
});
