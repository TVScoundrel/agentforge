/**
 * Helpers for classifying safe validation and constraint errors in relational-update.
 */

const SAFE_UPDATE_VALIDATION_PATTERNS = [
  'must not be empty',
  'contains invalid characters',
  'Update data must be an object',
  'Update data must not be empty',
  'must not be undefined',
  'WHERE conditions are required for UPDATE queries',
  'null is only allowed with isNull/isNotNull operators',
  'operator requires a string or number value',
  'operator requires a non-empty array value',
  'operator requires a string value',
  'must not include value',
  'Optimistic lock expectedValue must not be empty',
  'optimistic lock check failed',
  'WHERE conditions are required unless allowFullTableUpdate is true',
] as const;

const CONSTRAINT_VIOLATION_PATTERNS = [
  {
    pattern: /(unique constraint|duplicate key|duplicate entry)/i,
    message: 'Update failed: unique constraint violation.',
  },
  {
    pattern: /(foreign key constraint|violates foreign key constraint)/i,
    message: 'Update failed: foreign key constraint violation.',
  },
  {
    pattern: /(not null constraint|cannot be null)/i,
    message: 'Update failed: NOT NULL constraint violation.',
  },
] as const;

export function isSafeUpdateValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_UPDATE_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern));
}

export function getUpdateConstraintViolationMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  for (const entry of CONSTRAINT_VIOLATION_PATTERNS) {
    if (entry.pattern.test(error.message)) {
      return entry.message;
    }
  }

  return null;
}

export function isSafeUpdateError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return isSafeUpdateValidationError(error) || getUpdateConstraintViolationMessage(error) !== null;
}
