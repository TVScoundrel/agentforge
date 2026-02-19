/**
 * Database type → TypeScript type mapper.
 *
 * Maps vendor-specific SQL column types to their closest TypeScript
 * equivalents.  Used for code generation hints, documentation, and
 * schema-aware validation utilities.
 *
 * @module schema/type-mapper
 */

import { createLogger } from '@agentforge/core';
import type { DatabaseVendor } from '../types.js';

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

// ---------------------------------------------------------------------------
// PostgreSQL type mappings
// ---------------------------------------------------------------------------

const POSTGRES_TYPE_MAP: Record<string, string> = {
  // Numeric
  smallint: 'number',
  integer: 'number',
  int: 'number',
  int2: 'number',
  int4: 'number',
  int8: 'string', // bigint → string to avoid JS precision loss
  bigint: 'string',
  serial: 'number',
  bigserial: 'string',
  smallserial: 'number',
  real: 'number',
  float4: 'number',
  'double precision': 'number',
  float8: 'number',
  numeric: 'string', // arbitrary precision → string
  decimal: 'string',
  money: 'string',

  // Text
  text: 'string',
  'character varying': 'string',
  varchar: 'string',
  char: 'string',
  character: 'string',
  name: 'string',
  citext: 'string',

  // Boolean
  boolean: 'boolean',
  bool: 'boolean',

  // Date / time
  date: 'string',
  timestamp: 'string',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  timestamptz: 'string',
  time: 'string',
  'time with time zone': 'string',
  'time without time zone': 'string',
  timetz: 'string',
  interval: 'string',

  // JSON
  json: 'unknown',
  jsonb: 'unknown',

  // Binary
  bytea: 'Buffer',

  // UUID
  uuid: 'string',

  // Network
  inet: 'string',
  cidr: 'string',
  macaddr: 'string',
  macaddr8: 'string',

  // Geometric (represented as strings)
  point: 'string',
  line: 'string',
  lseg: 'string',
  box: 'string',
  path: 'string',
  polygon: 'string',
  circle: 'string',

  // Other
  xml: 'string',
  tsvector: 'string',
  tsquery: 'string',
  oid: 'number',
};

// ---------------------------------------------------------------------------
// MySQL type mappings
// ---------------------------------------------------------------------------

const MYSQL_TYPE_MAP: Record<string, string> = {
  // Numeric
  tinyint: 'number',
  smallint: 'number',
  mediumint: 'number',
  int: 'number',
  integer: 'number',
  bigint: 'string', // precision
  float: 'number',
  double: 'number',
  'double precision': 'number',
  decimal: 'string',
  dec: 'string',
  numeric: 'string',
  bit: 'number',

  // Text
  char: 'string',
  varchar: 'string',
  tinytext: 'string',
  text: 'string',
  mediumtext: 'string',
  longtext: 'string',
  enum: 'string',
  set: 'string',

  // Boolean (MySQL uses tinyint(1))
  boolean: 'boolean',
  bool: 'boolean',

  // Binary
  binary: 'Buffer',
  varbinary: 'Buffer',
  tinyblob: 'Buffer',
  blob: 'Buffer',
  mediumblob: 'Buffer',
  longblob: 'Buffer',

  // Date / time
  date: 'string',
  datetime: 'string',
  timestamp: 'string',
  time: 'string',
  year: 'number',

  // JSON
  json: 'unknown',

  // Spatial (represented as strings)
  geometry: 'string',
  point: 'string',
  linestring: 'string',
  polygon: 'string',
};

// ---------------------------------------------------------------------------
// SQLite type mappings
// ---------------------------------------------------------------------------

const SQLITE_TYPE_MAP: Record<string, string> = {
  // SQLite has dynamic typing with 5 storage classes.
  // The declared type is advisory; these are the common declared types.
  integer: 'number',
  int: 'number',
  tinyint: 'number',
  smallint: 'number',
  mediumint: 'number',
  bigint: 'number', // SQLite stores as 64-bit int, JS number is safe up to 2^53
  real: 'number',
  double: 'number',
  'double precision': 'number',
  float: 'number',
  numeric: 'number',
  decimal: 'number',
  boolean: 'number', // SQLite stores booleans as 0/1
  text: 'string',
  varchar: 'string',
  char: 'string',
  clob: 'string',
  'character varying': 'string',
  'native character': 'string',
  nchar: 'string',
  nvarchar: 'string',
  blob: 'Buffer',
  date: 'string',
  datetime: 'string',
  timestamp: 'string',
  json: 'unknown',
};

// ---------------------------------------------------------------------------
// Vendor map
// ---------------------------------------------------------------------------

const VENDOR_MAPS: Record<DatabaseVendor, Record<string, string>> = {
  postgresql: POSTGRES_TYPE_MAP,
  mysql: MYSQL_TYPE_MAP,
  sqlite: SQLITE_TYPE_MAP,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Map a single database column type to its TypeScript equivalent.
 *
 * Normalises the input type to lower-case and strips size suffixes
 * (e.g. `varchar(255)` → `varchar`) before looking up the mapping.
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
  const typeMap = VENDOR_MAPS[vendor];
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

  if (
    (normalised === 'bigint' || normalised === 'int8' || normalised === 'bigserial') &&
    (vendor === 'postgresql' || vendor === 'mysql')
  ) {
    result.notes = 'Mapped to string to avoid JavaScript number precision loss for 64-bit integers';
  }

  return result;
}

/**
 * Map all columns in a database schema to TypeScript types.
 *
 * Returns a nested map:  `tableName → columnName → MappedType`.
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

  for (const col of columns) {
    if (!result.has(col.table)) {
      result.set(col.table, new Map());
    }
    result.get(col.table)!.set(col.name, mapColumnType(vendor, col.type, col.nullable));
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
  return { ...VENDOR_MAPS[vendor] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a raw database type string for map lookup.
 *
 * Strips size/precision suffixes (`(255)`, `(10,2)`) and converts to
 * lower-case.  Also handles `unsigned` and `[]` (PostgreSQL array) suffixes.
 */
function normaliseDbType(raw: string): string {
  let type = raw.toLowerCase().trim();

  // Strip array suffix (PostgreSQL)
  type = type.replace(/\[\]$/, '');

  // Strip size/precision suffix
  type = type.replace(/\([\d,\s]+\)/, '');

  // Strip unsigned (MySQL)
  type = type.replace(/\s+unsigned$/, '');

  return type.trim();
}
