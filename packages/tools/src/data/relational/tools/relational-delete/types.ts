/**
 * Type definitions for relational DELETE operations
 * @module tools/relational-delete/types
 */

import type { z } from 'zod';
import type {
  deleteWhereOperatorSchema,
  deleteWhereConditionSchema,
  deleteSoftDeleteSchema,
  deleteBatchOperationSchema,
  deleteBatchOptionsSchema,
  relationalDeleteSchema,
} from './schemas.js';
import type { BatchBenchmarkResult, BatchFailureDetail } from '../../query/batch-executor.js';

/** Comparison operators supported in DELETE WHERE conditions. */
export type DeleteWhereOperator = z.infer<typeof deleteWhereOperatorSchema>;

/** A single WHERE condition for filtering rows in a DELETE operation. */
export type DeleteWhereCondition = z.infer<typeof deleteWhereConditionSchema>;

/** Configuration for soft-delete mode (UPDATE instead of physical DELETE). */
export type DeleteSoftDeleteOptions = z.infer<typeof deleteSoftDeleteSchema>;

/** A single operation within a batched DELETE request. */
export type DeleteBatchOperation = z.input<typeof deleteBatchOperationSchema>;

/** Options controlling batch DELETE execution behaviour. */
export type DeleteBatchOptions = z.input<typeof deleteBatchOptionsSchema>;

/** Metadata returned after a batched DELETE operation completes. */
export interface DeleteBatchMetadata {
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

/** Validated input for the relational-delete tool. */
export type RelationalDeleteInput = z.input<typeof relationalDeleteSchema>;

/** Internal result from a single or batched DELETE execution. */
export interface DeleteResult {
  rowCount: number;
  executionTime: number;
  softDeleted: boolean;
  batch?: DeleteBatchMetadata;
}

/** Successful DELETE response returned to the caller. */
export interface DeleteSuccessResponse {
  success: true;
  rowCount: number;
  executionTime: number;
  softDeleted: boolean;
  batch?: DeleteBatchMetadata;
}

/** Error DELETE response returned when the operation fails. */
export interface DeleteErrorResponse {
  success: false;
  error: string;
  rowCount: 0;
  softDeleted: false;
}

/** Union type representing either a successful or failed DELETE response. */
export type DeleteResponse = DeleteSuccessResponse | DeleteErrorResponse;
