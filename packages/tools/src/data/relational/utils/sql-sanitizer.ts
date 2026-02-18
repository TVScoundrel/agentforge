/**
 * SQL sanitization and validation utilities for relational tools
 * @module utils/sql-sanitizer
 */

import type { QueryParams } from '../query/types.js';

const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const DANGEROUS_SQL_PATTERN = /\b(drop|truncate|alter)\b/i;
const PLACEHOLDER_PATTERN = /(\$(\d+))|(\?)|((?<!:):[a-zA-Z_][a-zA-Z0-9_]*)/;
const PARAMETER_REQUIRED_PATTERN = /^(insert|update|delete)\b/i;

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

  if (DANGEROUS_SQL_PATTERN.test(sqlString)) {
    throw new Error('Detected dangerous SQL operation. DROP, TRUNCATE, and ALTER are not allowed.');
  }
}

/**
 * Escape a string value for safe SQL string-literal usage.
 * This is defensive utility only; parameter binding should remain the default.
 */
export function escapeSqlStringValue(value: string): string {
  return value
    .replace(/\0/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
}

/**
 * Validate table name (alphanumeric + underscore, leading alpha/underscore).
 */
export function validateTableName(tableName: string): void {
  if (!tableName || tableName.trim().length === 0) {
    throw new Error('Table name must not be empty');
  }

  if (!IDENTIFIER_PATTERN.test(tableName)) {
    throw new Error(
      `Table name "${tableName}" contains invalid characters. ` +
      'Only alphanumeric characters and underscores are allowed, and it must start with a letter or underscore.'
    );
  }
}

/**
 * Validate column name (alphanumeric + underscore, leading alpha/underscore).
 */
export function validateColumnName(columnName: string): void {
  if (!columnName || columnName.trim().length === 0) {
    throw new Error('Column name must not be empty');
  }

  if (!IDENTIFIER_PATTERN.test(columnName)) {
    throw new Error(
      `Column name "${columnName}" contains invalid characters. ` +
      'Only alphanumeric characters and underscores are allowed, and it must start with a letter or underscore.'
    );
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

