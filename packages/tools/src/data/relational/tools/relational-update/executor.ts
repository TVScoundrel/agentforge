/**
 * Query executor for relational UPDATE operations
 * @module tools/relational-update/executor
 */

import type { ConnectionManager } from '../../connection/connection-manager.js';
import type {
  RelationalUpdateInput,
  UpdateBatchOperation,
  UpdateResult,
} from './types.js';
import { getUpdateConstraintViolationMessage, isSafeUpdateValidationError } from './error-utils.js';
import { executeUpdateInBatchMode } from './executor-batch.js';
import {
  resolveBatchOptions,
  toSingleUpdateOperation,
  updateExecutorLogger,
  type UpdateExecutionContext,
} from './executor-shared.js';
import { executeSingleUpdate } from './executor-single.js';

export type { UpdateExecutionContext } from './executor-shared.js';

/**
 * Execute an UPDATE query using the shared query builder.
 */
export async function executeUpdate(
  manager: ConnectionManager,
  input: RelationalUpdateInput,
  context?: UpdateExecutionContext
): Promise<UpdateResult> {
  const startTime = Date.now();

  updateExecutorLogger.debug('Building UPDATE query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where?.length,
    ...(input.allowFullTableUpdate !== undefined ? { allowFullTableUpdate: input.allowFullTableUpdate } : {}),
    hasOptimisticLock: !!input.optimisticLock,
    operationCount: input.operations?.length ?? 0,
    batchModeEnabled: !!input.batch?.enabled,
  });

  try {
    const batchOptions = resolveBatchOptions(input.batch);

    const result = input.operations && batchOptions
      ? await executeUpdateInBatchMode(
        manager,
        input as RelationalUpdateInput & { operations: UpdateBatchOperation[] },
        context,
        batchOptions
      )
      : await executeSingleUpdate(manager, input, toSingleUpdateOperation(input), context);

    const executionTime = Date.now() - startTime;

    updateExecutorLogger.debug('UPDATE query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount: result.rowCount,
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

    updateExecutorLogger.error('UPDATE query execution failed', {
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
