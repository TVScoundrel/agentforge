/**
 * Path Utilities Tools
 * 
 * Tools for working with file paths.
 */

export * from './types.js';
export * from './tools/path-join.js';
export * from './tools/path-resolve.js';
export * from './tools/path-parse.js';
export * from './tools/path-basename.js';
export * from './tools/path-dirname.js';
export * from './tools/path-extension.js';
export * from './tools/path-relative.js';
export * from './tools/path-normalize.js';

import { createPathJoinTool } from './tools/path-join.js';
import { createPathResolveTool } from './tools/path-resolve.js';
import { createPathParseTool } from './tools/path-parse.js';
import { createPathBasenameTool } from './tools/path-basename.js';
import { createPathDirnameTool } from './tools/path-dirname.js';
import { createPathExtensionTool } from './tools/path-extension.js';
import { createPathRelativeTool } from './tools/path-relative.js';
import { createPathNormalizeTool } from './tools/path-normalize.js';
import type { PathUtilitiesConfig } from './types.js';

/**
 * Default path utility tool instances
 */
export const pathJoin = createPathJoinTool();
export const pathResolve = createPathResolveTool();
export const pathParse = createPathParseTool();
export const pathBasename = createPathBasenameTool();
export const pathDirname = createPathDirnameTool();
export const pathExtension = createPathExtensionTool();
export const pathRelative = createPathRelativeTool();
export const pathNormalize = createPathNormalizeTool();

/**
 * Array of all path utility tools
 */
export const pathUtilityTools = [
  pathJoin,
  pathResolve,
  pathParse,
  pathBasename,
  pathDirname,
  pathExtension,
  pathRelative,
  pathNormalize,
];

/**
 * Create path utility tools with custom configuration
 */
export function createPathUtilityTools(config: PathUtilitiesConfig = {}) {
  return [
    createPathJoinTool(),
    createPathResolveTool(),
    createPathParseTool(),
    createPathBasenameTool(),
    createPathDirnameTool(),
    createPathExtensionTool(),
    createPathRelativeTool(),
    createPathNormalizeTool(),
  ];
}

