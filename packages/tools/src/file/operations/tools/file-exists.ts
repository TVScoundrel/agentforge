/**
 * File Exists Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileExistsSchema } from '../types.js';
import { promises as fs } from 'fs';
import {
  DEFAULT_FILE_SYSTEM_POLICY,
  FileSystemPolicyError,
  type FileSystemPolicy,
} from '../../confinement.js';

/**
 * Create file exists tool
 */
export function createFileExistsTool(policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY) {
  return toolBuilder()
    .name('file-exists')
    .description('Check if a file or directory exists at the specified path.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'exists', 'check', 'filesystem'])
    .schema(fileExistsSchema)
    .implement(async (input) => {
      try {
        const safePath = await policy.resolvePath(input.path, 'file existence check');
        await fs.access(safePath);
        const stats = await fs.stat(safePath);
        
        return {
          exists: true,
          path: input.path,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      } catch (error) {
        if (error instanceof FileSystemPolicyError) {
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          exists: false,
          path: input.path,
        };
      }
    })
    .build();
}
