/**
 * Query executor for relational DELETE operations
 * @module tools/relational-delete/executor
 */

import type { SqlExecutor } from '../../query/types.js';
import type {
  DeleteBatchOperation,
  DeleteResult,
  RelationalDeleteExecutionInput,
} from './types.js';
import { getDeleteConstraintViolationMessage, isSafeDeleteValidationError } from './error-utils.js';
import { executeDeleteInBatchMode } from './executor-batch.js';
import {
  deleteExecutorLogger,
  resolveBatchOptions,
  toSingleDeleteOperation,
  type DeleteExecutionContext,
} from './executor-shared.js';
import { executeSingleDelete } from './executor-single.js';

export type { DeleteExecutionContext } from './executor-shared.js';

/**
 * Execute a DELETE query using the shared query builder.
 */
export async function executeDelete(
  executor: SqlExecutor,
  input: RelationalDeleteExecutionInput,
  context?: DeleteExecutionContext
): Promise<DeleteResult> {
  const startTime = Date.now();

  deleteExecutorLogger.debug('Building DELETE query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where?.length,
    ...(input.allowFullTableDelete !== undefined ? { allowFullTableDelete: input.allowFullTableDelete } : {}),
    ...(input.cascade !== undefined ? { cascade: input.cascade } : {}),
    softDelete: !!input.softDelete,
    operationCount: input.operations?.length ?? 0,
    batchModeEnabled: !!input.batch?.enabled,
  });

  try {
    const batchOptions = resolveBatchOptions(input.batch);

    const result = input.operations && batchOptions
      ? await executeDeleteInBatchMode(
        executor,
        input as RelationalDeleteExecutionInput & { operations: DeleteBatchOperation[] },
        context,
        batchOptions
      )
      : await executeSingleDelete(executor, input, toSingleDeleteOperation(input), context);

    const executionTime = Date.now() - startTime;

    deleteExecutorLogger.debug('DELETE query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount: result.rowCount,
      executionTime,
      softDelete: result.softDeleted,
      ...(input.cascade !== undefined ? { cascade: input.cascade } : {}),
      batchMode: !!result.batch,
      partialSuccess: result.batch?.partialSuccess ?? false,
    });

    return {
      ...result,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    deleteExecutorLogger.error('DELETE query execution failed', {
      vendor: input.vendor,
      table: input.table,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
      ...(input.cascade !== undefined ? { cascade: input.cascade } : {}),
      softDelete: !!input.softDelete,
    });

    const constraintMessage = getDeleteConstraintViolationMessage(error, input.cascade ?? false);
    if (constraintMessage) {
      throw new Error(constraintMessage, { cause: error });
    }

    if (isSafeDeleteValidationError(error)) {
      throw error;
    }

    throw new Error('DELETE query failed. See logs for details.', { cause: error });
  }
}
