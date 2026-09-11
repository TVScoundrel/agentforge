/**
 * Query executor for relational INSERT operations
 * @module tools/relational-insert/executor
 */

import type { SqlExecutor } from '../../query/types.js';
import type {
  InsertResult,
  InsertRow,
  RelationalInsertExecutionInput,
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

function getCauseMetadata(error: unknown): Record<string, string> {
  if (!(error instanceof Error) || !error.cause || typeof error.cause !== 'object') {
    return {};
  }

  const cause = error.cause as Record<string, unknown>;
  return {
    causeType: error.cause instanceof Error ? error.cause.name : 'object',
    ...(typeof cause.code === 'string' ? { causeCode: cause.code } : {}),
    ...(typeof cause.constraint === 'string' ? { causeConstraint: cause.constraint } : {}),
  };
}

/**
 * Execute an INSERT query using the shared query builder.
 */
export async function executeInsert(
  executor: SqlExecutor,
  input: RelationalInsertExecutionInput,
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
        executor,
        input as RelationalInsertExecutionInput & { data: InsertRow[] },
        context,
        batchOptions
      )
      : await executeInsertOnce(executor, input, context);

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
      ...getCauseMetadata(error),
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
