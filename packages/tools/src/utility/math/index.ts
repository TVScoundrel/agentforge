/**
 * Math Operations Tools
 * 
 * Tools for mathematical calculations and operations.
 */

import { createCalculatorTool } from './tools/calculator.js';
import { createMathFunctionsTool } from './tools/math-functions.js';
import { createRandomNumberTool } from './tools/random-number.js';
import { createStatisticsTool } from './tools/statistics.js';
import type { MathOperationsConfig } from './types.js';

// Default tool instances
export const calculator = createCalculatorTool();
export const mathFunctions = createMathFunctionsTool();
export const randomNumber = createRandomNumberTool();
export const statistics = createStatisticsTool();

// Tools array
export const mathOperationTools = [
  calculator,
  mathFunctions,
  randomNumber,
  statistics,
];

/**
 * Create math operation tools with optional configuration
 */
export function createMathOperationTools(config: MathOperationsConfig = {}) {
  return [
    createCalculatorTool(),
    createMathFunctionsTool(),
    createRandomNumberTool(),
    createStatisticsTool(),
  ];
}

// Re-export types
export * from './types.js';

// Re-export tool factory functions
export { createCalculatorTool } from './tools/calculator.js';
export { createMathFunctionsTool } from './tools/math-functions.js';
export { createRandomNumberTool } from './tools/random-number.js';
export { createStatisticsTool } from './tools/statistics.js';

