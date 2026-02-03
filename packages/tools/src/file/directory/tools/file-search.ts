/**
 * File Search Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { fileSearchSchema } from '../types.js';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Create file search tool
 */
export function createFileSearchTool(defaultRecursive: boolean = true, defaultCaseSensitive: boolean = false) {
  return toolBuilder()
    .name('file-search')
    .description('Search for files by name pattern in a directory. Supports wildcards and recursive search.')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['file', 'search', 'find', 'filesystem'])
    .schema(fileSearchSchema)
    .implementSafe(async (input) => {
      const recursive = input.recursive ?? defaultRecursive;
      const caseSensitive = input.caseSensitive ?? defaultCaseSensitive;

      const searchFiles = async (dir: string): Promise<string[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const matches: string[] = [];

        // Convert pattern to regex
        const regexPattern = input.pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, caseSensitive ? '' : 'i');

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isFile() && regex.test(entry.name)) {
            matches.push(fullPath);
          }

          if (recursive && entry.isDirectory()) {
            const subMatches = await searchFiles(fullPath);
            matches.push(...subMatches);
          }
        }

        return matches;
      };

      const matches = await searchFiles(input.directory);

      return {
        directory: input.directory,
        pattern: input.pattern,
        matches,
        count: matches.length,
      };
    })
    .build();
}

