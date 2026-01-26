/**
 * Shared state field definitions for agent patterns
 * 
 * This module provides reusable state field configurations that are common across
 * multiple agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent).
 * 
 * @module patterns/shared/state-fields
 */

import { z } from 'zod';
import type { StateChannelConfig } from '@agentforge/core';

/**
 * Standard iteration counter field
 * 
 * Tracks the current iteration number with an additive reducer.
 * Used by all patterns to count reasoning/execution loops.
 * 
 * @example
 * ```typescript
 * export const MyStateConfig = {
 *   iteration: iterationField,
 *   // ... other fields
 * };
 * ```
 */
export const iterationField = {
  schema: z.number().int().nonnegative(),
  reducer: (left: number, right: number) => left + right,
  default: () => 0,
  description: 'Current iteration number',
} satisfies StateChannelConfig<number, number>;

/**
 * Create a max iterations field with a custom default value
 * 
 * Defines the maximum number of iterations allowed before stopping.
 * Each pattern can specify its own default limit.
 * 
 * @param defaultValue - The default maximum iterations (must be positive)
 * @returns State channel config for maxIterations field
 * 
 * @example
 * ```typescript
 * export const MyStateConfig = {
 *   maxIterations: maxIterationsField(10),
 *   // ... other fields
 * };
 * ```
 */
export function maxIterationsField(defaultValue: number) {
  return {
    schema: z.number().int().positive(),
    default: () => defaultValue,
    description: 'Maximum number of iterations allowed',
  } satisfies StateChannelConfig<number, number>;
}

/**
 * Standard error field
 * 
 * Stores error messages when execution fails.
 * Optional field that's only populated on errors.
 * 
 * @example
 * ```typescript
 * export const MyStateConfig = {
 *   error: errorField,
 *   // ... other fields
 * };
 * ```
 */
export const errorField = {
  schema: z.string().optional(),
  description: 'Error message if execution failed',
} satisfies StateChannelConfig<string | undefined, string | undefined>;

/**
 * Standard response field
 * 
 * Stores the final response/output after completion.
 * Optional field that's populated when the pattern completes successfully.
 * 
 * @example
 * ```typescript
 * export const MyStateConfig = {
 *   response: responseField,
 *   // ... other fields
 * };
 * ```
 */
export const responseField = {
  schema: z.string().optional(),
  description: 'Final response after completion',
} satisfies StateChannelConfig<string | undefined, string | undefined>;

/**
 * Standard input field
 * 
 * Stores the original user input/query/task.
 * Required field with empty string default.
 * 
 * @example
 * ```typescript
 * export const MyStateConfig = {
 *   input: inputField,
 *   // ... other fields
 * };
 * ```
 */
export const inputField = {
  schema: z.string(),
  default: () => '',
  description: 'Original user input or query',
} satisfies StateChannelConfig<string, string>;

