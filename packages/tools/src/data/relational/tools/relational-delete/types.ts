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

export type DeleteWhereOperator = z.infer<typeof deleteWhereOperatorSchema>;
export type DeleteWhereCondition = z.infer<typeof deleteWhereConditionSchema>;
export type DeleteSoftDeleteOptions = z.infer<typeof deleteSoftDeleteSchema>;
export type DeleteBatchOperation = z.input<typeof deleteBatchOperationSchema>;
export type DeleteBatchOptions = z.input<typeof deleteBatchOptionsSchema>;

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

export type RelationalDeleteInput = z.input<typeof relationalDeleteSchema>;

export interface DeleteResult {
  rowCount: number;
  executionTime: number;
  softDeleted: boolean;
  batch?: DeleteBatchMetadata;
}

export interface DeleteSuccessResponse {
  success: true;
  rowCount: number;
  executionTime: number;
  softDeleted: boolean;
  batch?: DeleteBatchMetadata;
}

export interface DeleteErrorResponse {
  success: false;
  error: string;
  rowCount: 0;
  softDeleted: false;
}

export type DeleteResponse = DeleteSuccessResponse | DeleteErrorResponse;
