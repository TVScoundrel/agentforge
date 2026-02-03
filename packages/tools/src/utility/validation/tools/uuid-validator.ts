/**
 * UUID Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { UuidValidatorSchema } from '../types.js';

/**
 * Create UUID validator tool
 */
export function createUuidValidatorTool() {
  return toolBuilder()
    .name('uuid-validator')
    .description('Validate if a string is a valid UUID (v1, v3, v4, or v5).')
    .category(ToolCategory.UTILITY)
    .tags(['validation', 'uuid', 'validate', 'guid'])
    .schema(UuidValidatorSchema)
    .implement(async (input) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const valid = uuidRegex.test(input.uuid);
      
      let version: number | undefined;
      if (valid) {
        version = parseInt(input.uuid[14], 10);
      }
      
      return {
        valid,
        uuid: input.uuid,
        version,
        message: valid ? `Valid UUID v${version}` : 'Invalid UUID format',
      };
    })
    .build();
}

