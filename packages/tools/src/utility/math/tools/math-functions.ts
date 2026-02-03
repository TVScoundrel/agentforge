/**
 * Math Functions Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { MathFunctionsSchema } from '../types.js';

/**
 * Create math functions tool
 */
export function createMathFunctionsTool() {
  return toolBuilder()
    .name('math-functions')
    .description('Apply mathematical functions: sqrt, abs, round, floor, ceil, sin, cos, tan, log, exp.')
    .category(ToolCategory.UTILITY)
    .tags(['math', 'functions', 'trigonometry'])
    .schema(MathFunctionsSchema)
    .implement(async (input) => {
      let result: number;
      
      try {
        switch (input.function) {
          case 'sqrt':
            result = Math.sqrt(input.value);
            break;
          case 'abs':
            result = Math.abs(input.value);
            break;
          case 'round':
            result = Math.round(input.value);
            break;
          case 'floor':
            result = Math.floor(input.value);
            break;
          case 'ceil':
            result = Math.ceil(input.value);
            break;
          case 'sin':
            result = Math.sin(input.value);
            break;
          case 'cos':
            result = Math.cos(input.value);
            break;
          case 'tan':
            result = Math.tan(input.value);
            break;
          case 'log':
            result = Math.log(input.value);
            break;
          case 'exp':
            result = Math.exp(input.value);
            break;
          default:
            return {
              success: false,
              error: 'Unknown function',
            };
        }
        
        if (isNaN(result) || !isFinite(result)) {
          return {
            success: false,
            error: 'Invalid result (NaN or Infinity)',
          };
        }
        
        return {
          success: true,
          result,
          function: input.function,
          input: input.value,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Math operation failed',
        };
      }
    })
    .build();
}

