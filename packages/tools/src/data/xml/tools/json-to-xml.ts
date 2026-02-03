/**
 * JSON to XML Converter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { XMLBuilder } from 'fast-xml-parser';
import { jsonToXmlSchema } from '../types.js';

/**
 * Create JSON to XML converter tool
 */
export function createJsonToXmlTool(defaultRootName = 'root', defaultFormat = false) {
  return toolBuilder()
    .name('json-to-xml')
    .description('Convert JSON string to XML. Each object key becomes an XML element.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'xml', 'convert', 'data'])
    .schema(jsonToXmlSchema)
    .implement(async (input) => {
      try {
        const data = JSON.parse(input.json);
        const rootName = input.rootName ?? defaultRootName;
        const format = input.format ?? defaultFormat;

        const builder = new XMLBuilder({
          format,
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
}

