/**
 * XML to JSON Converter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { XMLParser } from 'fast-xml-parser';
import { xmlToJsonSchema } from '../types.js';

/**
 * Create XML to JSON converter tool
 */
export function createXmlToJsonTool() {
  return toolBuilder()
    .name('xml-to-json')
    .description('Convert XML string to JSON. Preserves structure and can include or exclude attributes.')
    .category(ToolCategory.UTILITY)
    .tags(['xml', 'json', 'convert', 'data'])
    .schema(xmlToJsonSchema)
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
}

