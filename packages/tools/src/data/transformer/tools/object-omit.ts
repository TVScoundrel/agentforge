/**
 * Object Omit Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { objectOmitSchema } from '../types.js';

/**
 * Create object omit tool
 */
export function createObjectOmitTool() {
  return toolBuilder()
    .name('object-omit')
    .description('Create a new object excluding the specified properties from the source object.')
    .category(ToolCategory.UTILITY)
    .tags(['object', 'omit', 'data', 'transform'])
    .schema(objectOmitSchema)
    .implement(async (input) => {
      const omitted: Record<string, any> = { ...input.object };
      
      for (const prop of input.properties) {
        delete omitted[prop];
      }

      return omitted;
    })
    .build();
}

