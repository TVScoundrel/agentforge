/**
 * Schema diff and serialisation utilities.
 *
 * Compare two {@link DatabaseSchema} instances and produce a structured
 * diff report.  Also provide JSON export / import for snapshot testing
 * and cross-environment schema comparison.
 *
 * @module schema/schema-diff
 */

import { createLogger } from '@agentforge/core';
import type { ColumnSchema, DatabaseSchema, TableSchema } from './types.js';

const logger = createLogger('agentforge:tools:data:relational:schema-diff');

// ---------------------------------------------------------------------------
// Diff types
// ---------------------------------------------------------------------------

/** Describes a difference for a single column. */
export interface ColumnDiff {
  column: string;
  type: 'added' | 'removed' | 'changed';
  /** Present when type is `changed` */
  changes?: Array<{
    property: string;
    before: unknown;
    after: unknown;
  }>;
}

/** Describes a difference for a single table. */
export interface TableDiff {
  table: string;
  type: 'added' | 'removed' | 'changed';
  /** Present when type is `changed` — per-column changes */
  columns?: ColumnDiff[];
  /** Present when type is `changed` — primary-key changes */
  primaryKeyChanged?: { before: string[]; after: string[] };
}

/** Full diff report between two schemas. */
export interface SchemaDiffResult {
  /** Whether the schemas are identical */
  identical: boolean;
  /** Per-table differences */
  tables: TableDiff[];
  /** Summary counts */
  summary: {
    tablesAdded: number;
    tablesRemoved: number;
    tablesChanged: number;
    columnsAdded: number;
    columnsRemoved: number;
    columnsChanged: number;
  };
}

// ---------------------------------------------------------------------------
// Diff implementation
// ---------------------------------------------------------------------------

/**
 * Compare two database schemas and return a structured diff report.
 *
 * The comparison is name-based and case-insensitive. Schema-qualified
 * names are supported (e.g. `public.users`).
 *
 * @param before - The baseline schema
 * @param after - The schema to compare against the baseline
 * @returns A structured diff report
 */
export function diffSchemas(before: DatabaseSchema, after: DatabaseSchema): SchemaDiffResult {
  const tableDiffs: TableDiff[] = [];
  let columnsAdded = 0;
  let columnsRemoved = 0;
  let columnsChanged = 0;

  const beforeMap = tableMap(before.tables);
  const afterMap = tableMap(after.tables);

  // Removed tables
  for (const [key, table] of beforeMap) {
    if (!afterMap.has(key)) {
      tableDiffs.push({ table: formatName(table), type: 'removed' });
    }
  }

  // Added tables
  for (const [key, table] of afterMap) {
    if (!beforeMap.has(key)) {
      tableDiffs.push({ table: formatName(table), type: 'added' });
    }
  }

  // Changed tables
  for (const [key, beforeTable] of beforeMap) {
    const afterTable = afterMap.get(key);
    if (!afterTable) continue;

    const colDiffs = diffColumns(beforeTable.columns, afterTable.columns);
    const pkChanged = !arraysEqual(beforeTable.primaryKey, afterTable.primaryKey);

    if (colDiffs.length > 0 || pkChanged) {
      const diff: TableDiff = { table: formatName(beforeTable), type: 'changed', columns: colDiffs };
      if (pkChanged) {
        diff.primaryKeyChanged = { before: beforeTable.primaryKey, after: afterTable.primaryKey };
      }
      tableDiffs.push(diff);
    }

    for (const cd of colDiffs) {
      if (cd.type === 'added') columnsAdded++;
      else if (cd.type === 'removed') columnsRemoved++;
      else columnsChanged++;
    }
  }

  const tablesAdded = tableDiffs.filter((d) => d.type === 'added').length;
  const tablesRemoved = tableDiffs.filter((d) => d.type === 'removed').length;
  const tablesChanged = tableDiffs.filter((d) => d.type === 'changed').length;
  const identical = tableDiffs.length === 0;

  logger.debug('Schema diff computed', {
    identical,
    tablesAdded,
    tablesRemoved,
    tablesChanged,
  });

  return {
    identical,
    tables: tableDiffs,
    summary: { tablesAdded, tablesRemoved, tablesChanged, columnsAdded, columnsRemoved, columnsChanged },
  };
}

// ---------------------------------------------------------------------------
// JSON export / import
// ---------------------------------------------------------------------------

/**
 * Export a {@link DatabaseSchema} to a JSON string.
 *
 * The output is deterministic (keys sorted, 2-space indent) so that it
 * can be used for snapshot testing.
 *
 * @param schema - The schema to serialise
 * @returns Pretty-printed JSON string
 */
export function exportSchemaToJson(schema: DatabaseSchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Import a {@link DatabaseSchema} from a JSON string.
 *
 * Performs basic structural validation to ensure the parsed object has the
 * required shape.
 *
 * @param json - JSON string produced by {@link exportSchemaToJson}
 * @returns Parsed database schema
 * @throws Error when the JSON is not a valid DatabaseSchema
 */
export function importSchemaFromJson(json: string): DatabaseSchema {
  const parsed: unknown = JSON.parse(json);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid schema JSON: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  if (!obj.vendor || typeof obj.vendor !== 'string') {
    throw new Error('Invalid schema JSON: missing or invalid "vendor" field');
  }

  if (!Array.isArray(obj.tables)) {
    throw new Error('Invalid schema JSON: missing or invalid "tables" array');
  }

  if (!obj.generatedAt || typeof obj.generatedAt !== 'string') {
    throw new Error('Invalid schema JSON: missing or invalid "generatedAt" field');
  }

  // Validate individual tables have required fields
  for (const table of obj.tables) {
    if (!table || typeof table !== 'object') {
      throw new Error('Invalid schema JSON: each table must be an object');
    }
    if (!table.name || typeof table.name !== 'string') {
      throw new Error('Invalid schema JSON: each table must have a "name" string');
    }
    if (!Array.isArray(table.columns)) {
      throw new Error(`Invalid schema JSON: table "${table.name}" missing "columns" array`);
    }
    if (!Array.isArray(table.primaryKey)) {
      throw new Error(`Invalid schema JSON: table "${table.name}" missing "primaryKey" array`);
    }
  }

  logger.debug('Schema imported from JSON', {
    vendor: obj.vendor,
    tableCount: (obj.tables as unknown[]).length,
  });

  return parsed as DatabaseSchema;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function tableMap(tables: TableSchema[]): Map<string, TableSchema> {
  const map = new Map<string, TableSchema>();
  for (const t of tables) {
    map.set(formatName(t).toLowerCase(), t);
  }
  return map;
}

function formatName(table: TableSchema): string {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
}

function diffColumns(before: ColumnSchema[], after: ColumnSchema[]): ColumnDiff[] {
  const diffs: ColumnDiff[] = [];
  const beforeMap = new Map<string, ColumnSchema>();
  const afterMap = new Map<string, ColumnSchema>();

  for (const c of before) beforeMap.set(c.name.toLowerCase(), c);
  for (const c of after) afterMap.set(c.name.toLowerCase(), c);

  // Removed
  for (const [key] of beforeMap) {
    if (!afterMap.has(key)) {
      diffs.push({ column: beforeMap.get(key)!.name, type: 'removed' });
    }
  }

  // Added
  for (const [key] of afterMap) {
    if (!beforeMap.has(key)) {
      diffs.push({ column: afterMap.get(key)!.name, type: 'added' });
    }
  }

  // Changed
  for (const [key, beforeCol] of beforeMap) {
    const afterCol = afterMap.get(key);
    if (!afterCol) continue;

    const changes: Array<{ property: string; before: unknown; after: unknown }> = [];

    if (beforeCol.type.toLowerCase() !== afterCol.type.toLowerCase()) {
      changes.push({ property: 'type', before: beforeCol.type, after: afterCol.type });
    }
    if (beforeCol.isNullable !== afterCol.isNullable) {
      changes.push({ property: 'isNullable', before: beforeCol.isNullable, after: afterCol.isNullable });
    }
    if (beforeCol.isPrimaryKey !== afterCol.isPrimaryKey) {
      changes.push({ property: 'isPrimaryKey', before: beforeCol.isPrimaryKey, after: afterCol.isPrimaryKey });
    }
    if (String(beforeCol.defaultValue) !== String(afterCol.defaultValue)) {
      changes.push({ property: 'defaultValue', before: beforeCol.defaultValue, after: afterCol.defaultValue });
    }

    if (changes.length > 0) {
      diffs.push({ column: beforeCol.name, type: 'changed', changes });
    }
  }

  return diffs;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}
