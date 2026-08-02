/**
 * Directory Operations Types
 * 
 * Type definitions and schemas for directory operation tools.
 */

import { z } from 'zod';
import type { FileSystemPolicyInput } from '../confinement.js';

/**
 * Directory list schema
 */
export const directoryListSchema = z.object({
  path: z.string().describe('Path to the directory to list'),
  recursive: z.boolean().default(false).describe('List files recursively in subdirectories'),
  includeDetails: z.boolean().default(false).describe('Include file size, type, and modification date'),
  extension: z.string().optional().describe('Optional file extension filter (e.g., ".txt", ".js")'),
});

/**
 * A single entry returned by the directory-list tool.
 * Detail fields are present only when includeDetails is enabled.
 */
export interface DirectoryListEntry {
  name: string;
  path: string;
  isFile: boolean;
  isDirectory: boolean;
  fullPath?: string;
  size?: number;
  modified?: string;
}

/**
 * Stable result shape returned by the directory-list tool.
 */
export interface DirectoryListResult {
  path: string;
  files: DirectoryListEntry[];
  count: number;
}

/**
 * Directory create schema
 */
export const directoryCreateSchema = z.object({
  path: z.string().describe('Path to the directory to create'),
  recursive: z.boolean().default(true).describe('Create parent directories if they don\'t exist'),
});

/**
 * Directory delete schema
 */
export const directoryDeleteSchema = z.object({
  path: z.string().describe('Path to the directory to delete'),
  recursive: z.boolean().default(false).describe('Delete directory and all its contents'),
});

/**
 * File search schema
 */
export const fileSearchSchema = z.object({
  directory: z.string().describe('Directory to search in'),
  pattern: z.string().describe('File name pattern to search for (supports * wildcard)'),
  recursive: z.boolean().default(true).describe('Search in subdirectories'),
  caseSensitive: z.boolean().default(false).describe('Case-sensitive pattern matching'),
});

/**
 * Directory operations configuration
 */
export interface DirectoryOperationsConfig {
  defaultRecursive?: boolean;
  defaultIncludeDetails?: boolean;
  defaultCaseSensitive?: boolean;
  policy?: FileSystemPolicyInput;
}
