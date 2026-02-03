/**
 * HTML Parser Tool
 * 
 * Parse HTML content and extract data using CSS selectors.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import * as cheerio from 'cheerio';
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
      const $ = cheerio.load(input.html);
      const $selected = $(input.selector);

      const results = $selected.map((_, el) => {
        const $el = $(el);
        const item: any = {};

        if (input.extractText) {
          item.text = $el.text().trim();
        }

        if (input.extractHtml) {
          item.html = $el.html();
        }

        if (input.extractAttributes && input.extractAttributes.length > 0) {
          item.attributes = {};
          for (const attr of input.extractAttributes) {
            const value = $el.attr(attr);
            if (value !== undefined) {
              item.attributes[attr] = value;
            }
          }
        }

        return item;
      }).get();

      return {
        count: results.length,
        results,
      };
    })
    .build();
}

