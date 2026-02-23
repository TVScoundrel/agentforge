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

/**
 * Check whether an error is a safe UPDATE input validation error
 * that can be exposed to the caller without leaking database internals.
 *
 * @param error - The caught error
 * @returns `true` if the error message matches a known validation pattern
 */
export function isSafeUpdateValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_UPDATE_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern));
}

/**
 * Extract a user-safe constraint violation message from an UPDATE error.
 *
 * @param error - The caught error
 * @returns A sanitized message string, or `null` if no constraint pattern matched
 */
export function getUpdateConstraintViolationMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  // Check both the error message and the cause message, because drizzle-orm
  // wraps driver-level errors (e.g. SqliteError) in a DrizzleError whose
  // message is generic ("Failed to run the query ...") while the original
  // constraint violation sits on error.cause.
  const messages = [error.message];
  if (error.cause instanceof Error) {
    messages.push(error.cause.message);
  }

  for (const entry of CONSTRAINT_VIOLATION_PATTERNS) {
    if (messages.some((msg) => entry.pattern.test(msg))) {
      return entry.message;
    }
  }

  return null;
}

/**
 * Check whether an UPDATE error is safe to expose to the caller.
 * Matches both validation errors and constraint violation patterns.
 *
 * @param error - The caught error
 * @returns `true` if the error is safe to surface
 */
export function isSafeUpdateError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return isSafeUpdateValidationError(error) || getUpdateConstraintViolationMessage(error) !== null;
}
