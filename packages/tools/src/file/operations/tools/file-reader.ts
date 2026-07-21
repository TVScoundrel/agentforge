/**
 * File Reader Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileReaderSchema } from '../types.js';
import { promises as fs } from 'fs';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';

/**
 * Create file reader tool
 */
export function createFileReaderTool(
  defaultEncoding: string = 'utf8',
  policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY,
) {
  return toolBuilder()
    .name('file-reader')
    .description('Read the contents of a file from the file system. Supports text and binary files with various encodings.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'read', 'io', 'filesystem'])
    .schema(fileReaderSchema)
    .implementSafe(async (input) => {
      const encoding = input.encoding || defaultEncoding;
      const safePath = await policy.resolvePath(input.path, 'file read');
      const content = await fs.readFile(safePath, encoding as BufferEncoding);
      const stats = await fs.stat(safePath);

      return {
        content,
        size: stats.size,
        path: input.path,
        encoding,
      };
    })
    .build();
}
