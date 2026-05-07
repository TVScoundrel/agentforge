/**
 * Object Omit Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { objectOmitSchema } from '../types.js';
import { omitObjectProperties } from './shared.js';

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
    .implement(async (input) => omitObjectProperties(input.object, input.properties))
    .build();
}
