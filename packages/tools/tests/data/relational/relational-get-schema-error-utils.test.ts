import { describe, expect, it } from 'vitest';
import { isSafeGetSchemaValidationError } from '../../../src/data/relational/tools/relational-get-schema-error-utils.js';

describe('isSafeGetSchemaValidationError', () => {
  it('should classify safe validation messages as exposable', () => {
    expect(
      isSafeGetSchemaValidationError(new Error('Tables filter must not be empty when provided')),
    ).toBe(true);
    expect(
      isSafeGetSchemaValidationError(new Error('Invalid table filter "x". Table filter contains invalid characters.')),
    ).toBe(true);
  });

  it('should not classify database/driver errors as safe', () => {
    expect(
      isSafeGetSchemaValidationError(new Error('connect ECONNREFUSED 127.0.0.1:5432')),
    ).toBe(false);
    expect(isSafeGetSchemaValidationError('not an error')).toBe(false);
  });
});
