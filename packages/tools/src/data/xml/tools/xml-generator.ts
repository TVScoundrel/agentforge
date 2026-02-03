/**
 * XML Generator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { XMLBuilder } from 'fast-xml-parser';
import { xmlGeneratorSchema } from '../types.js';

/**
 * Create XML generator tool
 */
export function createXmlGeneratorTool(defaultRootName = 'root', defaultFormat = false, defaultIndentSize = 2) {
  return toolBuilder()
    .name('xml-generator')
    .description('Convert a JavaScript object to XML string. Supports attributes, CDATA, and nested elements.')
    .category(ToolCategory.UTILITY)
    .tags(['xml', 'generate', 'stringify', 'data'])
    .schema(xmlGeneratorSchema)
    .implement(async (input) => {
      try {
        const indentSize = input.indentSize ?? defaultIndentSize;
        const rootName = input.rootName ?? defaultRootName;
        const format = input.format ?? defaultFormat;

        const builder = new XMLBuilder({
          format,
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
}

