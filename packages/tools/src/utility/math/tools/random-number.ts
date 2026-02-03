/**
 * Random Number Generator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { RandomNumberSchema } from '../types.js';

/**
 * Create random number tool
 */
export function createRandomNumberTool() {
  return toolBuilder()
    .name('random-number')
    .description('Generate a random number within a specified range. Supports integers and decimals.')
    .category(ToolCategory.UTILITY)
    .tags(['random', 'number', 'generator'])
    .schema(RandomNumberSchema)
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
}

