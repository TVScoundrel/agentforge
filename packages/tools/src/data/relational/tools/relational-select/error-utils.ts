/**
 * Helpers for classifying safe validation errors in relational-select.
 * These messages are safe to expose to callers because they describe
 * input-shape/identifier issues rather than database internals.
 */

const SAFE_VALIDATION_ERROR_PATTERNS = [
  'must not be empty',
  'contains invalid characters',
  'requires an array value',
  'requires a non-empty array value',
  'null is only allowed with isNull/isNotNull operators',
  'LIKE operator requires a string value',
  'operator requires a string or number value',
  'operator requires a scalar value',
] as const;

export function isSafeValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return SAFE_VALIDATION_ERROR_PATTERNS.some((pattern) =>
    error.message.includes(pattern)
  );
}

