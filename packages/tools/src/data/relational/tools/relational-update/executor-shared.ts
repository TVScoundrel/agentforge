import { createLogger } from '@agentforge/core';
import type { TransactionContext } from '../../query/transaction.js';
import type {
  RelationalUpdateInput,
  UpdateBatchMetadata,
  UpdateBatchOptions,
} from './types.js';

export const updateExecutorLogger = createLogger('agentforge:tools:data:relational:update');

/**
 * Execution context for UPDATE operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export interface UpdateExecutionContext {
  transaction?: TransactionContext;
}

export interface SingleUpdateOperation {
  data: NonNullable<RelationalUpdateInput['data']>;
  where?: RelationalUpdateInput['where'];
  allowFullTableUpdate?: RelationalUpdateInput['allowFullTableUpdate'];
  optimisticLock?: RelationalUpdateInput['optimisticLock'];
}

export interface UpdateChunkExecutionResult {
  rowCount: number;
  successfulItems: number;
  failedItems: number;
  failures: UpdateBatchMetadata['failures'];
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function normalizeAffectedRows(result: unknown): number {
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

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function resolveBatchOptions(batch: UpdateBatchOptions | undefined): Required<UpdateBatchOptions> | undefined {
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

export function toSingleUpdateOperation(input: RelationalUpdateInput): SingleUpdateOperation {
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
