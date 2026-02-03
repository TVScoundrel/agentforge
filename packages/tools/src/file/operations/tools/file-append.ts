/**
 * File Append Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileAppendSchema } from '../types.js';
import { promises as fs } from 'fs';

/**
 * Create file append tool
 */
export function createFileAppendTool(defaultEncoding: string = 'utf8') {
  return toolBuilder()
    .name('file-append')
    .description('Append content to the end of a file. Creates the file if it doesn\'t exist.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'append', 'io', 'filesystem'])
    .schema(fileAppendSchema)
    .implementSafe(async (input) => {
      const encoding = input.encoding || defaultEncoding;
      await fs.appendFile(input.path, input.content, encoding as BufferEncoding);
      const stats = await fs.stat(input.path);

      return {
        path: input.path,
        size: stats.size,
      };
    })
    .build();
}

