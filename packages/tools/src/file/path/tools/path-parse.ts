/**
 * Path Parse Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { pathParseSchema } from '../types.js';
import * as path from 'path';

/**
 * Create path parse tool
 */
export function createPathParseTool() {
  return toolBuilder()
    .name('path-parse')
    .description('Parse a file path into its components (directory, filename, extension, etc.).')
    .category(ToolCategory.FILE_SYSTEM)
    .tags(['path', 'parse', 'filesystem'])
    .schema(pathParseSchema)
    .implement(async (input) => {
      const parsed = path.parse(input.path);
      
      return {
        root: parsed.root,
        dir: parsed.dir,
        base: parsed.base,
        name: parsed.name,
        ext: parsed.ext,
        isAbsolute: path.isAbsolute(input.path),
      };
    })
    .build();
}

