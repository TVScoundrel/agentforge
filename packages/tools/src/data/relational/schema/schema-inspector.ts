/**
 * Schema inspector for relational databases.
 * @module schema/schema-inspector
 */

import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../connection/connection-manager.js';
import { executeQuery } from '../query/query-executor.js';
import type { DatabaseVendor } from '../types.js';
import { VALID_TABLE_FILTER_PATTERN } from './validation.js';
import type {
  ColumnSchema,
  DatabaseSchema,
  ForeignKeySchema,
  IndexSchema,
  SchemaInspectOptions,
  SchemaInspectorConfig,
  TableSchema,
} from './types.js';

const logger = createLogger('agentforge:tools:data:relational:schema-inspector');

const DEFAULT_CACHE_TTL_MS = 60_000;

interface QueryRow {
  [key: string]: unknown;
}

interface TableRef {
  schemaName?: string;
  tableName: string;
}

interface CacheEntry {
  expiresAt: number;
  schema: DatabaseSchema;
}

const schemaCache = new Map<string, CacheEntry>();

const POSTGRES_TABLES_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name
`;

const POSTGRES_COLUMNS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, ordinal_position
`;

const POSTGRES_PRIMARY_KEYS_QUERY = `
SELECT
  kcu.table_schema AS schema_name,
  kcu.table_name,
  kcu.column_name,
  kcu.ordinal_position AS key_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
 AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'PRIMARY KEY'
ORDER BY kcu.table_schema, kcu.table_name, kcu.ordinal_position
`;

const POSTGRES_FOREIGN_KEYS_QUERY = `
SELECT
  tc.table_schema AS schema_name,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS referenced_schema_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position
`;

const POSTGRES_INDEXES_QUERY = `
SELECT
  ns.nspname AS schema_name,
  tbl.relname AS table_name,
  idx.relname AS index_name,
  ix.indisunique AS is_unique,
  att.attname AS column_name,
  ord.ordinality AS column_position
FROM pg_class tbl
JOIN pg_namespace ns
  ON ns.oid = tbl.relnamespace
JOIN pg_index ix
  ON ix.indrelid = tbl.oid
JOIN pg_class idx
  ON idx.oid = ix.indexrelid
JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS ord(attnum, ordinality)
  ON true
JOIN pg_attribute att
  ON att.attrelid = tbl.oid
 AND att.attnum = ord.attnum
WHERE tbl.relkind = 'r'
  AND ns.nspname NOT IN ('pg_catalog', 'information_schema')
  AND ix.indisprimary = false
ORDER BY ns.nspname, tbl.relname, idx.relname, ord.ordinality
`;

const MYSQL_TABLES_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema = DATABASE()
ORDER BY table_name
`;

const MYSQL_COLUMNS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name,
  column_name,
  column_type AS data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
ORDER BY table_name, ordinal_position
`;

const MYSQL_PRIMARY_KEYS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name,
  column_name,
  ordinal_position AS key_position
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND constraint_name = 'PRIMARY'
ORDER BY table_name, ordinal_position
`;

const MYSQL_FOREIGN_KEYS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name,
  constraint_name,
  column_name,
  referenced_table_schema AS referenced_schema_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND referenced_table_name IS NOT NULL
ORDER BY table_name, constraint_name, ordinal_position
`;

const MYSQL_INDEXES_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name,
  index_name,
  non_unique,
  column_name,
  seq_in_index
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND index_name <> 'PRIMARY'
ORDER BY table_name, index_name, seq_in_index
`;

const SQLITE_TABLES_QUERY = `
SELECT
  name AS table_name
FROM sqlite_master
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
ORDER BY name
`;

function normalizeFilterName(value: string): string {
  return value.trim().toLowerCase();
}

function buildTableKey(tableName: string, schemaName?: string): string {
  return schemaName ? `${schemaName}.${tableName}` : tableName;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function toOptionalStringValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const result = toStringValue(value);
  return result.length > 0 ? result : undefined;
}

function toBooleanValue(value: unknown): boolean {
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

function toNumberValue(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function validateTableFilters(tables?: string[]): Set<string> | null {
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

function cloneSchema(schema: DatabaseSchema): DatabaseSchema {
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

function filterSchemaTables(schema: DatabaseSchema, tableFilters: Set<string> | null): DatabaseSchema {
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

function escapeSqliteStringLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function sortColumnsByPosition(columnsByPosition: Array<{ position: number; column: string }>): string[] {
  return columnsByPosition
    .sort((a, b) => a.position - b.position)
    .map((entry) => entry.column);
}

export class SchemaInspector {
  private readonly cacheTtlMs: number;
  private readonly cacheKey?: string;

  constructor(
    private readonly manager: ConnectionManager,
    private readonly vendor: DatabaseVendor,
    config?: SchemaInspectorConfig,
  ) {
    this.cacheTtlMs = config?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.cacheKey = config?.cacheKey;
  }

  static clearCache(cacheKey?: string): void {
    if (cacheKey) {
      schemaCache.delete(cacheKey);
      return;
    }

    schemaCache.clear();
  }

  invalidateCache(): void {
    SchemaInspector.clearCache(this.cacheKey);
  }

  async inspect(options?: SchemaInspectOptions): Promise<DatabaseSchema> {
    const tableFilters = validateTableFilters(options?.tables);
    const bypassCache = options?.bypassCache ?? false;

    if (!bypassCache && this.cacheKey) {
      const cached = schemaCache.get(this.cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug('Schema cache hit', { vendor: this.vendor });
        return filterSchemaTables(cloneSchema(cached.schema), tableFilters);
      }
    }

    const schema = await this.inspectFromDatabase();

    if (this.cacheKey && this.cacheTtlMs > 0) {
      schemaCache.set(this.cacheKey, {
        schema: cloneSchema(schema),
        expiresAt: Date.now() + this.cacheTtlMs,
      });
    }

    return filterSchemaTables(cloneSchema(schema), tableFilters);
  }

  private async inspectFromDatabase(): Promise<DatabaseSchema> {
    const tables = this.vendor === 'postgresql'
      ? await this.inspectPostgreSQL()
      : this.vendor === 'mysql'
      ? await this.inspectMySQL()
      : await this.inspectSQLite();

    return {
      vendor: this.vendor,
      tables: tables.sort((left, right) => {
        const leftKey = left.schema ? `${left.schema}.${left.name}` : left.name;
        const rightKey = right.schema ? `${right.schema}.${right.name}` : right.name;
        return leftKey.localeCompare(rightKey);
      }),
      generatedAt: new Date().toISOString(),
    };
  }

  private async runQueryRows(query: string): Promise<QueryRow[]> {
    const result = await executeQuery(this.manager, {
      sql: query,
      vendor: this.vendor,
    });

    return result.rows as QueryRow[];
  }

  private createTableMap(refs: TableRef[]): Map<string, TableSchema> {
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

  private getTableFromRow(
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

  private async inspectPostgreSQL(): Promise<TableSchema[]> {
    const tableRows = await this.runQueryRows(POSTGRES_TABLES_QUERY);
    const tableMap = this.createTableMap(
      tableRows.map((row) => ({
        schemaName: toOptionalStringValue(row.schema_name),
        tableName: toStringValue(row.table_name),
      })),
    );

    const columnsRows = await this.runQueryRows(POSTGRES_COLUMNS_QUERY);
    for (const row of columnsRows) {
      const table = this.getTableFromRow(tableMap, row, 'table_name', 'schema_name');
      if (!table) {
        continue;
      }

      const column: ColumnSchema = {
        name: toStringValue(row.column_name),
        type: toStringValue(row.data_type),
        isNullable: toBooleanValue(row.is_nullable),
        defaultValue: row.column_default ?? null,
        isPrimaryKey: false,
      };
      table.columns.push(column);
    }

    const primaryKeyRows = await this.runQueryRows(POSTGRES_PRIMARY_KEYS_QUERY);
    for (const row of primaryKeyRows) {
      const table = this.getTableFromRow(tableMap, row, 'table_name', 'schema_name');
      if (!table) {
        continue;
      }

      const columnName = toStringValue(row.column_name);
      table.primaryKey.push(columnName);

      const column = table.columns.find((entry) => entry.name === columnName);
      if (column) {
        column.isPrimaryKey = true;
      }
    }

    const foreignKeyRows = await this.runQueryRows(POSTGRES_FOREIGN_KEYS_QUERY);
    for (const row of foreignKeyRows) {
      const table = this.getTableFromRow(tableMap, row, 'table_name', 'schema_name');
      if (!table) {
        continue;
      }

      const foreignKey: ForeignKeySchema = {
        name: toOptionalStringValue(row.constraint_name),
        column: toStringValue(row.column_name),
        referencedSchema: toOptionalStringValue(row.referenced_schema_name),
        referencedTable: toStringValue(row.referenced_table_name),
        referencedColumn: toStringValue(row.referenced_column_name),
      };

      table.foreignKeys.push(foreignKey);
    }

    const indexRows = await this.runQueryRows(POSTGRES_INDEXES_QUERY);
    this.applyIndexRows(tableMap, indexRows, 'table_name', 'schema_name', {
      indexNameField: 'index_name',
      columnField: 'column_name',
      positionField: 'column_position',
      uniqueResolver: (row) => toBooleanValue(row.is_unique),
    });

    return Array.from(tableMap.values());
  }

  private async inspectMySQL(): Promise<TableSchema[]> {
    const tableRows = await this.runQueryRows(MYSQL_TABLES_QUERY);
    const tableMap = this.createTableMap(
      tableRows.map((row) => ({
        schemaName: toOptionalStringValue(row.schema_name),
        tableName: toStringValue(row.table_name),
      })),
    );

    const columnsRows = await this.runQueryRows(MYSQL_COLUMNS_QUERY);
    for (const row of columnsRows) {
      const table = this.getTableFromRow(tableMap, row, 'table_name', 'schema_name');
      if (!table) {
        continue;
      }

      const column: ColumnSchema = {
        name: toStringValue(row.column_name),
        type: toStringValue(row.data_type),
        isNullable: toBooleanValue(row.is_nullable),
        defaultValue: row.column_default ?? null,
        isPrimaryKey: false,
      };
      table.columns.push(column);
    }

    const primaryKeyRows = await this.runQueryRows(MYSQL_PRIMARY_KEYS_QUERY);
    for (const row of primaryKeyRows) {
      const table = this.getTableFromRow(tableMap, row, 'table_name', 'schema_name');
      if (!table) {
        continue;
      }

      const columnName = toStringValue(row.column_name);
      table.primaryKey.push(columnName);

      const column = table.columns.find((entry) => entry.name === columnName);
      if (column) {
        column.isPrimaryKey = true;
      }
    }

    const foreignKeyRows = await this.runQueryRows(MYSQL_FOREIGN_KEYS_QUERY);
    for (const row of foreignKeyRows) {
      const table = this.getTableFromRow(tableMap, row, 'table_name', 'schema_name');
      if (!table) {
        continue;
      }

      const foreignKey: ForeignKeySchema = {
        name: toOptionalStringValue(row.constraint_name),
        column: toStringValue(row.column_name),
        referencedSchema: toOptionalStringValue(row.referenced_schema_name),
        referencedTable: toStringValue(row.referenced_table_name),
        referencedColumn: toStringValue(row.referenced_column_name),
      };

      table.foreignKeys.push(foreignKey);
    }

    const indexRows = await this.runQueryRows(MYSQL_INDEXES_QUERY);
    this.applyIndexRows(tableMap, indexRows, 'table_name', 'schema_name', {
      indexNameField: 'index_name',
      columnField: 'column_name',
      positionField: 'seq_in_index',
      uniqueResolver: (row) => !toBooleanValue(row.non_unique),
    });

    return Array.from(tableMap.values());
  }

  private async inspectSQLite(): Promise<TableSchema[]> {
    const tableRows = await this.runQueryRows(SQLITE_TABLES_QUERY);
    const tableMap = this.createTableMap(
      tableRows.map((row) => ({
        tableName: toStringValue(row.table_name),
      })),
    );

    for (const table of tableMap.values()) {
      const tableLiteral = escapeSqliteStringLiteral(table.name);

      const columnRows = await this.runQueryRows(`PRAGMA table_info('${tableLiteral}')`);
      const primaryKeyColumns: Array<{ position: number; column: string }> = [];

      for (const row of columnRows) {
        const pkPosition = toNumberValue(row.pk);
        const columnName = toStringValue(row.name);

        if (pkPosition > 0) {
          primaryKeyColumns.push({ position: pkPosition, column: columnName });
        }

        const column: ColumnSchema = {
          name: columnName,
          type: toStringValue(row.type),
          isNullable: !toBooleanValue(row.notnull),
          defaultValue: row.dflt_value ?? null,
          isPrimaryKey: pkPosition > 0,
        };
        table.columns.push(column);
      }

      table.primaryKey = sortColumnsByPosition(primaryKeyColumns);

      const foreignKeyRows = await this.runQueryRows(`PRAGMA foreign_key_list('${tableLiteral}')`);
      for (const row of foreignKeyRows) {
        const foreignKey: ForeignKeySchema = {
          column: toStringValue(row.from),
          referencedTable: toStringValue(row.table),
          referencedColumn: toStringValue(row.to),
        };
        table.foreignKeys.push(foreignKey);
      }

      const indexListRows = await this.runQueryRows(`PRAGMA index_list('${tableLiteral}')`);
      for (const indexRow of indexListRows) {
        const indexName = toStringValue(indexRow.name);
        if (!indexName || toStringValue(indexRow.origin) === 'pk') {
          continue;
        }

        const indexNameLiteral = escapeSqliteStringLiteral(indexName);
        const indexInfoRows = await this.runQueryRows(`PRAGMA index_info('${indexNameLiteral}')`);
        const indexColumns = sortColumnsByPosition(
          indexInfoRows.map((row) => ({
            position: toNumberValue(row.seqno),
            column: toStringValue(row.name),
          })),
        );

        const index: IndexSchema = {
          name: indexName,
          isUnique: toBooleanValue(indexRow.unique),
          columns: indexColumns,
        };
        table.indexes.push(index);
      }
    }

    return Array.from(tableMap.values());
  }

  private applyIndexRows(
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
    const grouped = new Map<
      string,
      {
        table: TableSchema;
        indexName: string;
        isUnique: boolean;
        columnsByPosition: Array<{ position: number; column: string }>;
      }
    >();

    for (const row of rows) {
      const table = this.getTableFromRow(tableMap, row, tableField, schemaField);
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
}
