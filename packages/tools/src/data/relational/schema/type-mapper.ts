/**
 * Database type → TypeScript type mapper.
 *
 * Maps vendor-specific SQL column types to their closest TypeScript
 * equivalents. Used for code generation hints, documentation, and
 * schema-aware validation utilities.
 *
 * @module schema/type-mapper
 */

import { createLogger } from '@agentforge/core';
import type { DatabaseVendor } from '../types.js';
import { normaliseDbType } from './type-mapper-normalization.js';
import { VENDOR_TYPE_MAPS } from './type-mapper-vendor-maps.js';

const logger = createLogger('agentforge:tools:data:relational:type-mapper');

/**
 * TypeScript type representation for a mapped database column.
 */
export interface MappedType {
  /** The TypeScript type string (e.g. `string`, `number`, `boolean`) */
  tsType: string;
  /** Whether the column is nullable (adds `| null`) */
  nullable: boolean;
  /** The original database type string */
  dbType: string;
  /** Optional notes about precision loss, range, etc. */
  notes?: string;
}

/**
 * Map a single database column type to its TypeScript equivalent.
 *
 * Normalises the input type to lower-case and strips PostgreSQL array
 * suffixes, MySQL `unsigned`, and size/precision suffixes such as
 * `varchar(255)` or `numeric(10,2)` before map lookup.
 *
 * @param vendor - Database vendor
 * @param dbType - The raw column type string from the database
 * @param nullable - Whether the column is nullable
 * @returns The mapped TypeScript type information
 */
export function mapColumnType(
  vendor: DatabaseVendor,
  dbType: string,
  nullable = false,
): MappedType {
  const typeMap = VENDOR_TYPE_MAPS[vendor];
  if (!typeMap) {
    return { tsType: 'unknown', nullable, dbType, notes: `Unsupported vendor: ${vendor}` };
  }

  const normalised = normaliseDbType(dbType);
  const tsType = typeMap[normalised] ?? 'unknown';
  const result: MappedType = { tsType, nullable, dbType };

  if (tsType === 'unknown' && normalised !== 'json' && normalised !== 'jsonb') {
    result.notes = `No explicit mapping for "${dbType}"; defaulting to unknown`;
    logger.debug('Unmapped database type', { vendor, dbType, normalised });
  }

  if (usesStringPrecisionFallback(vendor, normalised)) {
    result.notes = 'Mapped to string to avoid JavaScript number precision loss for 64-bit integers';
  }

  return result;
}

/**
 * Map all columns in a database schema to TypeScript types.
 *
 * Returns a nested map: `tableName → columnName → MappedType`.
 *
 * @param vendor - Database vendor
 * @param columns - Array of columns with their metadata
 * @returns Nested map from table to column to mapped type
 */
export function mapSchemaTypes(
  vendor: DatabaseVendor,
  columns: Array<{ table: string; name: string; type: string; nullable: boolean }>,
): Map<string, Map<string, MappedType>> {
  const result = new Map<string, Map<string, MappedType>>();

  for (const column of columns) {
    let tableColumns = result.get(column.table);
    if (!tableColumns) {
      tableColumns = new Map<string, MappedType>();
      result.set(column.table, tableColumns);
    }

    tableColumns.set(column.name, mapColumnType(vendor, column.type, column.nullable));
  }

  logger.debug('Schema type mapping complete', {
    vendor,
    tables: result.size,
    columns: columns.length,
  });

  return result;
}

/**
 * Get the full type map for a vendor (useful for documentation / tooling).
 *
 * @param vendor - Database vendor
 * @returns Read-only copy of the vendor's type mapping table
 */
export function getVendorTypeMap(vendor: DatabaseVendor): Readonly<Record<string, string>> {
  return { ...VENDOR_TYPE_MAPS[vendor] };
}

function usesStringPrecisionFallback(vendor: DatabaseVendor, normalised: string): boolean {
  return (
    (normalised === 'bigint' || normalised === 'int8' || normalised === 'bigserial') &&
    (vendor === 'postgresql' || vendor === 'mysql')
  );
}
