import { createLogger } from '@agentforge/core';
import type { RelationalMutationExecutionContext } from '../mutation-execution.js';
import type {
  DeleteBatchMetadata,
  RelationalDeleteExecutionInput,
} from './types.js';

export const deleteExecutorLogger = createLogger('agentforge:tools:data:relational:delete');

/**
 * Execution context for DELETE operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export type DeleteExecutionContext = RelationalMutationExecutionContext;

export interface SingleDeleteOperation {
  where?: RelationalDeleteExecutionInput['where'];
  allowFullTableDelete?: RelationalDeleteExecutionInput['allowFullTableDelete'];
  cascade?: RelationalDeleteExecutionInput['cascade'];
  softDelete?: RelationalDeleteExecutionInput['softDelete'];
}

export interface DeleteChunkExecutionResult {
  rowCount: number;
  successfulItems: number;
  failedItems: number;
  softDeletedCount: number;
  failures: DeleteBatchMetadata['failures'];
}

export function toSingleDeleteOperation(input: RelationalDeleteExecutionInput): SingleDeleteOperation {
  return {
    where: input.where,
    allowFullTableDelete: input.allowFullTableDelete,
    cascade: input.cascade,
    softDelete: input.softDelete,
  };
}
