/**
 * File Writer Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileWriterSchema } from '../types.js';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Create file writer tool
 */
export function createFileWriterTool(defaultEncoding: string = 'utf8', createDirsDefault: boolean = false) {
  return toolBuilder()
    .name('file-writer')
    .description('Write content to a file. Creates the file if it doesn\'t exist, or overwrites it if it does.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'write', 'io', 'filesystem'])
    .schema(fileWriterSchema)
    .implementSafe(async (input) => {
      const encoding = input.encoding || defaultEncoding;
      const createDirs = input.createDirs ?? createDirsDefault;

      // Create parent directories if requested
      if (createDirs) {
        const dir = path.dirname(input.path);
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(input.path, input.content, encoding as BufferEncoding);
      const stats = await fs.stat(input.path);

      return {
        path: input.path,
        size: stats.size,
        encoding,
      };
    })
    .build();
}

