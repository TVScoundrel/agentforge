/**
 * XML Parser Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { XMLParser } from 'fast-xml-parser';
import { xmlParserSchema } from '../types.js';

/**
 * Create XML parser tool
 */
export function createXmlParserTool() {
  return toolBuilder()
    .name('xml-parser')
    .description('Parse XML string into a JavaScript object. Supports attributes, CDATA, and nested elements.')
    .category(ToolCategory.UTILITY)
    .tags(['xml', 'parse', 'data'])
    .schema(xmlParserSchema)
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
}

