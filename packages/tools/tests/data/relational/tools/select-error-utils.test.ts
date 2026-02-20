/**
 * Unit tests for relational-select error-utils.
 */

import { describe, expect, it } from 'vitest';
import { isSafeValidationError } from '../../../../src/data/relational/tools/relational-select/error-utils.js';

describe('relational-select > error-utils > isSafeValidationError', () => {
  it('should return true for "must not be empty" error', () => {
    expect(isSafeValidationError(new Error('Column name must not be empty'))).toBe(true);
  });

  it('should return true for "contains invalid characters" error', () => {
    expect(isSafeValidationError(new Error('Table "x;y" contains invalid characters'))).toBe(true);
  });

  it('should return true for "requires a non-empty array value" error', () => {
    expect(isSafeValidationError(new Error('IN operator requires a non-empty array value'))).toBe(true);
  });

  it('should return true for "null is only allowed with isNull/isNotNull operators" error', () => {
    expect(isSafeValidationError(new Error('null is only allowed with isNull/isNotNull operators'))).toBe(true);
  });

  it('should return true for "LIKE operator requires a string value" error', () => {
    expect(isSafeValidationError(new Error('LIKE operator requires a string value for column name'))).toBe(true);
  });

  it('should return true for "Stream cancelled by caller" error', () => {
    expect(isSafeValidationError(new Error('Stream cancelled by caller'))).toBe(true);
  });

  it('should return false for a generic database error', () => {
    expect(isSafeValidationError(new Error('FATAL: database connection failed'))).toBe(false);
  });

  it('should return false for a non-Error object', () => {
    expect(isSafeValidationError('not an error')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isSafeValidationError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isSafeValidationError(undefined)).toBe(false);
  });
});
