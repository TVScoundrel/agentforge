/**
 * Schema metadata validation utilities.
 *
 * Validates table existence, column existence, and column types
 * against an introspected {@link DatabaseSchema}.
 *
 * @module schema/schema-validator
 */

import { createLogger } from '@agentforge/core';
import type { ColumnSchema, DatabaseSchema, TableSchema } from './types.js';

const logger = createLogger('agentforge:tools:data:relational:schema-validator');

/**
 * Result of a schema validation check.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error messages (empty when valid) */
  errors: string[];
}

/**
 * Validate that a table exists in the database schema.
 *
 * Supports both plain table names (`users`) and schema-qualified names (`public.users`).
 *
 * @param schema - The introspected database schema
 * @param tableName - Table name to check (plain or schema-qualified)
 * @returns Validation result
 */
export function validateTableExists(
  schema: DatabaseSchema,
  tableName: string,
): ValidationResult {
  const errors: string[] = [];

  if (!tableName || typeof tableName !== 'string') {
    errors.push('Table name must be a non-empty string');
    return { valid: false, errors };
  }

  const table = findTable(schema, tableName);

  if (!table) {
    const available = schema.tables.map((t) => formatTableName(t)).join(', ');
    errors.push(
      `Table "${tableName}" does not exist. Available tables: ${available || '(none)'}`,
    );
  }

  logger.debug('Table existence validation', { tableName, valid: errors.length === 0 });
  return { valid: errors.length === 0, errors };
}

/**
 * Validate that one or more columns exist in a table.
 *
 * @param schema - The introspected database schema
 * @param tableName - Table that should contain the columns
 * @param columnNames - Column names to verify
 * @returns Validation result
 */
export function validateColumnsExist(
  schema: DatabaseSchema,
  tableName: string,
  columnNames: string[],
): ValidationResult {
  const errors: string[] = [];

  const table = findTable(schema, tableName);
  if (!table) {
    errors.push(`Table "${tableName}" does not exist`);
    return { valid: false, errors };
  }

  const existingColumns = new Set(table.columns.map((c) => c.name.toLowerCase()));

  for (const col of columnNames) {
    if (!existingColumns.has(col.toLowerCase())) {
      const available = table.columns.map((c) => c.name).join(', ');
      errors.push(
        `Column "${col}" does not exist in table "${tableName}". Available columns: ${available}`,
      );
    }
  }

  logger.debug('Column existence validation', {
    tableName,
    columnCount: columnNames.length,
    valid: errors.length === 0,
  });
  return { valid: errors.length === 0, errors };
}

/**
 * Validate that columns in a table match expected types.
 *
 * Type matching is case-insensitive and supports partial matches so that
 * `varchar` matches `varchar(255)`, `character varying`, etc.
 *
 * @param schema - The introspected database schema
 * @param tableName - Table to validate against
 * @param expectedTypes - Map of column name → expected type substring
 * @returns Validation result
 */
export function validateColumnTypes(
  schema: DatabaseSchema,
  tableName: string,
  expectedTypes: Record<string, string>,
): ValidationResult {
  const errors: string[] = [];

  const table = findTable(schema, tableName);
  if (!table) {
    errors.push(`Table "${tableName}" does not exist`);
    return { valid: false, errors };
  }

  const columnMap = new Map<string, ColumnSchema>();
  for (const col of table.columns) {
    columnMap.set(col.name.toLowerCase(), col);
  }

  for (const [columnName, expectedType] of Object.entries(expectedTypes)) {
    const col = columnMap.get(columnName.toLowerCase());
    if (!col) {
      errors.push(`Column "${columnName}" does not exist in table "${tableName}"`);
      continue;
    }

    const actualLower = col.type.toLowerCase();
    const expectedLower = expectedType.toLowerCase();

    if (!actualLower.includes(expectedLower) && !expectedLower.includes(actualLower)) {
      errors.push(
        `Column "${columnName}" has type "${col.type}", expected type containing "${expectedType}"`,
      );
    }
  }

  logger.debug('Column type validation', {
    tableName,
    typeChecks: Object.keys(expectedTypes).length,
    valid: errors.length === 0,
  });
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find a table by name, supporting both plain and schema-qualified names.
 */
function findTable(schema: DatabaseSchema, tableName: string): TableSchema | undefined {
  const parts = tableName.split('.');

  if (parts.length === 2) {
    const [schemaName, table] = parts;
    return schema.tables.find(
      (t) =>
        t.name.toLowerCase() === table.toLowerCase() &&
        t.schema?.toLowerCase() === schemaName.toLowerCase(),
    );
  }

  return schema.tables.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
}

/**
 * Format a table schema entry as a display name.
 */
function formatTableName(table: TableSchema): string {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
}
