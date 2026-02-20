/**
 * Query executor for relational UPDATE operations
 * @module tools/relational-update/executor
 */

import { createLogger } from '@agentforge/core';
import { buildUpdateQuery } from '../../query/query-builder.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { TransactionContext } from '../../query/transaction.js';
import type { RelationalUpdateInput, UpdateResult } from './types.js';
import { getUpdateConstraintViolationMessage, isSafeUpdateValidationError } from './error-utils.js';

const logger = createLogger('agentforge:tools:data:relational:update');

export interface UpdateExecutionContext {
  transaction?: TransactionContext;
}

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
 * Execute an UPDATE query using the shared query builder.
 */
export async function executeUpdate(
  manager: ConnectionManager,
  input: RelationalUpdateInput,
  context?: UpdateExecutionContext
): Promise<UpdateResult> {
  const startTime = Date.now();

  logger.debug('Building UPDATE query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where?.length,
    allowFullTableUpdate: input.allowFullTableUpdate,
    hasOptimisticLock: !!input.optimisticLock,
  });

  try {
    const built = buildUpdateQuery({
      table: input.table,
      data: input.data,
      where: input.where,
      allowFullTableUpdate: input.allowFullTableUpdate,
      optimisticLock: input.optimisticLock,
      vendor: input.vendor,
    });

    const executor = context?.transaction ?? manager;
    const rawResult = await executor.execute(built.query);
    const rowCount = normalizeAffectedRows(rawResult);
    const executionTime = Date.now() - startTime;

    if (built.usesOptimisticLock && rowCount === 0) {
      throw new Error('Update failed: optimistic lock check failed.');
    }

    logger.debug('UPDATE query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount,
      executionTime,
    });

    return {
      rowCount,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error('UPDATE query execution failed', {
      vendor: input.vendor,
      table: input.table,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
    });

    const constraintMessage = getUpdateConstraintViolationMessage(error);
    if (constraintMessage) {
      throw new Error(constraintMessage, { cause: error });
    }

    if (isSafeUpdateValidationError(error)) {
      throw error;
    }

    throw new Error('UPDATE query failed. See logs for details.', { cause: error });
  }
}
