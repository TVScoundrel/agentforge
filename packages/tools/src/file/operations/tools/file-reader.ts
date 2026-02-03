/**
 * File Reader Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileReaderSchema } from '../types.js';
import { promises as fs } from 'fs';

/**
 * Create file reader tool
 */
export function createFileReaderTool(defaultEncoding: string = 'utf8') {
  return toolBuilder()
    .name('file-reader')
    .description('Read the contents of a file from the file system. Supports text and binary files with various encodings.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'read', 'io', 'filesystem'])
    .schema(fileReaderSchema)
    .implementSafe(async (input) => {
      const encoding = input.encoding || defaultEncoding;
      const content = await fs.readFile(input.path, encoding as BufferEncoding);
      const stats = await fs.stat(input.path);

      return {
        content,
        size: stats.size,
        path: input.path,
        encoding,
      };
    })
    .build();
}

