/**
 * Path Basename Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathBasenameSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path basename tool
 */
export function createPathBasenameTool() {
  return toolBuilder()
    .name('path-basename')
    .description('Get the last portion of a path (filename with extension). Optionally remove the extension.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'basename', 'filename', 'filesystem'])
    .schema(pathBasenameSchema)
    .implement(async (input) => {
      const basename = input.removeExtension 
        ? path.basename(input.path, path.extname(input.path))
        : path.basename(input.path);
      
      return {
        basename,
        extension: path.extname(input.path),
      };
    })
    .build();
}

