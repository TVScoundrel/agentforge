/**
 * JSON Merge Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonMergeSchema } from '../types.js';

type MergeObject = Record<string, unknown>;

function isMergeObject(value: unknown): value is MergeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: MergeObject, source: MergeObject): MergeObject {
  const output: MergeObject = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = output[key];
    if (isMergeObject(sourceValue) && isMergeObject(targetValue)) {
      output[key] = deepMerge(targetValue, sourceValue);
      continue;
    }

    if (isMergeObject(sourceValue)) {
      output[key] = deepMerge({}, sourceValue);
      continue;
    }

    output[key] = sourceValue;
  }

  return output;
}

/**
 * Create JSON merge tool
 */
export function createJsonMergeTool() {
  return toolBuilder()
    .name('json-merge')
    .description('Merge two or more JSON objects. Later objects override earlier ones for conflicting keys.')
    .category(ToolCategory.UTILITY)
    .tags(['json', 'merge', 'combine', 'data'])
    .schema(jsonMergeSchema)
    .implement(async (input) => {
      if (input.deep) {
        return input.objects.reduce<MergeObject>((acc, obj) => deepMerge(acc, obj), {});
      } else {
        return Object.assign({}, ...input.objects);
      }
    })
    .build();
}
