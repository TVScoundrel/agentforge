import { createLogger } from '@agentforge/core';

import type { ColumnSchema, DatabaseSchema, TableSchema } from './types.js';
import type { ColumnDiff, SchemaDiffResult, TableDiff } from './schema-diff-types.js';

const logger = createLogger('agentforge:tools:data:relational:schema-diff');

/**
 * Compare two database schemas and return a structured diff report.
 *
 * The comparison is name-based and case-insensitive. Schema-qualified
 * names are supported (e.g. `public.users`).
 */
export function diffSchemas(before: DatabaseSchema, after: DatabaseSchema): SchemaDiffResult {
  const tableDiffs: TableDiff[] = [];
  let columnsAdded = 0;
  let columnsRemoved = 0;
  let columnsChanged = 0;

  const beforeMap = tableMap(before.tables);
  const afterMap = tableMap(after.tables);

  for (const [key, table] of beforeMap) {
    if (!afterMap.has(key)) {
      tableDiffs.push({ table: formatName(table), type: 'removed' });
    }
  }

  for (const [key, table] of afterMap) {
    if (!beforeMap.has(key)) {
      tableDiffs.push({ table: formatName(table), type: 'added' });
    }
  }

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

    for (const columnDiff of colDiffs) {
      if (columnDiff.type === 'added') columnsAdded++;
      else if (columnDiff.type === 'removed') columnsRemoved++;
      else columnsChanged++;
    }
  }

  const tablesAdded = tableDiffs.filter((diff) => diff.type === 'added').length;
  const tablesRemoved = tableDiffs.filter((diff) => diff.type === 'removed').length;
  const tablesChanged = tableDiffs.filter((diff) => diff.type === 'changed').length;
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

function tableMap(tables: TableSchema[]): Map<string, TableSchema> {
  const map = new Map<string, TableSchema>();
  for (const table of tables) {
    map.set(formatName(table).toLowerCase(), table);
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

  for (const column of before) beforeMap.set(column.name.toLowerCase(), column);
  for (const column of after) afterMap.set(column.name.toLowerCase(), column);

  for (const [key, beforeColumn] of beforeMap) {
    if (!afterMap.has(key)) {
      diffs.push({ column: beforeColumn.name, type: 'removed' });
    }
  }

  for (const [key, afterColumn] of afterMap) {
    if (!beforeMap.has(key)) {
      diffs.push({ column: afterColumn.name, type: 'added' });
    }
  }

  for (const [key, beforeColumn] of beforeMap) {
    const afterColumn = afterMap.get(key);
    if (!afterColumn) continue;

    const changes: NonNullable<ColumnDiff['changes']> = [];

    if (beforeColumn.type.toLowerCase() !== afterColumn.type.toLowerCase()) {
      changes.push({ property: 'type', before: beforeColumn.type, after: afterColumn.type });
    }
    if (beforeColumn.isNullable !== afterColumn.isNullable) {
      changes.push({
        property: 'isNullable',
        before: beforeColumn.isNullable,
        after: afterColumn.isNullable,
      });
    }
    if (beforeColumn.isPrimaryKey !== afterColumn.isPrimaryKey) {
      changes.push({
        property: 'isPrimaryKey',
        before: beforeColumn.isPrimaryKey,
        after: afterColumn.isPrimaryKey,
      });
    }
    if (String(beforeColumn.defaultValue) !== String(afterColumn.defaultValue)) {
      changes.push({
        property: 'defaultValue',
        before: beforeColumn.defaultValue,
        after: afterColumn.defaultValue,
      });
    }

    if (changes.length > 0) {
      diffs.push({ column: beforeColumn.name, type: 'changed', changes });
    }
  }

  return diffs;
}

function arraysEqual(before: string[], after: string[]): boolean {
  if (before.length !== after.length) return false;
  return before.every((value, index) => value === after[index]);
}
