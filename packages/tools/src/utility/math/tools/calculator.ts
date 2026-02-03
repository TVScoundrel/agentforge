/**
 * Calculator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { CalculatorSchema } from '../types.js';

/**
 * Create calculator tool
 */
export function createCalculatorTool() {
  return toolBuilder()
    .name('calculator')
    .description('Perform basic arithmetic operations: add, subtract, multiply, divide, power, modulo.')
    .category(ToolCategory.UTILITY)
    .tags(['math', 'calculator', 'arithmetic'])
    .schema(CalculatorSchema)
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
}

