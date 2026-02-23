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

/**
 * Check whether an error is a safe DELETE input validation error
 * that can be exposed to the caller without leaking database internals.
 *
 * @param error - The caught error
 * @returns `true` if the error message matches a known validation pattern
 */
export function isSafeDeleteValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_DELETE_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern));
}

/**
 * Extract a user-safe constraint violation message from a DELETE error.
 *
 * @param error - The caught error
 * @param cascade - Whether cascade mode was requested
 * @returns A sanitized message string, or `null` if no constraint pattern matched
 */
export function getDeleteConstraintViolationMessage(error: unknown, cascade: boolean): string | null {
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
      if (cascade) {
        return `${entry.message} Verify database-level ON DELETE CASCADE is configured for related foreign keys.`;
      }
      return entry.message;
    }
  }

  return null;
}

/**
 * Check whether a DELETE error is safe to expose to the caller.
 * Matches both validation errors and constraint violation patterns.
 *
 * @param error - The caught error
 * @returns `true` if the error is safe to surface
 */
export function isSafeDeleteError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_DELETE_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern))
    || error.message.startsWith('Delete failed:');
}
