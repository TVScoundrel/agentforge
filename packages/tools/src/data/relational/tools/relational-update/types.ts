/**
 * Type definitions for relational UPDATE operations
 * @module tools/relational-update/types
 */

import type { z } from 'zod';
import type {
  updateValueSchema,
  updateDataSchema,
  updateWhereOperatorSchema,
  updateWhereConditionSchema,
  updateOptimisticLockSchema,
  updateBatchOperationSchema,
  updateBatchOptionsSchema,
  relationalUpdateSchema,
} from './schemas.js';
import type { BatchBenchmarkResult, BatchFailureDetail } from '../../query/batch-executor.js';

/**
 * Supported UPDATE value type.
 */
export type UpdateValue = z.infer<typeof updateValueSchema>;

/**
 * UPDATE payload object.
 */
export type UpdateData = z.infer<typeof updateDataSchema>;

/**
 * WHERE operator for UPDATE conditions.
 */
export type UpdateWhereOperator = z.infer<typeof updateWhereOperatorSchema>;

/**
 * WHERE condition for UPDATE query.
 */
export type UpdateWhereCondition = z.infer<typeof updateWhereConditionSchema>;

/**
 * Optimistic lock definition.
 */
export type UpdateOptimisticLock = z.infer<typeof updateOptimisticLockSchema>;

/**
 * One batch UPDATE operation payload.
 */
export type UpdateBatchOperation = z.input<typeof updateBatchOperationSchema>;

/**
 * Batch execution options for UPDATE.
 */
export type UpdateBatchOptions = z.input<typeof updateBatchOptionsSchema>;

/**
 * Batch metadata returned by UPDATE execution when batch mode is active.
 */
export interface UpdateBatchMetadata {
  enabled: boolean;
  batchSize: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  totalBatches: number;
  retries: number;
  partialSuccess: boolean;
  failures: BatchFailureDetail[];
  benchmark?: BatchBenchmarkResult;
}

/**
 * Relational UPDATE tool input.
 */
export type RelationalUpdateInput = z.input<typeof relationalUpdateSchema>;

/**
 * UPDATE execution result.
 */
export interface UpdateResult {
  rowCount: number;
  executionTime: number;
  batch?: UpdateBatchMetadata;
}

/**
 * Tool success response.
 */
export interface UpdateSuccessResponse {
  success: true;
  rowCount: number;
  executionTime: number;
  batch?: UpdateBatchMetadata;
}

/**
 * Tool error response.
 */
export interface UpdateErrorResponse {
  success: false;
  error: string;
  rowCount: 0;
}

/**
 * Tool response (success or error).
 */
export type UpdateResponse = UpdateSuccessResponse | UpdateErrorResponse;
