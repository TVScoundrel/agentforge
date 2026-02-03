/**
 * Directory Create Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { directoryCreateSchema } from '../types.js';
import { promises as fs } from 'fs';

/**
 * Create directory create tool
 */
export function createDirectoryCreateTool(defaultRecursive: boolean = true) {
  return toolBuilder()
    .name('directory-create')
    .description('Create a new directory. Can optionally create parent directories if they don\'t exist.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['directory', 'create', 'mkdir', 'filesystem'])
    .schema(directoryCreateSchema)
    .implementSafe(async (input) => {
      const recursive = input.recursive ?? defaultRecursive;
      await fs.mkdir(input.path, { recursive });

      return {
        path: input.path,
        message: 'Directory created successfully',
      };
    })
    .build();
}

