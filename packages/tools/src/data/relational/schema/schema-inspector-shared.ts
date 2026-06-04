import { VALID_TABLE_FILTER_PATTERN } from './validation.js';
import type {
  ColumnSchema,
  DatabaseSchema,
  IndexSchema,
  TableSchema,
} from './types.js';

export interface QueryRow {
  [key: string]: unknown;
}

export interface TableRef {
  schemaName?: string;
  tableName: string;
}

interface IndexGroupEntry {
  table: TableSchema;
  indexName: string;
  isUnique: boolean;
  columnsByPosition: Array<{ position: number; column: string }>;
}

export function normalizeFilterName(value: string): string {
  return value.trim().toLowerCase();
}

export function buildTableKey(tableName: string, schemaName?: string): string {
  return schemaName ? `${schemaName}.${tableName}` : tableName;
}

export function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

export function toOptionalStringValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const result = toStringValue(value);
  return result.length > 0 ? result : undefined;
}

export function toBooleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'yes' || normalized === 'true' || normalized === 't' || normalized === '1';
  }

  return false;
}

export function toNumberValue(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function validateTableFilters(tables?: string[]): Set<string> | null {
  if (!tables) {
    return null;
  }

  if (tables.length === 0) {
    throw new Error('Tables filter must not be empty when provided');
  }

  const normalized = new Set<string>();
  for (const table of tables) {
    const trimmed = table.trim();
    if (!VALID_TABLE_FILTER_PATTERN.test(trimmed)) {
      throw new Error(
        `Invalid table filter "${table}". Table filter contains invalid characters. Use alphanumeric, underscore, and optional schema qualification.`,
      );
    }
    normalized.add(normalizeFilterName(trimmed));
  }

  return normalized;
}

export function cloneSchema(schema: DatabaseSchema): DatabaseSchema {
  return {
    vendor: schema.vendor,
    generatedAt: schema.generatedAt,
    tables: schema.tables.map((table) => ({
      name: table.name,
      schema: table.schema,
      primaryKey: [...table.primaryKey],
      columns: table.columns.map((column) => ({ ...column })),
      foreignKeys: table.foreignKeys.map((foreignKey) => ({ ...foreignKey })),
      indexes: table.indexes.map((index) => ({
        name: index.name,
        isUnique: index.isUnique,
        columns: [...index.columns],
      })),
    })),
  };
}

export function filterSchemaTables(schema: DatabaseSchema, tableFilters: Set<string> | null): DatabaseSchema {
  if (!tableFilters) {
    return schema;
  }

  return {
    ...schema,
    tables: schema.tables.filter((table) => {
      const bare = normalizeFilterName(table.name);
      const qualified = table.schema
        ? normalizeFilterName(`${table.schema}.${table.name}`)
        : bare;

      return tableFilters.has(bare) || tableFilters.has(qualified);
    }),
  };
}

export function escapeSqliteStringLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

export function sortColumnsByPosition(columnsByPosition: Array<{ position: number; column: string }>): string[] {
  return columnsByPosition
    .sort((a, b) => a.position - b.position)
    .map((entry) => entry.column);
}

export function createTableMap(refs: TableRef[]): Map<string, TableSchema> {
  const tableMap = new Map<string, TableSchema>();

  for (const ref of refs) {
    const key = buildTableKey(ref.tableName, ref.schemaName);
    tableMap.set(key, {
      name: ref.tableName,
      schema: ref.schemaName,
      columns: [],
      primaryKey: [],
      foreignKeys: [],
      indexes: [],
    });
  }

  return tableMap;
}

export function getTableFromRow(
  tableMap: Map<string, TableSchema>,
  row: QueryRow,
  tableField: string,
  schemaField?: string,
): TableSchema | undefined {
  const tableName = toStringValue(row[tableField]);
  const schemaName = schemaField ? toOptionalStringValue(row[schemaField]) : undefined;
  const key = buildTableKey(tableName, schemaName);
  return tableMap.get(key);
}

export function createColumnSchema(row: QueryRow, fields?: {
  name?: string;
  type?: string;
  nullable?: string;
  defaultValue?: string;
  primaryKey?: boolean;
}): ColumnSchema {
  return {
    name: toStringValue(row[fields?.name ?? 'column_name']),
    type: toStringValue(row[fields?.type ?? 'data_type']),
    isNullable: toBooleanValue(row[fields?.nullable ?? 'is_nullable']),
    defaultValue: row[fields?.defaultValue ?? 'column_default'] ?? null,
    isPrimaryKey: fields?.primaryKey ?? false,
  };
}

export function applyPrimaryKeyColumn(table: TableSchema, columnName: string): void {
  table.primaryKey.push(columnName);

  const column = table.columns.find((entry) => entry.name === columnName);
  if (column) {
    column.isPrimaryKey = true;
  }
}

export function applyIndexRows(
  tableMap: Map<string, TableSchema>,
  rows: QueryRow[],
  tableField: string,
  schemaField: string | undefined,
  config: {
    indexNameField: string;
    columnField: string;
    positionField: string;
    uniqueResolver: (row: QueryRow) => boolean;
  },
): void {
  const grouped = new Map<string, IndexGroupEntry>();

  for (const row of rows) {
    const table = getTableFromRow(tableMap, row, tableField, schemaField);
    if (!table) {
      continue;
    }

    const indexName = toStringValue(row[config.indexNameField]);
    if (!indexName) {
      continue;
    }

    const groupKey = `${table.schema ?? ''}.${table.name}.${indexName}`;
    const entry = grouped.get(groupKey) ?? {
      table,
      indexName,
      isUnique: config.uniqueResolver(row),
      columnsByPosition: [],
    };

    entry.columnsByPosition.push({
      position: toNumberValue(row[config.positionField]),
      column: toStringValue(row[config.columnField]),
    });
    grouped.set(groupKey, entry);
  }

  for (const entry of grouped.values()) {
    const index: IndexSchema = {
      name: entry.indexName,
      isUnique: entry.isUnique,
      columns: sortColumnsByPosition(entry.columnsByPosition),
    };
    entry.table.indexes.push(index);
  }
}
