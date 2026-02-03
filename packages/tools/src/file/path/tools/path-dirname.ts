/**
 * Path Dirname Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathDirnameSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path dirname tool
 */
export function createPathDirnameTool() {
  return toolBuilder()
    .name('path-dirname')
    .description('Get the directory name of a path (everything except the last portion).')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'dirname', 'directory', 'filesystem'])
    .schema(pathDirnameSchema)
    .implement(async (input) => {
      const dirname = path.dirname(input.path);
      
      return {
        dirname,
        basename: path.basename(input.path),
      };
    })
    .build();
}

