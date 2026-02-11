import { z } from 'zod';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { {{TOOL_NAME_PASCAL}}Schema } from './schemas.js';
import type { {{TOOL_NAME_PASCAL}}Input, {{TOOL_NAME_PASCAL}}Output } from './types.js';

/**
 * {{TOOL_DESCRIPTION}}
 *
 * Category: {{TOOL_CATEGORY}}
 *
 * @example
 * ```typescript
 * const result = await {{TOOL_NAME_CAMEL}}Tool.invoke({
 *   input: 'example input',
 * });
 * console.log(result);
 * ```
 */
export const {{TOOL_NAME_CAMEL}}Tool = toolBuilder()
  .name('{{TOOL_NAME}}')
  .description('{{TOOL_DESCRIPTION}}')
  .category(ToolCategory.{{TOOL_CATEGORY_ENUM}})
  .schema({{TOOL_NAME_PASCAL}}Schema)
  .implement(async (input: {{TOOL_NAME_PASCAL}}Input): Promise<{{TOOL_NAME_PASCAL}}Output> => {
    try {
      // TODO: Implement your tool logic here
      
      // Example implementation:
      const result = `Processed: ${input.input}`;
      
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  })
  .build();

// Re-export types for convenience
export * from './types.js';
export * from './schemas.js';

