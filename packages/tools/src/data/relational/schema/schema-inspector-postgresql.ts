import type { ForeignKeySchema, TableSchema } from './types.js';
import {
  applyIndexRows,
  applyPrimaryKeyColumn,
  createColumnSchema,
  createTableMap,
  getTableFromRow,
  toOptionalStringValue,
  toStringValue,
  toBooleanValue,
} from './schema-inspector-shared.js';

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

export async function inspectPostgreSQL(
  runQueryRows: (query: string) => Promise<Array<Record<string, unknown>>>,
): Promise<TableSchema[]> {
  const tableRows = await runQueryRows(POSTGRES_TABLES_QUERY);
  const tableMap = createTableMap(
    tableRows.map((row) => ({
      schemaName: toOptionalStringValue(row.schema_name),
      tableName: toStringValue(row.table_name),
    })),
  );

  const columnsRows = await runQueryRows(POSTGRES_COLUMNS_QUERY);
  for (const row of columnsRows) {
    const table = getTableFromRow(tableMap, row, 'table_name', 'schema_name');
    if (!table) {
      continue;
    }

    table.columns.push(createColumnSchema(row));
  }

  const primaryKeyRows = await runQueryRows(POSTGRES_PRIMARY_KEYS_QUERY);
  for (const row of primaryKeyRows) {
    const table = getTableFromRow(tableMap, row, 'table_name', 'schema_name');
    if (!table) {
      continue;
    }

    applyPrimaryKeyColumn(table, toStringValue(row.column_name));
  }

  const foreignKeyRows = await runQueryRows(POSTGRES_FOREIGN_KEYS_QUERY);
  for (const row of foreignKeyRows) {
    const table = getTableFromRow(tableMap, row, 'table_name', 'schema_name');
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

  const indexRows = await runQueryRows(POSTGRES_INDEXES_QUERY);
  applyIndexRows(tableMap, indexRows, 'table_name', 'schema_name', {
    indexNameField: 'index_name',
    columnField: 'column_name',
    positionField: 'column_position',
    uniqueResolver: (row) => toBooleanValue(row.is_unique),
  });

  return Array.from(tableMap.values());
}
