/**
 * Directory List Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { directoryListSchema, type DirectoryListEntry, type DirectoryListResult } from '../types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';
import { traverseDirectory } from './traverse-directory.js';

/**
 * Create directory list tool
 */
export function createDirectoryListTool(
  defaultRecursive: boolean = false,
  defaultIncludeDetails: boolean = false,
  policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY,
) {
  return toolBuilder()
    .name('directory-list')
    .description('List all files and directories in a directory. Can optionally include file details and filter by extension.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['directory', 'list', 'files', 'filesystem'])
    .schema(directoryListSchema)
    .implementSafe(async (input) => {
      const safePath = await policy.resolvePath(input.path, 'directory listing');
      const includeDetails = input.includeDetails ?? defaultIncludeDetails;
      const recursive = input.recursive ?? defaultRecursive;
      const files: DirectoryListEntry[] = [];

      for await (const entry of traverseDirectory(safePath, recursive)) {
        const relativePath = path.relative(safePath, entry.fullPath);

        // Apply extension filter if specified
        if (input.extension && !entry.name.endsWith(input.extension)) {
          if (!entry.isDirectory || !recursive) {
            continue;
          }
        }

        if (includeDetails) {
          const stats = await fs.lstat(entry.fullPath);
          files.push({
            name: entry.name,
            path: relativePath,
            fullPath: entry.fullPath,
            isFile: entry.isFile,
            isDirectory: entry.isDirectory,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        } else {
          files.push({
            name: entry.name,
            path: relativePath,
            isFile: entry.isFile,
            isDirectory: entry.isDirectory,
          });
        }
      }

      const result: DirectoryListResult = {
        path: input.path,
        files,
        count: files.length,
      };

      return result;
    })
    .build();
}
