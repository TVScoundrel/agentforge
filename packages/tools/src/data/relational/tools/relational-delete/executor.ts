/**
 * Query executor for relational DELETE operations
 * @module tools/relational-delete/executor
 */

import { createLogger } from '@agentforge/core';
import { buildDeleteQuery } from '../../query/query-builder.js';
import {
  benchmarkBatchExecution,
  executeBatchedTask,
} from '../../query/batch-executor.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { TransactionContext } from '../../query/transaction.js';
import type {
  DeleteBatchMetadata,
  DeleteBatchOperation,
  DeleteBatchOptions,
  DeleteResult,
  RelationalDeleteInput,
} from './types.js';
import { getDeleteConstraintViolationMessage, isSafeDeleteValidationError } from './error-utils.js';

const logger = createLogger('agentforge:tools:data:relational:delete');

/**
 * Execution context for DELETE operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export interface DeleteExecutionContext {
  transaction?: TransactionContext;
}

interface SingleDeleteOperation {
  where?: RelationalDeleteInput['where'];
  allowFullTableDelete?: RelationalDeleteInput['allowFullTableDelete'];
  cascade?: RelationalDeleteInput['cascade'];
  softDelete?: RelationalDeleteInput['softDelete'];
}

interface DeleteChunkExecutionResult {
  rowCount: number;
  successfulItems: number;
  failedItems: number;
  softDeletedCount: number;
  failures: DeleteBatchMetadata['failures'];
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

function resolveBatchOptions(batch: DeleteBatchOptions | undefined): Required<DeleteBatchOptions> | undefined {
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

function toSingleDeleteOperation(input: RelationalDeleteInput): SingleDeleteOperation {
  return {
    where: input.where,
    allowFullTableDelete: input.allowFullTableDelete,
    cascade: input.cascade,
    softDelete: input.softDelete,
  };
}

async function executeSingleDelete(
  manager: ConnectionManager,
  input: RelationalDeleteInput,
  operation: SingleDeleteOperation,
  context?: DeleteExecutionContext
): Promise<DeleteResult> {
  const built = buildDeleteQuery({
    table: input.table,
    where: operation.where,
    allowFullTableDelete: operation.allowFullTableDelete,
    softDelete: operation.softDelete,
    vendor: input.vendor,
  });

  const executor = context?.transaction ?? manager;
  const rawResult = await executor.execute(built.query);
  const rowCount = normalizeAffectedRows(rawResult);

  return {
    rowCount,
    executionTime: 0,
    softDeleted: built.usesSoftDelete,
  };
}

async function executeDeleteInBatchMode(
  manager: ConnectionManager,
  input: RelationalDeleteInput & { operations: DeleteBatchOperation[] },
  context: DeleteExecutionContext | undefined,
  options: Required<DeleteBatchOptions>
): Promise<DeleteResult> {
  const batchResult = await executeBatchedTask<DeleteBatchOperation, DeleteChunkExecutionResult>(
    {
      operation: 'delete',
      items: input.operations,
      executeBatch: async (operations, batchIndex) => {
        let rowCount = 0;
        let successfulItems = 0;
        let failedItems = 0;
        let softDeletedCount = 0;
        const failures: DeleteBatchMetadata['failures'] = [];

        for (const operation of operations) {
          try {
            const result = await executeSingleDelete(
              manager,
              input,
              {
                where: operation.where,
                allowFullTableDelete: operation.allowFullTableDelete,
                cascade: operation.cascade,
                softDelete: operation.softDelete,
              },
              context
            );

            rowCount += result.rowCount;
            successfulItems += 1;
            if (result.softDeleted) {
              softDeletedCount += 1;
            }
          } catch (error) {
            if (!options.continueOnError) {
              throw error;
            }

            failedItems += 1;
            failures.push({
              operation: 'delete',
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
          softDeletedCount,
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
        logger.debug('DELETE batch progress', {
          vendor: input.vendor,
          table: input.table,
          ...progress,
        });
      },
    }
  );

  const rowCount = batchResult.results.reduce((total, result) => total + result.rowCount, 0);
  const softDeleted = batchResult.results.some((result) => result.softDeletedCount > 0);
  const operationFailures = batchResult.results.flatMap((result) => result.failures);

  let benchmark: DeleteBatchMetadata['benchmark'];
  if (options.benchmark) {
    logger.warn('DELETE batch benchmark enabled. Synthetic benchmark callbacks are side-effect free and do not execute SQL.', {
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
    softDeleted,
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
 * Execute a DELETE query using the shared query builder.
 */
export async function executeDelete(
  manager: ConnectionManager,
  input: RelationalDeleteInput,
  context?: DeleteExecutionContext
): Promise<DeleteResult> {
  const startTime = Date.now();

  logger.debug('Building DELETE query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where?.length,
    allowFullTableDelete: input.allowFullTableDelete,
    cascade: input.cascade,
    softDelete: !!input.softDelete,
    operationCount: input.operations?.length ?? 0,
    batchModeEnabled: !!input.batch?.enabled,
  });

  try {
    const batchOptions = resolveBatchOptions(input.batch);

    const result = input.operations && batchOptions
      ? await executeDeleteInBatchMode(
        manager,
        input as RelationalDeleteInput & { operations: DeleteBatchOperation[] },
        context,
        batchOptions
      )
      : await executeSingleDelete(manager, input, toSingleDeleteOperation(input), context);

    const executionTime = Date.now() - startTime;

    logger.debug('DELETE query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount: result.rowCount,
      executionTime,
      softDelete: result.softDeleted,
      cascade: input.cascade,
      batchMode: !!result.batch,
      partialSuccess: result.batch?.partialSuccess ?? false,
    });

    return {
      ...result,
      executionTime,
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
