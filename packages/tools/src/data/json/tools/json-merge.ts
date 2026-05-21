/**
 * JSON Merge Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { jsonMergeSchema } from '../types.js';

type MergeObject = Record<string, unknown>;

function isMergeObject(value: unknown): value is MergeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function setMergeProperty(target: MergeObject, key: string, value: unknown): void {
  // Preserve user-visible keys like "__proto__" as own enumerable data properties
  // without letting them mutate the target object's prototype.
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function cloneMergeObject(source: MergeObject): MergeObject {
  const output: MergeObject = {};

  for (const [key, value] of Object.entries(source)) {
    if (isMergeObject(value)) {
      setMergeProperty(output, key, cloneMergeObject(value));
      continue;
    }

    setMergeProperty(output, key, value);
  }

  return output;
}

function deepMerge(target: MergeObject, source: MergeObject): MergeObject {
  const output = cloneMergeObject(target);

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = output[key];
    if (isMergeObject(sourceValue) && isMergeObject(targetValue)) {
      setMergeProperty(output, key, deepMerge(targetValue, sourceValue));
      continue;
    }

    if (isMergeObject(sourceValue)) {
      setMergeProperty(output, key, cloneMergeObject(sourceValue));
      continue;
    }

    setMergeProperty(output, key, sourceValue);
  }

  return output;
}

function shallowMerge(objects: readonly MergeObject[]): MergeObject {
  const output: MergeObject = {};

  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      setMergeProperty(output, key, value);
    }
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
        return shallowMerge(input.objects);
      }
    })
    .build();
}
