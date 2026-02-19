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
  relationalInsertSchema,
} from './schemas.js';

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
export type InsertReturning = z.infer<typeof insertReturningSchema>;

/**
 * Relational INSERT tool input.
 */
export type RelationalInsertInput = z.infer<typeof relationalInsertSchema>;

/**
 * INSERT execution result.
 */
export interface InsertResult {
  rowCount: number;
  insertedIds: Array<number | string>;
  rows: unknown[];
  executionTime: number;
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
