/**
 * Data Transformer Tool
 * 
 * Transform, filter, map, and manipulate data structures.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

/**
 * Array filter tool
 */
export const arrayFilter = toolBuilder()
  .name('array-filter')
  .description('Filter an array based on a property value. Supports equality, comparison, and contains operations.')
  .category(ToolCategory.UTILITY)
  .tags(['array', 'filter', 'data', 'transform'])
  .schema(z.object({
    array: z.array(z.any().describe('Array element')).describe('Array to filter'),
    property: z.string().describe('Property name to filter by (use dot notation for nested properties)'),
    operator: z.enum(['equals', 'not-equals', 'greater-than', 'less-than', 'contains', 'starts-with', 'ends-with']).describe('Comparison operator'),
    value: z.any().describe('Value to compare against'),
  }))
  .implement(async (input) => {
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const filtered = input.array.filter((item) => {
      const itemValue = getNestedValue(item, input.property);
      
      switch (input.operator) {
        case 'equals':
          return itemValue === input.value;
        case 'not-equals':
          return itemValue !== input.value;
        case 'greater-than':
          return itemValue > input.value;
        case 'less-than':
          return itemValue < input.value;
        case 'contains':
          return String(itemValue).includes(String(input.value));
        case 'starts-with':
          return String(itemValue).startsWith(String(input.value));
        case 'ends-with':
          return String(itemValue).endsWith(String(input.value));
        default:
          return false;
      }
    });

    return {
      filtered,
      originalCount: input.array.length,
      filteredCount: filtered.length,
    };
  })
  .build();

/**
 * Array map tool
 */
export const arrayMap = toolBuilder()
  .name('array-map')
  .description('Extract specific properties from each object in an array. Creates a new array with only the selected properties.')
  .category(ToolCategory.UTILITY)
  .tags(['array', 'map', 'data', 'transform'])
  .schema(z.object({
    array: z.array(z.any().describe('Array element')).describe('Array to map'),
    properties: z.array(z.string().describe("String value")).describe('List of property names to extract from each object'),
  }))
  .implement(async (input) => {
    const mapped = input.array.map((item) => {
      const result: any = {};
      for (const prop of input.properties) {
        // Support dot notation
        const value = prop.split('.').reduce((current, key) => current?.[key], item);
        result[prop] = value;
      }
      return result;
    });

    return {
      mapped,
      count: mapped.length,
    };
  })
  .build();

/**
 * Array sort tool
 */
export const arraySort = toolBuilder()
  .name('array-sort')
  .description('Sort an array by a property value. Supports ascending and descending order.')
  .category(ToolCategory.UTILITY)
  .tags(['array', 'sort', 'data', 'transform'])
  .schema(z.object({
    array: z.array(z.any().describe('Array element')).describe('Array to sort'),
    property: z.string().describe('Property name to sort by (use dot notation for nested properties)'),
    order: z.enum(['asc', 'desc']).default('asc').describe('Sort order: ascending or descending'),
  }))
  .implement(async (input) => {
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const sorted = [...input.array].sort((a, b) => {
      const aValue = getNestedValue(a, input.property);
      const bValue = getNestedValue(b, input.property);
      
      if (aValue < bValue) return input.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return input.order === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      sorted,
      count: sorted.length,
    };
  })
  .build();

/**
 * Array group by tool
 */
export const arrayGroupBy = toolBuilder()
  .name('array-group-by')
  .description('Group an array of objects by a property value. Returns an object with groups as keys.')
  .category(ToolCategory.UTILITY)
  .tags(['array', 'group', 'data', 'transform'])
  .schema(z.object({
    array: z.array(z.any().describe('Array element')).describe('Array to group'),
    property: z.string().describe('Property name to group by'),
  }))
  .implement(async (input) => {
    const groups: Record<string, any[]> = {};
    
    for (const item of input.array) {
      const key = String(item[input.property]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    return {
      groups,
      groupCount: Object.keys(groups).length,
      totalItems: input.array.length,
    };
  })
  .build();

/**
 * Object pick tool
 */
export const objectPick = toolBuilder()
  .name('object-pick')
  .description('Create a new object with only the specified properties from the source object.')
  .category(ToolCategory.UTILITY)
  .tags(['object', 'pick', 'data', 'transform'])
  .schema(z.object({
    object: z.record(z.any().describe('Property value')).describe('Source object'),
    properties: z.array(z.string().describe("String value")).describe('List of property names to pick'),
  }))
  .implement(async (input) => {
    const picked: Record<string, any> = {};
    
    for (const prop of input.properties) {
      if (prop in input.object) {
        picked[prop] = input.object[prop];
      }
    }

    return picked;
  })
  .build();

/**
 * Object omit tool
 */
export const objectOmit = toolBuilder()
  .name('object-omit')
  .description('Create a new object excluding the specified properties from the source object.')
  .category(ToolCategory.UTILITY)
  .tags(['object', 'omit', 'data', 'transform'])
  .schema(z.object({
    object: z.record(z.any().describe('Property value')).describe('Source object'),
    properties: z.array(z.string().describe("String value")).describe('List of property names to omit'),
  }))
  .implement(async (input) => {
    const omitted: Record<string, any> = { ...input.object };
    
    for (const prop of input.properties) {
      delete omitted[prop];
    }

    return omitted;
  })
  .build();

