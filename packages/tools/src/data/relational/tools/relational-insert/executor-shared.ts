import { createLogger } from '@agentforge/core';
import type { TransactionContext } from '../../query/transaction.js';
import type {
  InsertBatchOptions,
  InsertRow,
} from './types.js';

export const insertExecutorLogger = createLogger('agentforge:tools:data:relational:insert');

interface NormalizedExecutionResult {
  rows: unknown[];
  rowCount: number;
  insertId?: number;
  lastInsertRowid?: number;
}

/**
 * Execution context for INSERT operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export interface InsertExecutionContext {
  transaction?: TransactionContext;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeExecutionResult(result: unknown): NormalizedExecutionResult {
  if (Array.isArray(result)) {
    if (result.length > 0 && isPlainObject(result[0])) {
      const first = result[0];
      const affectedRows = toNumber(first.affectedRows) ?? toNumber(first.rowCount) ?? toNumber(first.changes);
      const insertId = toNumber(first.insertId);
      const lastInsertRowid = toNumber(first.lastInsertRowid);

      if (affectedRows !== undefined || insertId !== undefined || lastInsertRowid !== undefined) {
        return {
          rows: [],
          rowCount: affectedRows ?? 0,
          insertId,
          lastInsertRowid,
        };
      }
    }

    return {
      rows: result,
      rowCount: result.length,
    };
  }

  if (isPlainObject(result)) {
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const rowCount = toNumber(result.rowCount)
      ?? toNumber(result.affectedRows)
      ?? toNumber(result.changes)
      ?? rows.length;

    return {
      rows,
      rowCount,
      insertId: toNumber(result.insertId),
      lastInsertRowid: toNumber(result.lastInsertRowid),
    };
  }

  return {
    rows: [],
    rowCount: 0,
  };
}

export function deriveInsertedIds(options: {
  idColumn: string;
  inputRows: Array<Record<string, unknown>>;
  returnedRows: unknown[];
  rowCount: number;
  insertId?: number;
  lastInsertRowid?: number;
}): Array<number | string> {
  const { idColumn, inputRows, returnedRows, rowCount, insertId, lastInsertRowid } = options;

  if (returnedRows.length > 0) {
    const idsFromReturn = returnedRows
      .map((row) => (isPlainObject(row) ? row[idColumn] : undefined))
      .filter((id): id is number | string => typeof id === 'number' || typeof id === 'string');

    if (idsFromReturn.length > 0) {
      return idsFromReturn;
    }
  }

  if (inputRows.every((row) => typeof row[idColumn] === 'number' || typeof row[idColumn] === 'string')) {
    return inputRows.map((row) => row[idColumn] as number | string);
  }

  if (insertId !== undefined && rowCount > 0) {
    return Array.from({ length: rowCount }, (_, index) => insertId + index);
  }

  if (lastInsertRowid !== undefined && rowCount > 0) {
    const startId = lastInsertRowid - rowCount + 1;
    return Array.from({ length: rowCount }, (_, index) => startId + index);
  }

  return [];
}

export function resolveBatchOptions(batch: InsertBatchOptions | undefined): Required<InsertBatchOptions> | undefined {
  if (!batch || batch.enabled === false) {
    return undefined;
  }

  return {
    enabled: batch.enabled ?? true,
    batchSize: batch.batchSize ?? 100,
    continueOnError: batch.continueOnError ?? true,
    maxRetries: batch.maxRetries ?? 0,
    retryDelayMs: batch.retryDelayMs ?? 0,
    benchmark: batch.benchmark ?? false,
  };
}

export function toSingleInsertRows(row: InsertRow): Array<Record<string, unknown>> {
  return [row as Record<string, unknown>];
}
