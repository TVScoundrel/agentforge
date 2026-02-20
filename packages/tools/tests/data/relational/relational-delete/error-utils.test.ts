import { describe, expect, it } from 'vitest';
import {
  getDeleteConstraintViolationMessage,
  isSafeDeleteValidationError,
} from '../../../../src/data/relational/tools/relational-delete/error-utils.js';

describe('relational-delete error utils', () => {
  describe('isSafeDeleteValidationError', () => {
    it('treats GT/LT/GTE/LTE type errors as safe validation errors', () => {
      const error = new Error('GT operator requires a string or number value for column age');

      expect(isSafeDeleteValidationError(error)).toBe(true);
    });

    it('treats EQ/NE missing-value errors as safe validation errors', () => {
      const error = new Error('EQ operator requires a value for column id');

      expect(isSafeDeleteValidationError(error)).toBe(true);
    });
  });

  describe('getDeleteConstraintViolationMessage', () => {
    it('returns FK guidance for foreign key constraint errors', () => {
      const error = new Error('FOREIGN KEY constraint failed');

      expect(getDeleteConstraintViolationMessage(error, false)).toBe(
        'Delete failed: foreign key constraint violation.'
      );
      expect(getDeleteConstraintViolationMessage(error, true)).toContain(
        'Verify database-level ON DELETE CASCADE is configured'
      );
    });

    it('does not misclassify non-FK constraint errors', () => {
      const error = new Error('UNIQUE constraint failed: users.email');

      expect(getDeleteConstraintViolationMessage(error, false)).toBeNull();
    });
  });
});
