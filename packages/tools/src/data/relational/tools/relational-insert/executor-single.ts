import { buildInsertQuery } from '../../query/query-builder.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { RelationalInsertInput, InsertResult } from './types.js';
import {
  deriveInsertedIds,
  normalizeExecutionResult,
  toSingleInsertRows,
  type InsertExecutionContext,
} from './executor-shared.js';

export async function executeInsertOnce(
  manager: ConnectionManager,
  input: RelationalInsertInput,
  context?: InsertExecutionContext
): Promise<InsertResult> {
  const built = buildInsertQuery({
    table: input.table,
    data: input.data,
    returning: input.returning,
    vendor: input.vendor,
  });

  const executor = context?.transaction ?? manager;

  if (Array.isArray(built.query)) {
    let totalRowCount = 0;
    const allRows: unknown[] = [];
    const allIds: Array<string | number> = [];

    for (const singleQuery of built.query) {
      const rawResult = await executor.execute(singleQuery);
      const normalized = normalizeExecutionResult(rawResult);
      totalRowCount += normalized.rowCount > 0 ? normalized.rowCount : 1;
      if (built.returningMode === 'row') {
        allRows.push(...normalized.rows);
      }
      if (built.returningMode === 'id') {
        const ids = deriveInsertedIds({
          idColumn: built.idColumn,
          inputRows: toSingleInsertRows(built.rows[allIds.length]),
          returnedRows: normalized.rows,
          rowCount: 1,
          insertId: normalized.insertId,
          lastInsertRowid: normalized.lastInsertRowid,
        });
        allIds.push(...ids);
      }
    }

    return {
      rowCount: totalRowCount,
      rows: allRows,
      insertedIds: allIds,
      executionTime: 0,
    };
  }

  const rawResult = await executor.execute(built.query);
  const normalized = normalizeExecutionResult(rawResult);

  const rowCount = normalized.rowCount > 0 ? normalized.rowCount : built.rows.length;
  const rows = built.returningMode === 'row' ? normalized.rows : [];
  const insertedIds = built.returningMode === 'id'
    ? deriveInsertedIds({
      idColumn: built.idColumn,
      inputRows: built.rows,
      returnedRows: normalized.rows,
      rowCount,
      insertId: normalized.insertId,
      lastInsertRowid: normalized.lastInsertRowid,
    })
    : [];

  return {
    rowCount,
    rows,
    insertedIds,
    executionTime: 0,
  };
}
