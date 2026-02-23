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

/**
 * Check whether an error is a safe INSERT input validation error
 * that can be exposed to the caller without leaking database internals.
 *
 * @param error - The caught error
 * @returns `true` if the error message matches a known validation pattern
 */
export function isSafeInsertValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_INSERT_VALIDATION_PATTERNS.some((pattern) => error.message.includes(pattern));
}

/**
 * Extract a user-safe constraint violation message from an INSERT error.
 *
 * @param error - The caught error
 * @returns A sanitized message string, or `null` if no constraint pattern matched
 */
export function getConstraintViolationMessage(error: unknown): string | null {
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
 * Check whether an INSERT error is safe to expose to the caller.
 * Matches both validation errors and constraint violation patterns.
 *
 * @param error - The caught error
 * @returns `true` if the error is safe to surface
 */
export function isSafeInsertError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return isSafeInsertValidationError(error) || getConstraintViolationMessage(error) !== null;
}
