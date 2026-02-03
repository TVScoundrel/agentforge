/**
 * Path Join Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathJoinSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path join tool
 */
export function createPathJoinTool() {
  return toolBuilder()
    .name('path-join')
    .description('Join multiple path segments into a single path. Handles platform-specific separators.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'join', 'filesystem'])
    .schema(pathJoinSchema)
    .implement(async (input) => {
      const joined = path.join(...input.segments);
      
      return {
        path: joined,
        segments: input.segments,
      };
    })
    .build();
}

