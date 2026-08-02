/**
 * Directory List Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { directoryListSchema, type DirectoryListEntry, type DirectoryListResult } from '../types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';

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
      const listFiles = async (dir: string, recursive: boolean): Promise<DirectoryListEntry[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files: DirectoryListEntry[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(safePath, fullPath);

          // Apply extension filter if specified
          if (input.extension && !entry.name.endsWith(input.extension)) {
            if (!entry.isDirectory() || !recursive) {
              continue;
            }
          }

          if (includeDetails) {
            const stats = await fs.lstat(fullPath);
            files.push({
              name: entry.name,
              path: relativePath,
              fullPath,
              isFile: entry.isFile(),
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime.toISOString(),
            });
          } else {
            files.push({
              name: entry.name,
              path: relativePath,
              isFile: entry.isFile(),
              isDirectory: entry.isDirectory(),
            });
          }

          // Recurse into subdirectories if requested
          if (recursive && entry.isDirectory()) {
            const subFiles = await listFiles(fullPath, true);
            files.push(...subFiles);
          }
        }

        return files;
      };

      const recursive = input.recursive ?? defaultRecursive;
      const files = await listFiles(safePath, recursive);

      const result: DirectoryListResult = {
        path: input.path,
        files,
        count: files.length,
      };

      return result;
    })
    .build();
}
