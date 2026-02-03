/**
 * Data Transformer Tools
 * 
 * Tools for transforming, filtering, mapping, and manipulating data structures.
 */

export * from './types.js';
export { createArrayFilterTool } from './tools/array-filter.js';
export { createArrayMapTool } from './tools/array-map.js';
export { createArraySortTool } from './tools/array-sort.js';
export { createArrayGroupByTool } from './tools/array-group-by.js';
export { createObjectPickTool } from './tools/object-pick.js';
export { createObjectOmitTool } from './tools/object-omit.js';

import { createArrayFilterTool } from './tools/array-filter.js';
import { createArrayMapTool } from './tools/array-map.js';
import { createArraySortTool } from './tools/array-sort.js';
import { createArrayGroupByTool } from './tools/array-group-by.js';
import { createObjectPickTool } from './tools/object-pick.js';
import { createObjectOmitTool } from './tools/object-omit.js';
import type { TransformerToolsConfig } from './types.js';

/**
 * Default array filter tool instance
 */
export const arrayFilter = createArrayFilterTool();

/**
 * Default array map tool instance
 */
export const arrayMap = createArrayMapTool();

/**
 * Default array sort tool instance
 */
export const arraySort = createArraySortTool();

/**
 * Default array group by tool instance
 */
export const arrayGroupBy = createArrayGroupByTool();

/**
 * Default object pick tool instance
 */
export const objectPick = createObjectPickTool();

/**
 * Default object omit tool instance
 */
export const objectOmit = createObjectOmitTool();

/**
 * All transformer tools
 */
export const transformerTools = [arrayFilter, arrayMap, arraySort, arrayGroupBy, objectPick, objectOmit];

/**
 * Create transformer tools with custom configuration
 */
export function createTransformerTools(config: TransformerToolsConfig = {}) {
  return [
    createArrayFilterTool(),
    createArrayMapTool(),
    createArraySortTool(),
    createArrayGroupByTool(),
    createObjectPickTool(),
    createObjectOmitTool(),
  ];
}

