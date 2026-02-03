/**
 * XML Tools
 * 
 * Tools for parsing and generating XML data.
 */

export * from './types.js';
export { createXmlParserTool } from './tools/xml-parser.js';
export { createXmlGeneratorTool } from './tools/xml-generator.js';
export { createXmlToJsonTool } from './tools/xml-to-json.js';
export { createJsonToXmlTool } from './tools/json-to-xml.js';

import { createXmlParserTool } from './tools/xml-parser.js';
import { createXmlGeneratorTool } from './tools/xml-generator.js';
import { createXmlToJsonTool } from './tools/xml-to-json.js';
import { createJsonToXmlTool } from './tools/json-to-xml.js';
import type { XmlToolsConfig } from './types.js';

/**
 * Default XML parser tool instance
 */
export const xmlParser = createXmlParserTool();

/**
 * Default XML generator tool instance
 */
export const xmlGenerator = createXmlGeneratorTool();

/**
 * Default XML to JSON converter tool instance
 */
export const xmlToJson = createXmlToJsonTool();

/**
 * Default JSON to XML converter tool instance
 */
export const jsonToXml = createJsonToXmlTool();

/**
 * All XML tools
 */
export const xmlTools = [xmlParser, xmlGenerator, xmlToJson, jsonToXml];

/**
 * Create XML tools with custom configuration
 */
export function createXmlTools(config: XmlToolsConfig = {}) {
  const {
    defaultRootName = 'root',
    defaultFormat = false,
    defaultIndentSize = 2,
  } = config;

  return [
    createXmlParserTool(),
    createXmlGeneratorTool(defaultRootName, defaultFormat, defaultIndentSize),
    createXmlToJsonTool(),
    createJsonToXmlTool(defaultRootName, defaultFormat),
  ];
}

