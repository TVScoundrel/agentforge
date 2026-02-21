/**
 * Helpers for classifying safe validation errors in relational-get-schema.
 * These messages are safe to expose to callers because they describe
 * input validation issues rather than database internals.
 */

const SAFE_VALIDATION_ERROR_PATTERNS = [
  'must not be empty',
  'contains invalid characters',
  'Invalid table filter',
] as const;

/**
 * Check whether an error is a safe get-schema input validation error
 * that can be exposed to the caller without leaking database internals.
 *
 * @param error - The caught error
 * @returns `true` if the error message matches a known validation pattern
 */
export function isSafeGetSchemaValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_VALIDATION_ERROR_PATTERNS.some((pattern) =>
    error.message.includes(pattern),
  );
}
