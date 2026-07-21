/**
 * File Append Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileAppendSchema } from '../types.js';
import { promises as fs } from 'fs';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';

/**
 * Create file append tool
 */
export function createFileAppendTool(
  defaultEncoding: string = 'utf8',
  policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY,
) {
  return toolBuilder()
    .name('file-append')
    .description('Append content to the end of a file. Creates the file if it doesn\'t exist.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'append', 'io', 'filesystem'])
    .schema(fileAppendSchema)
    .implementSafe(async (input) => {
      const encoding = input.encoding || defaultEncoding;
      const safePath = await policy.resolvePath(input.path, 'file append');
      await fs.appendFile(safePath, input.content, encoding as BufferEncoding);
      const stats = await fs.stat(safePath);

      return {
        path: input.path,
        size: stats.size,
      };
    })
    .build();
}
