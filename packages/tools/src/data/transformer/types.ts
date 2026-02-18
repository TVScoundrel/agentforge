/**
 * Data Transformer Tools Types
 * 
 * Type definitions and schemas for data transformation tools.
 */

import { z } from 'zod';

/**
 * Array filter schema
 */
export const arrayFilterSchema = z.object({
  array: z.array(z.any().describe('Array element')).describe('Array to filter'),
  property: z.string().describe('Property name to filter by (use dot notation for nested properties)'),
  operator: z.enum(['equals', 'not-equals', 'greater-than', 'less-than', 'contains', 'starts-with', 'ends-with']).describe('Comparison operator'),
  value: z.any().describe('Value to compare against'),
});

/**
 * Array map schema
 */
export const arrayMapSchema = z.object({
  array: z.array(z.any().describe('Array element')).describe('Array to map'),
  properties: z.array(z.string().describe("String value")).describe('List of property names to extract from each object'),
});

/**
 * Array sort schema
 */
export const arraySortSchema = z.object({
  array: z.array(z.any().describe('Array element')).describe('Array to sort'),
  property: z.string().describe('Property name to sort by (use dot notation for nested properties)'),
  order: z.enum(['asc', 'desc']).default('asc').describe('Sort order: ascending or descending'),
});

/**
 * Array group by schema
 */
export const arrayGroupBySchema = z.object({
  array: z.array(z.any().describe('Array element')).describe('Array to group'),
  property: z.string().describe('Property name to group by'),
});

/**
 * Object pick schema
 */
export const objectPickSchema = z.object({
  object: z.record(z.any().describe('Property value')).describe('Source object'),
  properties: z.array(z.string().describe("String value")).describe('List of property names to pick'),
});

/**
 * Object omit schema
 */
export const objectOmitSchema = z.object({
  object: z.record(z.any().describe('Property value')).describe('Source object'),
  properties: z.array(z.string().describe("String value")).describe('List of property names to omit'),
});

/**
 * Transformer tools configuration
 */
export type TransformerToolsConfig = Record<string, never>;
