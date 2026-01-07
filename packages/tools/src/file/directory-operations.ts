/**
 * Directory Operations Tools
 * 
 * Tools for working with directories and file listings.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Directory listing tool
 */
export const directoryList = toolBuilder()
  .name('directory-list')
  .description('List all files and directories in a directory. Can optionally include file details and filter by extension.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['directory', 'list', 'files', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the directory to list'),
    recursive: z.boolean().default(false).describe('List files recursively in subdirectories'),
    includeDetails: z.boolean().default(false).describe('Include file size, type, and modification date'),
    extension: z.string().optional().describe('Optional file extension filter (e.g., ".txt", ".js")'),
  }))
  .implement(async (input) => {
    try {
      const listFiles = async (dir: string, recursive: boolean): Promise<any[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files: any[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(input.path, fullPath);

          // Apply extension filter if specified
          if (input.extension && !entry.name.endsWith(input.extension)) {
            if (!entry.isDirectory() || !recursive) {
              continue;
            }
          }

          if (input.includeDetails) {
            const stats = await fs.stat(fullPath);
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

      const files = await listFiles(input.path, input.recursive ?? false);

      return {
        success: true,
        path: input.path,
        files,
        count: files.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory',
        path: input.path,
      };
    }
  })
  .build();

/**
 * Directory create tool
 */
export const directoryCreate = toolBuilder()
  .name('directory-create')
  .description('Create a new directory. Can optionally create parent directories if they don\'t exist.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['directory', 'create', 'mkdir', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the directory to create'),
    recursive: z.boolean().default(true).describe('Create parent directories if they don\'t exist'),
  }))
  .implement(async (input) => {
    try {
      await fs.mkdir(input.path, { recursive: input.recursive });
      
      return {
        success: true,
        path: input.path,
        message: 'Directory created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory',
        path: input.path,
      };
    }
  })
  .build();

/**
 * Directory delete tool
 */
export const directoryDelete = toolBuilder()
  .name('directory-delete')
  .description('Delete a directory. Can optionally delete non-empty directories recursively.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['directory', 'delete', 'remove', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the directory to delete'),
    recursive: z.boolean().default(false).describe('Delete directory and all its contents'),
  }))
  .implement(async (input) => {
    try {
      await fs.rm(input.path, { recursive: input.recursive, force: false });
      
      return {
        success: true,
        path: input.path,
        message: 'Directory deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete directory',
        path: input.path,
      };
    }
  })
  .build();

/**
 * File search tool
 */
export const fileSearch = toolBuilder()
  .name('file-search')
  .description('Search for files by name pattern in a directory. Supports wildcards and recursive search.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'search', 'find', 'filesystem'])
  .schema(z.object({
    directory: z.string().describe('Directory to search in'),
    pattern: z.string().describe('File name pattern to search for (supports * wildcard)'),
    recursive: z.boolean().default(true).describe('Search in subdirectories'),
    caseSensitive: z.boolean().default(false).describe('Case-sensitive pattern matching'),
  }))
  .implement(async (input) => {
    try {
      const searchFiles = async (dir: string): Promise<string[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const matches: string[] = [];

        // Convert pattern to regex
        const regexPattern = input.pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, input.caseSensitive ? '' : 'i');

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isFile() && regex.test(entry.name)) {
            matches.push(fullPath);
          }

          if (input.recursive && entry.isDirectory()) {
            const subMatches = await searchFiles(fullPath);
            matches.push(...subMatches);
          }
        }

        return matches;
      };

      const matches = await searchFiles(input.directory);

      return {
        success: true,
        directory: input.directory,
        pattern: input.pattern,
        matches,
        count: matches.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search files',
        directory: input.directory,
      };
    }
  })
  .build();

