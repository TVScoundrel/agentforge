import type { ForeignKeySchema, IndexSchema, TableSchema } from './types.js';
import {
  createColumnSchema,
  createTableMap,
  escapeSqliteStringLiteral,
  sortColumnsByPosition,
  toBooleanValue,
  toNumberValue,
  toStringValue,
} from './schema-inspector-shared.js';

const SQLITE_TABLES_QUERY = `
SELECT
  name AS table_name
FROM sqlite_master
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
ORDER BY name
`;

export async function inspectSQLite(
  runQueryRows: (query: string) => Promise<Array<Record<string, unknown>>>,
): Promise<TableSchema[]> {
  const tableRows = await runQueryRows(SQLITE_TABLES_QUERY);
  const tableMap = createTableMap(
    tableRows.map((row) => ({
      tableName: toStringValue(row.table_name),
    })),
  );

  for (const table of tableMap.values()) {
    const tableLiteral = escapeSqliteStringLiteral(table.name);

    const columnRows = await runQueryRows(`PRAGMA table_info('${tableLiteral}')`);
    const primaryKeyColumns: Array<{ position: number; column: string }> = [];

    for (const row of columnRows) {
      const pkPosition = toNumberValue(row.pk);
      const columnName = toStringValue(row.name);

      if (pkPosition > 0) {
        primaryKeyColumns.push({ position: pkPosition, column: columnName });
      }

      table.columns.push(
        createColumnSchema(row, {
          name: 'name',
          type: 'type',
          nullable: 'notnull',
          defaultValue: 'dflt_value',
          primaryKey: pkPosition > 0,
        }),
      );
      table.columns[table.columns.length - 1].isNullable = !toBooleanValue(row.notnull);
    }

    table.primaryKey = sortColumnsByPosition(primaryKeyColumns);

    const foreignKeyRows = await runQueryRows(`PRAGMA foreign_key_list('${tableLiteral}')`);
    for (const row of foreignKeyRows) {
      const foreignKey: ForeignKeySchema = {
        column: toStringValue(row.from),
        referencedTable: toStringValue(row.table),
        referencedColumn: toStringValue(row.to),
      };
      table.foreignKeys.push(foreignKey);
    }

    const indexListRows = await runQueryRows(`PRAGMA index_list('${tableLiteral}')`);
    for (const indexRow of indexListRows) {
      const indexName = toStringValue(indexRow.name);
      if (!indexName || toStringValue(indexRow.origin) === 'pk') {
        continue;
      }

      const indexNameLiteral = escapeSqliteStringLiteral(indexName);
      const indexInfoRows = await runQueryRows(`PRAGMA index_info('${indexNameLiteral}')`);
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
