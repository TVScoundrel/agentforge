/**
 * Type definitions for relational SELECT operations
 * @module tools/relational-select/types
 */

import type { z } from 'zod';
import type {
  StreamingBenchmarkResult,
  StreamingMemoryUsage as QueryStreamingMemoryUsage,
} from '../../query/index.js';
import type { 
  whereOperatorSchema, 
  whereConditionSchema, 
  orderDirectionSchema, 
  orderBySchema, 
  streamingOptionsSchema,
  relationalSelectSchema 
} from './schemas.js';

/**
 * WHERE condition operator types
 */
export type WhereOperator = z.infer<typeof whereOperatorSchema>;

/**
 * WHERE condition
 */
export type WhereCondition = z.infer<typeof whereConditionSchema>;

/**
 * ORDER BY direction
 */
export type OrderDirection = z.infer<typeof orderDirectionSchema>;

/**
 * ORDER BY clause
 */
export type OrderBy = z.infer<typeof orderBySchema>;

/**
 * Streaming options
 */
export type StreamingOptions = z.input<typeof streamingOptionsSchema>;

export type StreamingMemoryUsage = QueryStreamingMemoryUsage;

/**
 * Optional streaming benchmark metadata.
 */
export type StreamingBenchmarkMetadata = StreamingBenchmarkResult;

/**
 * Streaming execution metadata.
 */
export interface StreamingMetadata {
  enabled: true;
  chunkSize: number;
  chunkCount: number;
  sampledRowCount: number;
  streamedRowCount: number;
  cancelled: boolean;
  memoryUsage: StreamingMemoryUsage;
  benchmark?: StreamingBenchmarkMetadata;
}

/**
 * Relational SELECT tool input
 */
export type RelationalSelectInput = z.input<typeof relationalSelectSchema>;

/**
 * SELECT query execution result
 */
export interface SelectResult {
  rows: unknown[];
  rowCount: number;
  executionTime: number;
  streaming?: StreamingMetadata;
}

/**
 * Tool success response
 */
export interface SelectSuccessResponse {
  success: true;
  rows: unknown[];
  rowCount: number;
  executionTime: number;
  streaming?: StreamingMetadata;
}

/**
 * Tool error response
 */
export interface SelectErrorResponse {
  success: false;
  error: string;
  rows: [];
  rowCount: 0;
}

/**
 * Tool response (success or error)
 */
export type SelectResponse = SelectSuccessResponse | SelectErrorResponse;
