/**
 * Path Utilities Tools
 * 
 * Tools for working with file paths.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import * as path from 'path';

/**
 * Path join tool
 */
export const pathJoin = toolBuilder()
  .name('path-join')
  .description('Join multiple path segments into a single path. Handles platform-specific separators.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'join', 'filesystem'])
  .schema(z.object({
    segments: z.array(z.string().describe("String value")).describe('Path segments to join'),
  }))
  .implement(async (input) => {
    const joined = path.join(...input.segments);
    
    return {
      path: joined,
      segments: input.segments,
    };
  })
  .build();

/**
 * Path resolve tool
 */
export const pathResolve = toolBuilder()
  .name('path-resolve')
  .description('Resolve a sequence of paths into an absolute path. Resolves relative paths from the current working directory.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'resolve', 'absolute', 'filesystem'])
  .schema(z.object({
    paths: z.array(z.string().describe("String value")).describe('Paths to resolve'),
  }))
  .implement(async (input) => {
    const resolved = path.resolve(...input.paths);
    
    return {
      path: resolved,
      isAbsolute: path.isAbsolute(resolved),
    };
  })
  .build();

/**
 * Path parse tool
 */
export const pathParse = toolBuilder()
  .name('path-parse')
  .description('Parse a file path into its components (directory, filename, extension, etc.).')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'parse', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('File path to parse'),
  }))
  .implement(async (input) => {
    const parsed = path.parse(input.path);
    
    return {
      root: parsed.root,
      dir: parsed.dir,
      base: parsed.base,
      name: parsed.name,
      ext: parsed.ext,
      isAbsolute: path.isAbsolute(input.path),
    };
  })
  .build();

/**
 * Path basename tool
 */
export const pathBasename = toolBuilder()
  .name('path-basename')
  .description('Get the last portion of a path (filename with extension). Optionally remove the extension.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'basename', 'filename', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('File path'),
    removeExtension: z.boolean().default(false).describe('Remove the file extension'),
  }))
  .implement(async (input) => {
    const basename = input.removeExtension 
      ? path.basename(input.path, path.extname(input.path))
      : path.basename(input.path);
    
    return {
      basename,
      extension: path.extname(input.path),
    };
  })
  .build();

/**
 * Path dirname tool
 */
export const pathDirname = toolBuilder()
  .name('path-dirname')
  .description('Get the directory name of a path (everything except the last portion).')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'dirname', 'directory', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('File path'),
  }))
  .implement(async (input) => {
    const dirname = path.dirname(input.path);
    
    return {
      dirname,
      basename: path.basename(input.path),
    };
  })
  .build();

/**
 * Path extension tool
 */
export const pathExtension = toolBuilder()
  .name('path-extension')
  .description('Get the file extension from a path (including the dot, e.g., ".txt").')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'extension', 'ext', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('File path'),
  }))
  .implement(async (input) => {
    const ext = path.extname(input.path);
    
    return {
      extension: ext,
      hasExtension: ext.length > 0,
      filename: path.basename(input.path, ext),
    };
  })
  .build();

/**
 * Path relative tool
 */
export const pathRelative = toolBuilder()
  .name('path-relative')
  .description('Get the relative path from one path to another.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'relative', 'filesystem'])
  .schema(z.object({
    from: z.string().describe('Source path'),
    to: z.string().describe('Destination path'),
  }))
  .implement(async (input) => {
    const relative = path.relative(input.from, input.to);
    
    return {
      relativePath: relative,
      from: input.from,
      to: input.to,
    };
  })
  .build();

/**
 * Path normalize tool
 */
export const pathNormalize = toolBuilder()
  .name('path-normalize')
  .description('Normalize a path by resolving ".." and "." segments and removing duplicate separators.')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['path', 'normalize', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('Path to normalize'),
  }))
  .implement(async (input) => {
    const normalized = path.normalize(input.path);
    
    return {
      normalized,
      original: input.path,
    };
  })
  .build();

