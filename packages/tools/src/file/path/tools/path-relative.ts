/**
 * Path Relative Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathRelativeSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path relative tool
 */
export function createPathRelativeTool() {
  return toolBuilder()
    .name('path-relative')
    .description('Get the relative path from one path to another.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'relative', 'filesystem'])
    .schema(pathRelativeSchema)
    .implement(async (input) => {
      const relative = path.relative(input.from, input.to);
      
      return {
        relativePath: relative,
        from: input.from,
        to: input.to,
      };
    })
    .build();
}

