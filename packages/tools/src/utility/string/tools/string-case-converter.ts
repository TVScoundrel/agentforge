/**
 * String Case Converter Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StringCaseConverterSchema } from '../types.js';

/**
 * Create string case converter tool
 */
export function createStringCaseConverterTool() {
  return toolBuilder()
    .name('string-case-converter')
    .description('Convert string to different cases: lowercase, uppercase, title case, camel case, snake case, kebab case.')
    .category(ToolCategory.UTILITY)
    .tags(['string', 'case', 'convert', 'transform'])
    .schema(StringCaseConverterSchema)
    .implement(async (input) => {
      let result: string;
      
      switch (input.targetCase) {
        case 'lowercase':
          result = input.text.toLowerCase();
          break;
        case 'uppercase':
          result = input.text.toUpperCase();
          break;
        case 'title':
          result = input.text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
          break;
        case 'camel':
          result = input.text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
          break;
        case 'snake':
          result = input.text
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
          break;
        case 'kebab':
          result = input.text
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          break;
        case 'pascal':
          result = input.text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
            .replace(/^./, (char) => char.toUpperCase());
          break;
        default:
          result = input.text;
      }
      
      return {
        original: input.text,
        converted: result,
        targetCase: input.targetCase,
      };
    })
    .build();
}

