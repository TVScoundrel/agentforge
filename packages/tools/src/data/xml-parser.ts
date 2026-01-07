/**
 * XML Parser Tool
 * 
 * Parse and generate XML data.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/**
 * XML parser tool
 */
export const xmlParser = toolBuilder()
  .name('xml-parser')
  .description('Parse XML string into a JavaScript object. Supports attributes, CDATA, and nested elements.')
  .category(ToolCategory.UTILITY)
  .tags(['xml', 'parse', 'data'])
  .schema(z.object({
    xml: z.string().describe('XML string to parse'),
    ignoreAttributes: z.boolean().default(false).describe('Ignore XML attributes'),
    parseAttributeValue: z.boolean().default(true).describe('Parse attribute values (numbers, booleans)'),
    trimValues: z.boolean().default(true).describe('Trim whitespace from text values'),
  }))
  .implement(async (input) => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: input.ignoreAttributes,
        parseAttributeValue: input.parseAttributeValue,
        trimValues: input.trimValues,
        parseTagValue: true,
      });

      const result = parser.parse(input.xml);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse XML',
      };
    }
  })
  .build();

/**
 * XML generator tool
 */
export const xmlGenerator = toolBuilder()
  .name('xml-generator')
  .description('Convert a JavaScript object to XML string. Supports attributes, CDATA, and nested elements.')
  .category(ToolCategory.UTILITY)
  .tags(['xml', 'generate', 'stringify', 'data'])
  .schema(z.object({
    data: z.any().describe('Object to convert to XML'),
    rootName: z.string().default('root').describe('Name of the root XML element'),
    format: z.boolean().default(false).describe('Format XML with indentation'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation (when format is true)'),
  }))
  .implement(async (input) => {
    try {
      const indentSize = input.indentSize ?? 2;
      const rootName = input.rootName ?? 'root';

      const builder = new XMLBuilder({
        format: input.format ?? false,
        indentBy: ' '.repeat(indentSize),
        ignoreAttributes: false,
      });

      // Wrap data in root element if not already wrapped
      const dataToConvert = input.data[rootName] ? input.data : { [rootName]: input.data };
      const xml = builder.build(dataToConvert);

      return {
        success: true,
        xml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate XML',
      };
    }
  })
  .build();

/**
 * XML to JSON converter
 */
export const xmlToJson = toolBuilder()
  .name('xml-to-json')
  .description('Convert XML string to JSON. Preserves structure and can include or exclude attributes.')
  .category(ToolCategory.UTILITY)
  .tags(['xml', 'json', 'convert', 'data'])
  .schema(z.object({
    xml: z.string().describe('XML string to convert'),
    ignoreAttributes: z.boolean().default(false).describe('Ignore XML attributes in conversion'),
    pretty: z.boolean().default(false).describe('Format JSON with indentation'),
  }))
  .implement(async (input) => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: input.ignoreAttributes,
        parseAttributeValue: true,
        trimValues: true,
      });

      const result = parser.parse(input.xml);
      const json = input.pretty 
        ? JSON.stringify(result, null, 2)
        : JSON.stringify(result);

      return {
        success: true,
        json,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert XML to JSON',
      };
    }
  })
  .build();

/**
 * JSON to XML converter
 */
export const jsonToXml = toolBuilder()
  .name('json-to-xml')
  .description('Convert JSON string to XML. Each object key becomes an XML element.')
  .category(ToolCategory.UTILITY)
  .tags(['json', 'xml', 'convert', 'data'])
  .schema(z.object({
    json: z.string().describe('JSON string to convert'),
    rootName: z.string().default('root').describe('Name of the root XML element'),
    format: z.boolean().default(false).describe('Format XML with indentation'),
  }))
  .implement(async (input) => {
    try {
      const data = JSON.parse(input.json);
      const rootName = input.rootName ?? 'root';

      const builder = new XMLBuilder({
        format: input.format ?? false,
        indentBy: '  ',
        ignoreAttributes: false,
      });

      const dataToConvert = data[rootName] ? data : { [rootName]: data };
      const xml = builder.build(dataToConvert);

      return {
        success: true,
        xml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert JSON to XML',
      };
    }
  })
  .build();

