/**
 * Math Operations Tools
 * 
 * Tools for mathematical calculations and operations.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

/**
 * Calculator tool
 */
export const calculator = toolBuilder()
  .name('calculator')
  .description('Perform basic arithmetic operations: add, subtract, multiply, divide, power, modulo.')
  .category(ToolCategory.UTILITY)
  .tags(['math', 'calculator', 'arithmetic'])
  .schema(z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'modulo']).describe('Mathematical operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async (input) => {
    let result: number;
    
    switch (input.operation) {
      case 'add':
        result = input.a + input.b;
        break;
      case 'subtract':
        result = input.a - input.b;
        break;
      case 'multiply':
        result = input.a * input.b;
        break;
      case 'divide':
        if (input.b === 0) {
          return {
            success: false,
            error: 'Division by zero',
          };
        }
        result = input.a / input.b;
        break;
      case 'power':
        result = Math.pow(input.a, input.b);
        break;
      case 'modulo':
        result = input.a % input.b;
        break;
      default:
        return {
          success: false,
          error: 'Unknown operation',
        };
    }
    
    return {
      success: true,
      result,
      operation: input.operation,
      a: input.a,
      b: input.b,
    };
  })
  .build();

/**
 * Math functions tool
 */
export const mathFunctions = toolBuilder()
  .name('math-functions')
  .description('Apply mathematical functions: sqrt, abs, round, floor, ceil, sin, cos, tan, log, exp.')
  .category(ToolCategory.UTILITY)
  .tags(['math', 'functions', 'trigonometry'])
  .schema(z.object({
    function: z.enum(['sqrt', 'abs', 'round', 'floor', 'ceil', 'sin', 'cos', 'tan', 'log', 'exp']).describe('Mathematical function to apply'),
    value: z.number().describe('Input value'),
  }))
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

/**
 * Random number generator tool
 */
export const randomNumber = toolBuilder()
  .name('random-number')
  .description('Generate a random number within a specified range. Supports integers and decimals.')
  .category(ToolCategory.UTILITY)
  .tags(['random', 'number', 'generator'])
  .schema(z.object({
    min: z.number().default(0).describe('Minimum value (inclusive)'),
    max: z.number().default(1).describe('Maximum value (exclusive for decimals, inclusive for integers)'),
    integer: z.boolean().default(false).describe('Generate an integer (true) or decimal (false)'),
  }))
  .implement(async (input) => {
    const min = input.min ?? 0;
    const max = input.max ?? 1;
    const integer = input.integer ?? false;

    let result: number;

    if (integer) {
      result = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      result = Math.random() * (max - min) + min;
    }

    return {
      result,
      min,
      max,
      integer,
    };
  })
  .build();

/**
 * Statistics tool
 */
export const statistics = toolBuilder()
  .name('statistics')
  .description('Calculate statistics for an array of numbers: sum, average, min, max, median, standard deviation.')
  .category(ToolCategory.UTILITY)
  .tags(['math', 'statistics', 'average', 'sum'])
  .schema(z.object({
    numbers: z.array(z.number().describe("Number value")).describe('Array of numbers to analyze'),
  }))
  .implement(async (input) => {
    if (input.numbers.length === 0) {
      return {
        success: false,
        error: 'Empty array',
      };
    }
    
    const sorted = [...input.numbers].sort((a, b) => a - b);
    const sum = input.numbers.reduce((acc, n) => acc + n, 0);
    const average = sum / input.numbers.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    
    // Standard deviation
    const variance = input.numbers.reduce((acc, n) => acc + Math.pow(n - average, 2), 0) / input.numbers.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      success: true,
      count: input.numbers.length,
      sum,
      average,
      min,
      max,
      median,
      standardDeviation: stdDev,
      variance,
    };
  })
  .build();

