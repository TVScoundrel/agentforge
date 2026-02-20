/**
 * Query executor for relational UPDATE operations
 * @module tools/relational-update/executor
 */

import { createLogger } from '@agentforge/core';
import { buildUpdateQuery } from '../../query/query-builder.js';
import {
  benchmarkBatchExecution,
  executeBatchedTask,
} from '../../query/batch-executor.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { TransactionContext } from '../../query/transaction.js';
import type {
  RelationalUpdateInput,
  UpdateBatchMetadata,
  UpdateBatchOperation,
  UpdateBatchOptions,
  UpdateResult,
} from './types.js';
import { getUpdateConstraintViolationMessage, isSafeUpdateValidationError } from './error-utils.js';

const logger = createLogger('agentforge:tools:data:relational:update');

export interface UpdateExecutionContext {
  transaction?: TransactionContext;
}

interface SingleUpdateOperation {
  data: NonNullable<RelationalUpdateInput['data']>;
  where?: RelationalUpdateInput['where'];
  allowFullTableUpdate?: RelationalUpdateInput['allowFullTableUpdate'];
  optimisticLock?: RelationalUpdateInput['optimisticLock'];
}

interface UpdateChunkExecutionResult {
  rowCount: number;
  successfulItems: number;
  failedItems: number;
  failures: UpdateBatchMetadata['failures'];
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

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function resolveBatchOptions(batch: UpdateBatchOptions | undefined): Required<UpdateBatchOptions> | undefined {
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

function toSingleUpdateOperation(input: RelationalUpdateInput): SingleUpdateOperation {
  if (!input.data) {
    throw new Error('UPDATE data is required when operations[] is not provided.');
  }

  return {
    data: input.data,
    where: input.where,
    allowFullTableUpdate: input.allowFullTableUpdate,
    optimisticLock: input.optimisticLock,
  };
}

async function executeSingleUpdate(
  manager: ConnectionManager,
  input: RelationalUpdateInput,
  operation: SingleUpdateOperation,
  context?: UpdateExecutionContext
): Promise<UpdateResult> {
  const built = buildUpdateQuery({
    table: input.table,
    data: operation.data,
    where: operation.where,
    allowFullTableUpdate: operation.allowFullTableUpdate,
    optimisticLock: operation.optimisticLock,
    vendor: input.vendor,
  });

  const executor = context?.transaction ?? manager;
  const rawResult = await executor.execute(built.query);
  const rowCount = normalizeAffectedRows(rawResult);

  if (built.usesOptimisticLock && rowCount === 0) {
    throw new Error('Update failed: optimistic lock check failed.');
  }

  return {
    rowCount,
    executionTime: 0,
  };
}

async function executeUpdateInBatchMode(
  manager: ConnectionManager,
  input: RelationalUpdateInput & { operations: UpdateBatchOperation[] },
  context: UpdateExecutionContext | undefined,
  options: Required<UpdateBatchOptions>
): Promise<UpdateResult> {
  const batchResult = await executeBatchedTask<UpdateBatchOperation, UpdateChunkExecutionResult>(
    {
      operation: 'update',
      items: input.operations,
      executeBatch: async (operations, batchIndex) => {
        let rowCount = 0;
        let successfulItems = 0;
        let failedItems = 0;
        const failures: UpdateBatchMetadata['failures'] = [];

        for (const operation of operations) {
          try {
            const result = await executeSingleUpdate(
              manager,
              input,
              {
                data: operation.data,
                where: operation.where,
                allowFullTableUpdate: operation.allowFullTableUpdate,
                optimisticLock: operation.optimisticLock,
              },
              context
            );

            rowCount += result.rowCount;
            successfulItems += 1;
          } catch (error) {
            if (!options.continueOnError) {
              throw error;
            }

            failedItems += 1;
            failures.push({
              operation: 'update',
              batchIndex,
              batchSize: operations.length,
              attempts: 1,
              error: toErrorMessage(error),
            });
          }
        }

        return {
          rowCount,
          successfulItems,
          failedItems,
          failures,
        };
      },
      getBatchSuccessCount: (result) => result.successfulItems,
    },
    {
      batchSize: options.batchSize,
      continueOnError: options.continueOnError,
      maxRetries: options.maxRetries,
      retryDelayMs: options.retryDelayMs,
      onProgress: (progress) => {
        logger.debug('UPDATE batch progress', {
          vendor: input.vendor,
          table: input.table,
          ...progress,
        });
      },
    }
  );

  const rowCount = batchResult.results.reduce((total, result) => total + result.rowCount, 0);
  const operationFailures = batchResult.results.flatMap((result) => result.failures);

  let benchmark: UpdateBatchMetadata['benchmark'];
  if (options.benchmark) {
    logger.warn('UPDATE batch benchmark enabled. Synthetic benchmark callbacks are side-effect free and do not execute SQL.', {
      vendor: input.vendor,
      table: input.table,
      operationCount: input.operations.length,
      batchSize: options.batchSize,
    });

    benchmark = await benchmarkBatchExecution({
      items: input.operations,
      batchSize: options.batchSize,
      runIndividual: async () => {
        // Synthetic benchmark callback for timing-only comparison.
      },
      runBatch: async () => {
        // Synthetic benchmark callback for timing-only comparison.
      },
    });
  }

  return {
    rowCount,
    executionTime: batchResult.executionTime,
    batch: {
      enabled: true,
      batchSize: options.batchSize,
      totalItems: batchResult.totalItems,
      processedItems: batchResult.processedItems,
      successfulItems: batchResult.successfulItems,
      failedItems: batchResult.failedItems,
      totalBatches: batchResult.totalBatches,
      retries: batchResult.retries,
      partialSuccess: batchResult.partialSuccess,
      failures: [...batchResult.failures, ...operationFailures],
      benchmark,
    },
  };
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

    logger.debug('UPDATE query executed successfully', {
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
