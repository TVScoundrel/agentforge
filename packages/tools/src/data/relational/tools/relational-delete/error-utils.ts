/**
 * Helpers for classifying safe validation and constraint errors in relational-delete.
 */

const SAFE_DELETE_VALIDATION_PATTERNS = [
  'must not be empty',
  'contains invalid characters',
  'WHERE conditions are required for DELETE queries',
  'WHERE conditions are required unless allowFullTableDelete is true',
  'value is required for this operator',
  'null is only allowed with isNull/isNotNull operators',
  'operator requires a value',
  'operator requires a string or number value',
  'operator requires a string value',
  'operator requires a non-empty array value',
  'must not include value',
] as const;

const CONSTRAINT_VIOLATION_PATTERNS = [
  {
    pattern: /(foreign key constraint|violates foreign key constraint|foreign key mismatch|a foreign key constraint fails)/i,
    message: 'Delete failed: foreign key constraint violation.',
  },
] as const;

export function isSafeDeleteValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_DELETE_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern));
}

export function getDeleteConstraintViolationMessage(error: unknown, cascade: boolean): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  for (const entry of CONSTRAINT_VIOLATION_PATTERNS) {
    if (entry.pattern.test(error.message)) {
      if (cascade) {
        return `${entry.message} Verify database-level ON DELETE CASCADE is configured for related foreign keys.`;
      }
      return entry.message;
    }
  }

  return null;
}

export function isSafeDeleteError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_DELETE_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern))
    || error.message.startsWith('Delete failed:');
}
