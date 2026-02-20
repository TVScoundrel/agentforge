/**
 * Unit tests for relational-delete error-utils.
 * Covers all safe validation patterns, constraint messages, and the composite isSafeDeleteError.
 */

import { describe, expect, it } from 'vitest';
import {
  isSafeDeleteValidationError,
  getDeleteConstraintViolationMessage,
  isSafeDeleteError,
} from '../../../../src/data/relational/tools/relational-delete/error-utils.js';

// ---------------------------------------------------------------------------
// isSafeDeleteValidationError
// ---------------------------------------------------------------------------

describe('relational-delete > error-utils > isSafeDeleteValidationError', () => {
  it('should return true for "must not be empty" error', () => {
    expect(isSafeDeleteValidationError(new Error('Table name must not be empty'))).toBe(true);
  });

  it('should return true for "contains invalid characters" error', () => {
    expect(isSafeDeleteValidationError(new Error('Identifier contains invalid characters'))).toBe(true);
  });

  it('should return true for WHERE required error', () => {
    expect(isSafeDeleteValidationError(new Error('WHERE conditions are required for DELETE queries'))).toBe(true);
  });

  it('should return true for allowFullTableDelete error', () => {
    expect(
      isSafeDeleteValidationError(
        new Error('WHERE conditions are required unless allowFullTableDelete is true'),
      ),
    ).toBe(true);
  });

  it('should return true for "value is required for this operator" error', () => {
    expect(isSafeDeleteValidationError(new Error('value is required for this operator'))).toBe(true);
  });

  it('should return true for null isNull/isNotNull error', () => {
    expect(isSafeDeleteValidationError(new Error('null is only allowed with isNull/isNotNull operators'))).toBe(true);
  });

  it('should return true for "operator requires a value" error', () => {
    expect(isSafeDeleteValidationError(new Error('operator requires a value'))).toBe(true);
  });

  it('should return true for "operator requires a string or number value" error', () => {
    expect(isSafeDeleteValidationError(new Error('operator requires a string or number value'))).toBe(true);
  });

  it('should return true for "operator requires a string value" error', () => {
    expect(isSafeDeleteValidationError(new Error('operator requires a string value'))).toBe(true);
  });

  it('should return true for "operator requires a non-empty array value" error', () => {
    expect(isSafeDeleteValidationError(new Error('operator requires a non-empty array value'))).toBe(true);
  });

  it('should return true for "must not include value" error', () => {
    expect(isSafeDeleteValidationError(new Error('isNull must not include value'))).toBe(true);
  });

  it('should return false for generic error', () => {
    expect(isSafeDeleteValidationError(new Error('Connection refused'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isSafeDeleteValidationError('string')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDeleteConstraintViolationMessage
// ---------------------------------------------------------------------------

describe('relational-delete > error-utils > getDeleteConstraintViolationMessage', () => {
  it('should detect foreign key constraint violation (without cascade)', () => {
    const msg = getDeleteConstraintViolationMessage(new Error('violates foreign key constraint'), false);
    expect(msg).toBe('Delete failed: foreign key constraint violation.');
  });

  it('should detect foreign key constraint with cascade hint', () => {
    const msg = getDeleteConstraintViolationMessage(new Error('violates foreign key constraint'), true);
    expect(msg).toContain('Delete failed: foreign key constraint violation.');
    expect(msg).toContain('ON DELETE CASCADE');
  });

  it('should detect "foreign key mismatch" error', () => {
    const msg = getDeleteConstraintViolationMessage(new Error('foreign key mismatch'), false);
    expect(msg).toBe('Delete failed: foreign key constraint violation.');
  });

  it('should detect MySQL FK error "a foreign key constraint fails"', () => {
    const msg = getDeleteConstraintViolationMessage(new Error('a foreign key constraint fails'), false);
    expect(msg).toBe('Delete failed: foreign key constraint violation.');
  });

  it('should return null for non-constraint error', () => {
    const msg = getDeleteConstraintViolationMessage(new Error('timeout exceeded'), false);
    expect(msg).toBeNull();
  });

  it('should return null for non-Error', () => {
    const msg = getDeleteConstraintViolationMessage({ message: 'foreign key constraint' }, false);
    expect(msg).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isSafeDeleteError
// ---------------------------------------------------------------------------

describe('relational-delete > error-utils > isSafeDeleteError', () => {
  it('should return true for validation errors', () => {
    expect(isSafeDeleteError(new Error('Table name must not be empty'))).toBe(true);
  });

  it('should return true for "Delete failed:" prefixed errors', () => {
    expect(isSafeDeleteError(new Error('Delete failed: foreign key constraint violation.'))).toBe(true);
  });

  it('should return false for generic database errors', () => {
    expect(isSafeDeleteError(new Error('connection reset'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isSafeDeleteError(42)).toBe(false);
  });

  it('should return true for operator validation patterns', () => {
    expect(isSafeDeleteError(new Error('operator requires a string or number value'))).toBe(true);
  });
});
