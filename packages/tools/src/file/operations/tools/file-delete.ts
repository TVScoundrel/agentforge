/**
 * File Delete Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileDeleteSchema } from '../types.js';
import { promises as fs } from 'fs';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';

/**
 * Create file delete tool
 */
export function createFileDeleteTool(policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY) {
  return toolBuilder()
    .name('file-delete')
    .description('Delete a file from the file system. Returns an error if the file doesn\'t exist.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'delete', 'remove', 'filesystem'])
    .schema(fileDeleteSchema)
    .implementSafe(async (input) => {
      const safePath = await policy.resolvePath(input.path, 'file deletion');
      await fs.unlink(safePath);

      return {
        path: input.path,
        message: 'File deleted successfully',
      };
    })
    .build();
}
