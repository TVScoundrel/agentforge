import { createLogger } from '@agentforge/core';
import type { TransactionContext } from '../../query/transaction.js';
import type {
  DeleteBatchMetadata,
  DeleteBatchOptions,
  RelationalDeleteInput,
} from './types.js';

export const deleteExecutorLogger = createLogger('agentforge:tools:data:relational:delete');

/**
 * Execution context for DELETE operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export interface DeleteExecutionContext {
  transaction?: TransactionContext;
}

export interface SingleDeleteOperation {
  where?: RelationalDeleteInput['where'];
  allowFullTableDelete?: RelationalDeleteInput['allowFullTableDelete'];
  cascade?: RelationalDeleteInput['cascade'];
  softDelete?: RelationalDeleteInput['softDelete'];
}

export interface DeleteChunkExecutionResult {
  rowCount: number;
  successfulItems: number;
  failedItems: number;
  softDeletedCount: number;
  failures: DeleteBatchMetadata['failures'];
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

export function resolveBatchOptions(batch: DeleteBatchOptions | undefined): Required<DeleteBatchOptions> | undefined {
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

export function toSingleDeleteOperation(input: RelationalDeleteInput): SingleDeleteOperation {
  return {
    where: input.where,
    allowFullTableDelete: input.allowFullTableDelete,
    cascade: input.cascade,
    softDelete: input.softDelete,
  };
}
