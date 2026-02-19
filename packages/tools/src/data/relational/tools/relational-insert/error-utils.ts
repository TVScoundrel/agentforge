/**
 * Helpers for classifying safe validation and constraint errors in relational-insert.
 */

const SAFE_INSERT_VALIDATION_PATTERNS = [
  'must not be empty',
  'contains invalid characters',
  'must be an object',
  'must not be an empty array',
  'must not be undefined',
  'idColumn can only be provided',
  'Returning full rows is not supported for mysql',
  'Batch INSERT with only DEFAULT VALUES is not supported',
] as const;

const CONSTRAINT_VIOLATION_PATTERNS = [
  {
    pattern: /(unique constraint|duplicate key|duplicate entry)/i,
    message: 'Insert failed: unique constraint violation.',
  },
  {
    pattern: /(foreign key constraint|violates foreign key constraint)/i,
    message: 'Insert failed: foreign key constraint violation.',
  },
  {
    pattern: /(not null constraint|cannot be null)/i,
    message: 'Insert failed: NOT NULL constraint violation.',
  },
] as const;

export function isSafeInsertValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_INSERT_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern));
}

export function getConstraintViolationMessage(error: unknown): string | null {
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

export function isSafeInsertError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return isSafeInsertValidationError(error) || getConstraintViolationMessage(error) !== null;
}
