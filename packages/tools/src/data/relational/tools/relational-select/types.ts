/**
 * Type definitions for relational SELECT operations
 * @module tools/relational-select/types
 */

import type { z } from 'zod';
import type { 
  whereOperatorSchema, 
  whereConditionSchema, 
  orderDirectionSchema, 
  orderBySchema, 
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
 * Relational SELECT tool input
 */
export type RelationalSelectInput = z.infer<typeof relationalSelectSchema>;

/**
 * SELECT query execution result
 */
export interface SelectResult {
  rows: unknown[];
  rowCount: number;
  executionTime: number;
}

/**
 * Tool success response
 */
export interface SelectSuccessResponse {
  success: true;
  rows: unknown[];
  rowCount: number;
  executionTime: number;
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

