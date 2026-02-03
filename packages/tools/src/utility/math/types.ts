/**
 * Math Operations Tools - Type Definitions
 */

import { z } from 'zod';

/**
 * Schema for calculator tool
 */
export const CalculatorSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'modulo']).describe('Mathematical operation to perform'),
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
});

/**
 * Schema for math functions tool
 */
export const MathFunctionsSchema = z.object({
  function: z.enum(['sqrt', 'abs', 'round', 'floor', 'ceil', 'sin', 'cos', 'tan', 'log', 'exp']).describe('Mathematical function to apply'),
  value: z.number().describe('Input value'),
});

/**
 * Schema for random number tool
 */
export const RandomNumberSchema = z.object({
  min: z.number().default(0).describe('Minimum value (inclusive)'),
  max: z.number().default(1).describe('Maximum value (exclusive for decimals, inclusive for integers)'),
  integer: z.boolean().default(false).describe('Generate an integer (true) or decimal (false)'),
});

/**
 * Schema for statistics tool
 */
export const StatisticsSchema = z.object({
  numbers: z.array(z.number().describe("Number value")).describe('Array of numbers to analyze'),
});

/**
 * Configuration for math operations tools
 */
export interface MathOperationsConfig {
  // Future: Add configuration options if needed
}

export type CalculatorInput = z.infer<typeof CalculatorSchema>;
export type MathFunctionsInput = z.infer<typeof MathFunctionsSchema>;
export type RandomNumberInput = z.infer<typeof RandomNumberSchema>;
export type StatisticsInput = z.infer<typeof StatisticsSchema>;

