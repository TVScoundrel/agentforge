/**
 * Path Resolve Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathResolveSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path resolve tool
 */
export function createPathResolveTool() {
  return toolBuilder()
    .name('path-resolve')
    .description('Resolve a sequence of paths into an absolute path. Resolves relative paths from the current working directory.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'resolve', 'absolute', 'filesystem'])
    .schema(pathResolveSchema)
    .implement(async (input) => {
      const resolved = path.resolve(...input.paths);
      
      return {
        path: resolved,
        isAbsolute: path.isAbsolute(resolved),
      };
    })
    .build();
}

