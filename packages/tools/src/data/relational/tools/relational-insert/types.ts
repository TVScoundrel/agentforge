/**
 * Type definitions for relational INSERT operations
 * @module tools/relational-insert/types
 */

import type { z } from 'zod';
import type {
  insertValueSchema,
  insertRowSchema,
  insertReturningModeSchema,
  insertReturningSchema,
  insertBatchOptionsSchema,
  relationalInsertSchema,
} from './schemas.js';
import type { BatchBenchmarkResult, BatchFailureDetail } from '../../query/batch-executor.js';

/**
 * Supported INSERT value type.
 */
export type InsertValue = z.infer<typeof insertValueSchema>;

/**
 * One INSERT row payload.
 */
export type InsertRow = z.infer<typeof insertRowSchema>;

/**
 * RETURNING mode.
 */
export type InsertReturningMode = z.infer<typeof insertReturningModeSchema>;

/**
 * RETURNING configuration.
 */
export type InsertReturning = z.input<typeof insertReturningSchema>;

/**
 * Batch execution configuration for INSERT.
 */
export type InsertBatchOptions = z.input<typeof insertBatchOptionsSchema>;

/**
 * Batch metadata returned by INSERT execution when batch mode is active.
 */
export interface InsertBatchMetadata {
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
 * Relational INSERT tool input.
 */
export type RelationalInsertInput = z.input<typeof relationalInsertSchema>;

/**
 * INSERT execution result.
 */
export interface InsertResult {
  rowCount: number;
  insertedIds: Array<number | string>;
  rows: unknown[];
  executionTime: number;
  batch?: InsertBatchMetadata;
}

/**
 * Tool success response.
 */
export interface InsertSuccessResponse {
  success: true;
  rowCount: number;
  insertedIds: Array<number | string>;
  rows: unknown[];
  executionTime: number;
  batch?: InsertBatchMetadata;
}

/**
 * Tool error response.
 */
export interface InsertErrorResponse {
  success: false;
  error: string;
  rowCount: 0;
  insertedIds: [];
  rows: [];
}

/**
 * Tool response (success or error).
 */
export type InsertResponse = InsertSuccessResponse | InsertErrorResponse;
