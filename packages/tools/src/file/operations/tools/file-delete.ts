/**
 * File Delete Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileDeleteSchema } from '../types.js';
import { promises as fs } from 'fs';

/**
 * Create file delete tool
 */
export function createFileDeleteTool() {
  return toolBuilder()
    .name('file-delete')
    .description('Delete a file from the file system. Returns an error if the file doesn\'t exist.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'delete', 'remove', 'filesystem'])
    .schema(fileDeleteSchema)
    .implementSafe(async (input) => {
      await fs.unlink(input.path);

      return {
        path: input.path,
        message: 'File deleted successfully',
      };
    })
    .build();
}

