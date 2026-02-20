/**
 * Query executor for relational DELETE operations
 * @module tools/relational-delete/executor
 */

import { createLogger } from '@agentforge/core';
import { buildDeleteQuery } from '../../query/query-builder.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { RelationalDeleteInput, DeleteResult } from './types.js';
import { getDeleteConstraintViolationMessage, isSafeDeleteValidationError } from './error-utils.js';

const logger = createLogger('agentforge:tools:data:relational:delete');

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeAffectedRows(result: unknown): number {
  if (Array.isArray(result)) {
    if (result.length > 0 && result[0] && typeof result[0] === 'object') {
      const first = result[0] as Record<string, unknown>;
      const affectedRows = toNumber(first.affectedRows) ?? toNumber(first.rowCount) ?? toNumber(first.changes);
      if (affectedRows !== undefined) {
        return affectedRows;
      }
    }
    return result.length;
  }

  if (result && typeof result === 'object') {
    const resultRecord = result as Record<string, unknown>;
    return toNumber(resultRecord.rowCount)
      ?? toNumber(resultRecord.affectedRows)
      ?? toNumber(resultRecord.changes)
      ?? (Array.isArray(resultRecord.rows) ? resultRecord.rows.length : 0);
  }

  return 0;
}

/**
 * Execute a DELETE query using the shared query builder.
 */
export async function executeDelete(
  manager: ConnectionManager,
  input: RelationalDeleteInput
): Promise<DeleteResult> {
  const startTime = Date.now();

  logger.debug('Building DELETE query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where?.length,
    allowFullTableDelete: input.allowFullTableDelete,
    cascade: input.cascade,
    softDelete: !!input.softDelete,
  });

  try {
    const built = buildDeleteQuery({
      table: input.table,
      where: input.where,
      allowFullTableDelete: input.allowFullTableDelete,
      softDelete: input.softDelete,
      vendor: input.vendor,
    });

    const rawResult = await manager.execute(built.query);
    const rowCount = normalizeAffectedRows(rawResult);
    const executionTime = Date.now() - startTime;

    logger.debug('DELETE query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount,
      executionTime,
      softDelete: built.usesSoftDelete,
      cascade: input.cascade,
    });

    return {
      rowCount,
      executionTime,
      softDeleted: built.usesSoftDelete,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error('DELETE query execution failed', {
      vendor: input.vendor,
      table: input.table,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
      cascade: input.cascade,
      softDelete: !!input.softDelete,
    });

    const constraintMessage = getDeleteConstraintViolationMessage(error, input.cascade);
    if (constraintMessage) {
      throw new Error(constraintMessage, { cause: error });
    }

    if (isSafeDeleteValidationError(error)) {
      throw error;
    }

    throw new Error('DELETE query failed. See logs for details.', { cause: error });
  }
}
