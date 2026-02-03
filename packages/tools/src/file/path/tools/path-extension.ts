/**
 * Path Extension Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathExtensionSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path extension tool
 */
export function createPathExtensionTool() {
  return toolBuilder()
    .name('path-extension')
    .description('Get the file extension from a path (including the dot, e.g., ".txt").')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'extension', 'ext', 'filesystem'])
    .schema(pathExtensionSchema)
    .implement(async (input) => {
      const ext = path.extname(input.path);
      
      return {
        extension: ext,
        hasExtension: ext.length > 0,
        filename: path.basename(input.path, ext),
      };
    })
    .build();
}

