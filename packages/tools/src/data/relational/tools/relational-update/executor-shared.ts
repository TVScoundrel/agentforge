import { createLogger } from '@agentforge/core';
import type { RelationalMutationExecutionContext } from '../mutation-execution.js';
import type {
  RelationalUpdateExecutionInput,
  UpdateBatchMetadata,
} from './types.js';

export const updateExecutorLogger = createLogger('agentforge:tools:data:relational:update');

/**
 * Execution context for UPDATE operations.
 *
 * @property transaction - Optional active transaction to execute within
 */
export type UpdateExecutionContext = RelationalMutationExecutionContext;

export interface SingleUpdateOperation {
  data: NonNullable<RelationalUpdateExecutionInput['data']>;
  where?: RelationalUpdateExecutionInput['where'];
  allowFullTableUpdate?: RelationalUpdateExecutionInput['allowFullTableUpdate'];
  optimisticLock?: RelationalUpdateExecutionInput['optimisticLock'];
}

export interface UpdateChunkExecutionResult {
  rowCount: number;
  successfulItems: number;
  failedItems: number;
  failures: UpdateBatchMetadata['failures'];
}

export function toSingleUpdateOperation(input: RelationalUpdateExecutionInput): SingleUpdateOperation {
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
