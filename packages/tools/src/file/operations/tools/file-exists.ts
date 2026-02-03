/**
 * File Exists Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileExistsSchema } from '../types.js';
import { promises as fs } from 'fs';

/**
 * Create file exists tool
 */
export function createFileExistsTool() {
  return toolBuilder()
    .name('file-exists')
    .description('Check if a file or directory exists at the specified path.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'exists', 'check', 'filesystem'])
    .schema(fileExistsSchema)
    .implement(async (input) => {
      try {
        await fs.access(input.path);
        const stats = await fs.stat(input.path);
        
        return {
          exists: true,
          path: input.path,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      } catch {
        return {
          exists: false,
          path: input.path,
        };
      }
    })
    .build();
}

