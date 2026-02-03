/**
 * File Operations Types
 * 
 * Type definitions and schemas for file operation tools.
 */

import { z } from 'zod';

/**
 * File reader schema
 */
export const fileReaderSchema = z.object({
  path: z.string().describe('Path to the file to read'),
  encoding: z.enum(['utf8', 'utf-8', 'ascii', 'base64', 'hex', 'binary']).default('utf8').describe('File encoding'),
});

/**
 * File writer schema
 */
export const fileWriterSchema = z.object({
  path: z.string().describe('Path to the file to write'),
  content: z.string().describe('Content to write to the file'),
  encoding: z.enum(['utf8', 'utf-8', 'ascii', 'base64', 'hex']).default('utf8').describe('File encoding'),
  createDirs: z.boolean().default(false).describe('Create parent directories if they don\'t exist'),
});

/**
 * File append schema
 */
export const fileAppendSchema = z.object({
  path: z.string().describe('Path to the file to append to'),
  content: z.string().describe('Content to append to the file'),
  encoding: z.enum(['utf8', 'utf-8', 'ascii']).default('utf8').describe('File encoding'),
});

/**
 * File delete schema
 */
export const fileDeleteSchema = z.object({
  path: z.string().describe('Path to the file to delete'),
});

/**
 * File exists schema
 */
export const fileExistsSchema = z.object({
  path: z.string().describe('Path to check'),
});

/**
 * File operations configuration
 */
export interface FileOperationsConfig {
  defaultEncoding?: 'utf8' | 'utf-8' | 'ascii' | 'base64' | 'hex';
  createDirsDefault?: boolean;
}

