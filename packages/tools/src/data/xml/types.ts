/**
 * XML Tools Types
 * 
 * Type definitions and schemas for XML tools.
 */

import { z } from 'zod';

/**
 * XML parser schema
 */
export const xmlParserSchema = z.object({
  xml: z.string().describe('XML string to parse'),
  ignoreAttributes: z.boolean().default(false).describe('Ignore XML attributes'),
  parseAttributeValue: z.boolean().default(true).describe('Parse attribute values (numbers, booleans)'),
  trimValues: z.boolean().default(true).describe('Trim whitespace from text values'),
});

/**
 * XML generator schema
 */
export const xmlGeneratorSchema = z.object({
  data: z.any().describe('Object to convert to XML'),
  rootName: z.string().default('root').describe('Name of the root XML element'),
  format: z.boolean().default(false).describe('Format XML with indentation'),
  indentSize: z.number().default(2).describe('Number of spaces for indentation (when format is true)'),
});

/**
 * XML to JSON schema
 */
export const xmlToJsonSchema = z.object({
  xml: z.string().describe('XML string to convert'),
  ignoreAttributes: z.boolean().default(false).describe('Ignore XML attributes in conversion'),
  pretty: z.boolean().default(false).describe('Format JSON with indentation'),
});

/**
 * JSON to XML schema
 */
export const jsonToXmlSchema = z.object({
  json: z.string().describe('JSON string to convert'),
  rootName: z.string().default('root').describe('Name of the root XML element'),
  format: z.boolean().default(false).describe('Format XML with indentation'),
});

/**
 * XML tools configuration
 */
export interface XmlToolsConfig {
  defaultRootName?: string;
  defaultFormat?: boolean;
  defaultIndentSize?: number;
}

