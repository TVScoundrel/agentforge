/**
 * Type definitions for relational schema introspection.
 * @module schema/types
 */

import type { DatabaseVendor } from '../types.js';

/**
 * Foreign key definition for a table column.
 */
export interface ForeignKeySchema {
  name?: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  referencedSchema?: string;
}

/**
 * Index definition for a table.
 */
export interface IndexSchema {
  name: string;
  columns: string[];
  isUnique: boolean;
}

/**
 * Column definition for a table.
 */
export interface ColumnSchema {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: unknown;
  isPrimaryKey: boolean;
}

/**
 * Table schema definition.
 */
export interface TableSchema {
  name: string;
  schema?: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  foreignKeys: ForeignKeySchema[];
  indexes: IndexSchema[];
}

/**
 * Introspected database schema.
 */
export interface DatabaseSchema {
  vendor: DatabaseVendor;
  tables: TableSchema[];
  generatedAt: string;
}

/**
 * Runtime options for schema introspection.
 */
export interface SchemaInspectOptions {
  tables?: string[];
  bypassCache?: boolean;
}

/**
 * Schema inspector configuration.
 */
export interface SchemaInspectorConfig {
  cacheTtlMs?: number;
  cacheKey?: string;
  cache?: SchemaCache;
}

/** Cache entry retained by a schema-cache owner. */
export interface SchemaCacheEntry {
  expiresAt: number;
  schema: DatabaseSchema;
}

/** Minimal cache state accepted by schema inspection. */
export interface SchemaCache {
  get(cacheKey: string): SchemaCacheEntry | undefined;
  set(cacheKey: string, entry: SchemaCacheEntry): void;
  delete(cacheKey: string): void;
  clear(): void;
}
