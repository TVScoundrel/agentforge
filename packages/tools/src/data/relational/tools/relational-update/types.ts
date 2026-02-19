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
  relationalUpdateSchema,
} from './schemas.js';

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
 * Relational UPDATE tool input.
 */
export type RelationalUpdateInput = z.infer<typeof relationalUpdateSchema>;

/**
 * UPDATE execution result.
 */
export interface UpdateResult {
  rowCount: number;
  executionTime: number;
}

/**
 * Tool success response.
 */
export interface UpdateSuccessResponse {
  success: true;
  rowCount: number;
  executionTime: number;
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
