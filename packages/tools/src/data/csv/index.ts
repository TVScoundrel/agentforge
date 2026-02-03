/**
 * CSV Tools
 * 
 * Tools for parsing and generating CSV data.
 */

export * from './types.js';
export { createCsvParserTool } from './tools/csv-parser.js';
export { createCsvGeneratorTool } from './tools/csv-generator.js';
export { createCsvToJsonTool } from './tools/csv-to-json.js';
export { createJsonToCsvTool } from './tools/json-to-csv.js';

import { createCsvParserTool } from './tools/csv-parser.js';
import { createCsvGeneratorTool } from './tools/csv-generator.js';
import { createCsvToJsonTool } from './tools/csv-to-json.js';
import { createJsonToCsvTool } from './tools/json-to-csv.js';
import type { CsvToolsConfig } from './types.js';

/**
 * Default CSV parser tool instance
 */
export const csvParser = createCsvParserTool();

/**
 * Default CSV generator tool instance
 */
export const csvGenerator = createCsvGeneratorTool();

/**
 * Default CSV to JSON converter tool instance
 */
export const csvToJson = createCsvToJsonTool();

/**
 * Default JSON to CSV converter tool instance
 */
export const jsonToCsv = createJsonToCsvTool();

/**
 * All CSV tools
 */
export const csvTools = [csvParser, csvGenerator, csvToJson, jsonToCsv];

/**
 * Create CSV tools with custom configuration
 */
export function createCsvTools(config: CsvToolsConfig = {}) {
  const {
    defaultDelimiter = ',',
    defaultHasHeaders = true,
    defaultSkipEmptyLines = true,
    defaultTrim = true,
  } = config;

  return [
    createCsvParserTool(defaultDelimiter, defaultHasHeaders, defaultSkipEmptyLines, defaultTrim),
    createCsvGeneratorTool(defaultDelimiter),
    createCsvToJsonTool(defaultDelimiter),
    createJsonToCsvTool(defaultDelimiter),
  ];
}

