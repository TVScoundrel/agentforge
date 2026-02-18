/**
 * SQL sanitization and validation utilities for relational tools
 * @module utils/sql-sanitizer
 */

import type { QueryParams } from '../query/types.js';

const DANGEROUS_SQL_PATTERN = /\b(drop|truncate|alter|create)\b/i;
export const PLACEHOLDER_PATTERN = /(\$(\d+))|(\?)|((?<!:):[a-zA-Z_][a-zA-Z0-9_]*)/;
const PARAMETER_REQUIRED_PATTERN = /^(insert|update|delete)\b/i;

function stripSqlCommentsAndStrings(sqlString: string): string {
  return sqlString
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .replace(/'([^']|'')*'/g, "''");
}

function hasParameters(params?: QueryParams): boolean {
  if (params === undefined) {
    return false;
  }

  if (Array.isArray(params)) {
    return params.length > 0;
  }

  return Object.keys(params).length > 0;
}

/**
 * Validate raw SQL string safety constraints.
 * Rejects empty input, null bytes, and dangerous DDL operations.
 */
export function validateSqlString(sqlString: string): void {
  if (typeof sqlString !== 'string' || sqlString.trim().length === 0) {
    throw new Error('SQL query must not be empty');
  }

  if (sqlString.includes('\0')) {
    throw new Error('SQL query contains null bytes');
  }

  const normalizedForSafetyCheck = stripSqlCommentsAndStrings(sqlString);

  if (DANGEROUS_SQL_PATTERN.test(normalizedForSafetyCheck)) {
    throw new Error('Detected dangerous SQL operation. CREATE, DROP, TRUNCATE, and ALTER are not allowed.');
  }
}

/**
 * Enforce parameterized-query usage for mutation statements and placeholders.
 */
export function enforceParameterizedQueryUsage(sqlString: string, params?: QueryParams): void {
  const normalized = sqlString.trim().toLowerCase();
  const hasPlaceholders = PLACEHOLDER_PATTERN.test(sqlString);
  const hasParams = hasParameters(params);

  if (hasPlaceholders && !hasParams) {
    throw new Error('Missing parameters: SQL query contains placeholders but no params were provided');
  }

  if (PARAMETER_REQUIRED_PATTERN.test(normalized) && !hasParams) {
    throw new Error(
      'Parameters are required for INSERT/UPDATE/DELETE queries. ' +
      'Use parameterized placeholders instead of embedding values directly.'
    );
  }
}
