/**
 * Path Normalize Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathNormalizeSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path normalize tool
 */
export function createPathNormalizeTool() {
  return toolBuilder()
    .name('path-normalize')
    .description('Normalize a path by resolving ".." and "." segments and removing duplicate separators.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'normalize', 'filesystem'])
    .schema(pathNormalizeSchema)
    .implement(async (input) => {
      const normalized = path.normalize(input.path);
      
      return {
        normalized,
        original: input.path,
      };
    })
    .build();
}

