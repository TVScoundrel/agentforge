/**
 * Query executor for relational INSERT operations
 * @module tools/relational-insert/executor
 */

import { createLogger } from '@agentforge/core';
import { buildInsertQuery } from '../../query/query-builder.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { InsertResult, RelationalInsertInput } from './types.js';
import { getConstraintViolationMessage, isSafeInsertValidationError } from './error-utils.js';

const logger = createLogger('agentforge:tools:data:relational:insert');

interface NormalizedExecutionResult {
  rows: unknown[];
  rowCount: number;
  insertId?: number;
  lastInsertRowid?: number;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeExecutionResult(result: unknown): NormalizedExecutionResult {
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

function deriveInsertedIds(options: {
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

/**
 * Execute an INSERT query using the shared query builder.
 */
export async function executeInsert(
  manager: ConnectionManager,
  input: RelationalInsertInput
): Promise<InsertResult> {
  const startTime = Date.now();

  logger.debug('Building INSERT query', {
    vendor: input.vendor,
    table: input.table,
    isBatch: Array.isArray(input.data),
    returningMode: input.returning?.mode ?? 'none',
  });

  try {
    const built = buildInsertQuery({
      table: input.table,
      data: input.data,
      returning: input.returning,
      vendor: input.vendor,
    });

    const rawResult = await manager.execute(built.query);
    const normalized = normalizeExecutionResult(rawResult);
    const executionTime = Date.now() - startTime;

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

    logger.debug('INSERT query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount,
      returnedRows: rows.length,
      returnedIds: insertedIds.length,
      executionTime,
    });

    return {
      rowCount,
      rows,
      insertedIds,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error('INSERT query execution failed', {
      vendor: input.vendor,
      table: input.table,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
    });

    const constraintMessage = getConstraintViolationMessage(error);
    if (constraintMessage) {
      throw new Error(constraintMessage, { cause: error });
    }

    if (isSafeInsertValidationError(error)) {
      throw error;
    }

    throw new Error('INSERT query failed. See logs for details.', { cause: error });
  }
}
