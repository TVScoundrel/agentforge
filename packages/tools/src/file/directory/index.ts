/**
 * Directory Operations Tools
 * 
 * Tools for working with directories and file listings.
 */

export * from './types.js';
export * from './tools/directory-list.js';
export * from './tools/directory-create.js';
export * from './tools/directory-delete.js';
export * from './tools/file-search.js';

import { createDirectoryListTool } from './tools/directory-list.js';
import { createDirectoryCreateTool } from './tools/directory-create.js';
import { createDirectoryDeleteTool } from './tools/directory-delete.js';
import { createFileSearchTool } from './tools/file-search.js';
import type { DirectoryOperationsConfig } from './types.js';

/**
 * Default directory operation tool instances
 */
export const directoryList = createDirectoryListTool();
export const directoryCreate = createDirectoryCreateTool();
export const directoryDelete = createDirectoryDeleteTool();
export const fileSearch = createFileSearchTool();

/**
 * Array of all directory operation tools
 */
export const directoryOperationTools = [
  directoryList,
  directoryCreate,
  directoryDelete,
  fileSearch,
];

/**
 * Create directory operation tools with custom configuration
 */
export function createDirectoryOperationTools(config: DirectoryOperationsConfig = {}) {
  const {
    defaultRecursive = false,
    defaultIncludeDetails = false,
    defaultCaseSensitive = false,
  } = config;

  return [
    createDirectoryListTool(defaultRecursive, defaultIncludeDetails),
    createDirectoryCreateTool(true), // Always default to true for create
    createDirectoryDeleteTool(false), // Always default to false for delete (safety)
    createFileSearchTool(defaultRecursive, defaultCaseSensitive),
  ];
}

