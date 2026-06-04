import type { ForeignKeySchema, TableSchema } from './types.js';
import {
  applyIndexRows,
  applyPrimaryKeyColumn,
  createColumnSchema,
  createTableMap,
  getTableFromRow,
  toBooleanValue,
  toOptionalStringValue,
  toStringValue,
} from './schema-inspector-shared.js';

const MYSQL_TABLES_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name AS table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema = DATABASE()
ORDER BY table_name
`;

const MYSQL_COLUMNS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name AS table_name,
  column_name AS column_name,
  column_type AS data_type,
  is_nullable AS is_nullable,
  column_default AS column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
ORDER BY table_name, ordinal_position
`;

const MYSQL_PRIMARY_KEYS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name AS table_name,
  column_name AS column_name,
  ordinal_position AS key_position
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND constraint_name = 'PRIMARY'
ORDER BY table_name, ordinal_position
`;

const MYSQL_FOREIGN_KEYS_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name AS table_name,
  constraint_name AS constraint_name,
  column_name AS column_name,
  referenced_table_schema AS referenced_schema_name,
  referenced_table_name AS referenced_table_name,
  referenced_column_name AS referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND referenced_table_name IS NOT NULL
ORDER BY table_name, constraint_name, ordinal_position
`;

const MYSQL_INDEXES_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name AS table_name,
  index_name AS index_name,
  non_unique AS non_unique,
  column_name AS column_name,
  seq_in_index AS seq_in_index
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND index_name <> 'PRIMARY'
ORDER BY table_name, index_name, seq_in_index
`;

export async function inspectMySQL(
  runQueryRows: (query: string) => Promise<Array<Record<string, unknown>>>,
): Promise<TableSchema[]> {
  const tableRows = await runQueryRows(MYSQL_TABLES_QUERY);
  const tableMap = createTableMap(
    tableRows.map((row) => ({
      schemaName: toOptionalStringValue(row.schema_name),
      tableName: toStringValue(row.table_name),
    })),
  );

  const columnsRows = await runQueryRows(MYSQL_COLUMNS_QUERY);
  for (const row of columnsRows) {
    const table = getTableFromRow(tableMap, row, 'table_name', 'schema_name');
    if (!table) {
      continue;
    }

    table.columns.push(createColumnSchema(row));
  }

  const primaryKeyRows = await runQueryRows(MYSQL_PRIMARY_KEYS_QUERY);
  for (const row of primaryKeyRows) {
    const table = getTableFromRow(tableMap, row, 'table_name', 'schema_name');
    if (!table) {
      continue;
    }

    applyPrimaryKeyColumn(table, toStringValue(row.column_name));
  }

  const foreignKeyRows = await runQueryRows(MYSQL_FOREIGN_KEYS_QUERY);
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

  const indexRows = await runQueryRows(MYSQL_INDEXES_QUERY);
  applyIndexRows(tableMap, indexRows, 'table_name', 'schema_name', {
    indexNameField: 'index_name',
    columnField: 'column_name',
    positionField: 'seq_in_index',
    uniqueResolver: (row) => !toBooleanValue(row.non_unique),
  });

  return Array.from(tableMap.values());
}
