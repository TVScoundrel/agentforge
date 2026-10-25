/**
 * HTML Parser Tool
 * 
 * Parse HTML content and extract data using CSS selectors.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createHtmlDocument } from '../../html-document.js';
import { htmlParserSchema } from '../types.js';

/**
 * Create an HTML parser tool
 * 
 * @returns HTML parser tool
 * 
 * @example
 * ```ts
 * const parser = createHtmlParserTool();
 * const result = await parser.execute({
 *   html: '<div class="content"><h1>Title</h1><p>Text</p></div>',
 *   selector: '.content h1'
 * });
 * ```
 */
export function createHtmlParserTool() {
  return toolBuilder()
    .name('html-parser')
    .description('Parse HTML content and extract data using CSS selectors. Returns text, attributes, and structure of selected elements.')
    .category(ToolCategory.WEB)
    .tags(['html', 'parser', 'css', 'selector', 'extract'])
    .schema(htmlParserSchema)
    .implement(async (input) => {
      // Keep the published permissive result type while extraction stays precisely typed.
      const results: any[] = createHtmlDocument(input.html).select(input.selector).elements(input);

      return {
        count: results.length,
        results,
      };
    })
    .build();
}

