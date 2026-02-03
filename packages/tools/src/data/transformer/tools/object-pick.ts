/**
 * Object Pick Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { objectPickSchema } from '../types.js';

/**
 * Create object pick tool
 */
export function createObjectPickTool() {
  return toolBuilder()
    .name('object-pick')
    .description('Create a new object with only the specified properties from the source object.')
    .category(ToolCategory.UTILITY)
    .tags(['object', 'pick', 'data', 'transform'])
    .schema(objectPickSchema)
    .implement(async (input) => {
      const picked: Record<string, any> = {};
      
      for (const prop of input.properties) {
        if (prop in input.object) {
          picked[prop] = input.object[prop];
        }
      }

      return picked;
    })
    .build();
}

