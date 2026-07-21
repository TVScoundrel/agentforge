/**
 * Directory Delete Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { directoryDeleteSchema } from '../types.js';
import { promises as fs } from 'fs';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';

/**
 * Create directory delete tool
 */
export function createDirectoryDeleteTool(
  defaultRecursive: boolean = false,
  policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY,
) {
  return toolBuilder()
    .name('directory-delete')
    .description('Delete a directory. Can optionally delete non-empty directories recursively.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['directory', 'delete', 'remove', 'filesystem'])
    .schema(directoryDeleteSchema)
    .implementSafe(async (input) => {
      const recursive = input.recursive ?? defaultRecursive;
      const safePath = await policy.resolveDeletePath(input.path, recursive);
      await fs.rm(safePath, { recursive, force: false });

      return {
        path: input.path,
        message: 'Directory deleted successfully',
      };
    })
    .build();
}
