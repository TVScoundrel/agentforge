/**
 * SQL identifier validation and quoting utilities
 * @module tools/relational-select/identifier-utils
 *
 * Provides vendor-aware identifier quoting and validation to prevent SQL injection
 * through column names, table names, and other identifiers.
 */

import type { DatabaseVendor } from '../../types.js';

/**
 * Valid SQL identifier pattern
 * Allows alphanumeric characters, underscores, and dots (for schema-qualified names)
 * This prevents SQL injection through identifier names
 */
const VALID_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Valid schema-qualified identifier pattern (e.g., "public.users")
 */
const VALID_QUALIFIED_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

/**
 * Validate that a string is a safe SQL identifier
 * @param identifier - The identifier to validate
 * @param context - Description of what the identifier represents (for error messages)
 * @throws {Error} If the identifier contains unsafe characters
 */
export function validateIdentifier(identifier: string, context: string): void {
  if (!identifier || identifier.trim().length === 0) {
    throw new Error(`${context} must not be empty`);
  }

  if (!VALID_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(
      `${context} "${identifier}" contains invalid characters. ` +
      'Only alphanumeric characters and underscores are allowed, must start with a letter or underscore.'
    );
  }
}

/**
 * Validate that a string is a safe SQL identifier, allowing schema-qualified names (e.g., "public.users")
 * @param identifier - The identifier to validate
 * @param context - Description of what the identifier represents (for error messages)
 * @throws {Error} If the identifier contains unsafe characters
 */
export function validateQualifiedIdentifier(identifier: string, context: string): void {
  if (!identifier || identifier.trim().length === 0) {
    throw new Error(`${context} must not be empty`);
  }

  if (!VALID_QUALIFIED_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(
      `${context} "${identifier}" contains invalid characters. ` +
      'Only alphanumeric characters, underscores, and dots (for schema qualification) are allowed.'
    );
  }
}

/**
 * Quote an identifier using vendor-appropriate quoting
 * @param identifier - The validated identifier to quote
 * @param vendor - The database vendor
 * @returns The quoted identifier string
 */
export function quoteIdentifier(identifier: string, vendor?: DatabaseVendor): string {
  if (vendor === 'mysql') {
    // MySQL uses backticks for identifier quoting
    return `\`${identifier}\``;
  }
  // PostgreSQL and SQLite use double quotes (ANSI SQL standard)
  return `"${identifier}"`;
}

/**
 * Quote a potentially schema-qualified identifier (e.g., "public.users" → "public"."users")
 * @param qualifiedName - The validated qualified identifier to quote
 * @param vendor - The database vendor
 * @returns The quoted identifier string
 */
export function quoteQualifiedIdentifier(qualifiedName: string, vendor?: DatabaseVendor): string {
  const parts = qualifiedName.split('.');
  return parts.map(part => quoteIdentifier(part, vendor)).join('.');
}
