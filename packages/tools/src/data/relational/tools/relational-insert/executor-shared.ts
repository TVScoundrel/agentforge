import { createLogger } from '@agentforge/core';
import type { RelationalMutationExecutionContext } from '../mutation-execution.js';
import type { InsertRow } from './types.js';

export const insertExecutorLogger = createLogger('agentforge:tools:data:relational:insert');

/**
 * Execution context for INSERT operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export type InsertExecutionContext = RelationalMutationExecutionContext;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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

export function toSingleInsertRows(row: InsertRow): Array<Record<string, unknown>> {
  return [row as Record<string, unknown>];
}
