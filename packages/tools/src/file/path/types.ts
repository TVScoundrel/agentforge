/**
 * Path Utilities Types
 * 
 * Type definitions and schemas for path utility tools.
 */

import { z } from 'zod';

/**
 * Path join schema
 */
export const pathJoinSchema = z.object({
  segments: z.array(z.string().describe("String value")).describe('Path segments to join'),
});

/**
 * Path resolve schema
 */
export const pathResolveSchema = z.object({
  paths: z.array(z.string().describe("String value")).describe('Paths to resolve'),
});

/**
 * Path parse schema
 */
export const pathParseSchema = z.object({
  path: z.string().describe('File path to parse'),
});

/**
 * Path basename schema
 */
export const pathBasenameSchema = z.object({
  path: z.string().describe('File path'),
  removeExtension: z.boolean().default(false).describe('Remove the file extension'),
});

/**
 * Path dirname schema
 */
export const pathDirnameSchema = z.object({
  path: z.string().describe('File path'),
});

/**
 * Path extension schema
 */
export const pathExtensionSchema = z.object({
  path: z.string().describe('File path'),
});

/**
 * Path relative schema
 */
export const pathRelativeSchema = z.object({
  from: z.string().describe('Source path'),
  to: z.string().describe('Destination path'),
});

/**
 * Path normalize schema
 */
export const pathNormalizeSchema = z.object({
  path: z.string().describe('Path to normalize'),
});

/**
 * Path utilities configuration
 */
export interface PathUtilitiesConfig {
  // No specific configuration needed for path utilities
}

