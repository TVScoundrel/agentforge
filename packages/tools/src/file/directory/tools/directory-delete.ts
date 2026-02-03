/**
 * Directory Delete Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { directoryDeleteSchema } from '../types.js';
import { promises as fs } from 'fs';

/**
 * Create directory delete tool
 */
export function createDirectoryDeleteTool(defaultRecursive: boolean = false) {
  return toolBuilder()
    .name('directory-delete')
    .description('Delete a directory. Can optionally delete non-empty directories recursively.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['directory', 'delete', 'remove', 'filesystem'])
    .schema(directoryDeleteSchema)
    .implementSafe(async (input) => {
      const recursive = input.recursive ?? defaultRecursive;
      await fs.rm(input.path, { recursive, force: false });

      return {
        path: input.path,
        message: 'Directory deleted successfully',
      };
    })
    .build();
}

