/**
 * Shared validation constants for relational schema introspection.
 */

/**
 * Valid table filter pattern:
 * - table
 * - schema.table
 */
export const VALID_TABLE_FILTER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
