/**
 * Directory Create Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { directoryCreateSchema } from '../types.js';
import { promises as fs } from 'fs';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';

/**
 * Create directory create tool
 */
export function createDirectoryCreateTool(
  defaultRecursive: boolean = true,
  policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY,
) {
  return toolBuilder()
    .name('directory-create')
    .description('Create a new directory. Can optionally create parent directories if they don\'t exist.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['directory', 'create', 'mkdir', 'filesystem'])
    .schema(directoryCreateSchema)
    .implementSafe(async (input) => {
      const recursive = input.recursive ?? defaultRecursive;
      const safePath = await policy.resolvePath(input.path, 'directory creation');
      await fs.mkdir(safePath, { recursive });

      return {
        path: input.path,
        message: 'Directory created successfully',
      };
    })
    .build();
}
