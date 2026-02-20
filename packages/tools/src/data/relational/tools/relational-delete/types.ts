/**
 * Type definitions for relational DELETE operations
 * @module tools/relational-delete/types
 */

import type { z } from 'zod';
import type {
  deleteWhereOperatorSchema,
  deleteWhereConditionSchema,
  deleteSoftDeleteSchema,
  relationalDeleteSchema,
} from './schemas.js';

export type DeleteWhereOperator = z.infer<typeof deleteWhereOperatorSchema>;
export type DeleteWhereCondition = z.infer<typeof deleteWhereConditionSchema>;
export type DeleteSoftDeleteOptions = z.infer<typeof deleteSoftDeleteSchema>;

export type RelationalDeleteInput = z.infer<typeof relationalDeleteSchema>;

export interface DeleteResult {
  rowCount: number;
  executionTime: number;
  softDeleted: boolean;
}

export interface DeleteSuccessResponse {
  success: true;
  rowCount: number;
  executionTime: number;
  softDeleted: boolean;
}

export interface DeleteErrorResponse {
  success: false;
  error: string;
  rowCount: 0;
  softDeleted: false;
}

export type DeleteResponse = DeleteSuccessResponse | DeleteErrorResponse;
