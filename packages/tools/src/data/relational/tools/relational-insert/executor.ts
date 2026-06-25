/**
 * Query executor for relational INSERT operations
 * @module tools/relational-insert/executor
 */

import type { ConnectionManager } from '../../connection/connection-manager.js';
import type {
  InsertResult,
  InsertRow,
  RelationalInsertInput,
} from './types.js';
import { getConstraintViolationMessage, isSafeInsertValidationError } from './error-utils.js';
import { executeInsertInBatchMode } from './executor-batch.js';
import {
  insertExecutorLogger,
  resolveBatchOptions,
  type InsertExecutionContext,
} from './executor-shared.js';
import { executeInsertOnce } from './executor-single.js';

export type { InsertExecutionContext } from './executor-shared.js';

/**
 * Execute an INSERT query using the shared query builder.
 */
export async function executeInsert(
  manager: ConnectionManager,
  input: RelationalInsertInput,
  context?: InsertExecutionContext
): Promise<InsertResult> {
  const startTime = Date.now();

  insertExecutorLogger.debug('Building INSERT query', {
    vendor: input.vendor,
    table: input.table,
    isBatch: Array.isArray(input.data),
    batchModeEnabled: !!input.batch?.enabled,
    returningMode: input.returning?.mode ?? 'none',
  });

  try {
    const batchOptions = resolveBatchOptions(input.batch);

    const result = Array.isArray(input.data) && batchOptions
      ? await executeInsertInBatchMode(
        manager,
        input as RelationalInsertInput & { data: InsertRow[] },
        context,
        batchOptions
      )
      : await executeInsertOnce(manager, input, context);

    const executionTime = Date.now() - startTime;

    insertExecutorLogger.debug('INSERT query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount: result.rowCount,
      returnedRows: result.rows.length,
      returnedIds: result.insertedIds.length,
      executionTime,
      batchMode: !!result.batch,
      partialSuccess: result.batch?.partialSuccess ?? false,
    });

    return {
      ...result,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    insertExecutorLogger.error('INSERT query execution failed', {
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
