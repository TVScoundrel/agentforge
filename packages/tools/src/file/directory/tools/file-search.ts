/**
 * File Search Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileSearchSchema } from '../types.js';
import { DEFAULT_FILE_SYSTEM_POLICY, type FileSystemPolicy } from '../../confinement.js';
import { traverseDirectory } from './traverse-directory.js';

/**
 * Create file search tool
 */
export function createFileSearchTool(
  defaultRecursive: boolean = true,
  defaultCaseSensitive: boolean = false,
  policy: FileSystemPolicy = DEFAULT_FILE_SYSTEM_POLICY,
) {
  return toolBuilder()
    .name('file-search')
    .description('Search for files by name pattern in a directory. Supports wildcards and recursive search.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'search', 'find', 'filesystem'])
    .schema(fileSearchSchema)
    .implementSafe(async (input) => {
      const recursive = input.recursive ?? defaultRecursive;
      const caseSensitive = input.caseSensitive ?? defaultCaseSensitive;
      const safeDirectory = await policy.resolvePath(input.directory, 'file search');
      const regexPattern = input.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`, caseSensitive ? '' : 'i');
      const matches: string[] = [];

      for await (const entry of traverseDirectory(safeDirectory, recursive)) {
        if (entry.isFile && regex.test(entry.name)) {
          matches.push(entry.fullPath);
        }
      }

      return {
        directory: input.directory,
        pattern: input.pattern,
        matches,
        count: matches.length,
      };
    })
    .build();
}
