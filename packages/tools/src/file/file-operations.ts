/**
 * File Operations Tools
 * 
 * Tools for reading, writing, and manipulating files.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * File reader tool
 */
export const fileReader = toolBuilder()
  .name('file-reader')
  .description('Read the contents of a file from the file system. Supports text and binary files with various encodings.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'read', 'io', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.enum(['utf8', 'utf-8', 'ascii', 'base64', 'hex', 'binary']).default('utf8').describe('File encoding'),
  }))
  .implement(async (input) => {
    try {
      const content = await fs.readFile(input.path, input.encoding as BufferEncoding);
      const stats = await fs.stat(input.path);
      
      return {
        success: true,
        content,
        size: stats.size,
        path: input.path,
        encoding: input.encoding,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
        path: input.path,
      };
    }
  })
  .build();

/**
 * File writer tool
 */
export const fileWriter = toolBuilder()
  .name('file-writer')
  .description('Write content to a file. Creates the file if it doesn\'t exist, or overwrites it if it does.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'write', 'io', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the file to write'),
    content: z.string().describe('Content to write to the file'),
    encoding: z.enum(['utf8', 'utf-8', 'ascii', 'base64', 'hex']).default('utf8').describe('File encoding'),
    createDirs: z.boolean().default(false).describe('Create parent directories if they don\'t exist'),
  }))
  .implement(async (input) => {
    try {
      // Create parent directories if requested
      if (input.createDirs) {
        const dir = path.dirname(input.path);
        await fs.mkdir(dir, { recursive: true });
      }
      
      await fs.writeFile(input.path, input.content, input.encoding as BufferEncoding);
      const stats = await fs.stat(input.path);
      
      return {
        success: true,
        path: input.path,
        size: stats.size,
        encoding: input.encoding,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
        path: input.path,
      };
    }
  })
  .build();

/**
 * File append tool
 */
export const fileAppend = toolBuilder()
  .name('file-append')
  .description('Append content to the end of a file. Creates the file if it doesn\'t exist.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'append', 'io', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the file to append to'),
    content: z.string().describe('Content to append to the file'),
    encoding: z.enum(['utf8', 'utf-8', 'ascii']).default('utf8').describe('File encoding'),
  }))
  .implement(async (input) => {
    try {
      await fs.appendFile(input.path, input.content, input.encoding as BufferEncoding);
      const stats = await fs.stat(input.path);
      
      return {
        success: true,
        path: input.path,
        size: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to append to file',
        path: input.path,
      };
    }
  })
  .build();

/**
 * File delete tool
 */
export const fileDelete = toolBuilder()
  .name('file-delete')
  .description('Delete a file from the file system. Returns an error if the file doesn\'t exist.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'delete', 'remove', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to the file to delete'),
  }))
  .implement(async (input) => {
    try {
      await fs.unlink(input.path);
      
      return {
        success: true,
        path: input.path,
        message: 'File deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
        path: input.path,
      };
    }
  })
  .build();

/**
 * File exists tool
 */
export const fileExists = toolBuilder()
  .name('file-exists')
  .description('Check if a file or directory exists at the specified path.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'exists', 'check', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to check'),
  }))
  .implement(async (input) => {
    try {
      await fs.access(input.path);
      const stats = await fs.stat(input.path);
      
      return {
        exists: true,
        path: input.path,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime.toISOString(),
      };
    } catch {
      return {
        exists: false,
        path: input.path,
      };
    }
  })
  .build();

