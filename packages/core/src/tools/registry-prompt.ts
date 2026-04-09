import type { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { toLangChainTools as convertToLangChainTools } from '../langchain/converter.js';
import { Tool, ToolCategory, ToolRelations } from './types.js';

type RegistryTool = Tool<unknown, unknown>;

export interface RegistryPromptOptions {
  includeExamples?: boolean;
  includeNotes?: boolean;
  includeLimitations?: boolean;
  includeRelations?: boolean;
  groupByCategory?: boolean;
  categories?: ToolCategory[];
  maxExamplesPerTool?: number;
  minimal?: boolean;
}

export function convertRegistryToolsToLangChain(
  tools: RegistryTool[]
): DynamicStructuredTool[] {
  return convertToLangChainTools(tools);
}

export function generateRegistryPrompt(
  tools: RegistryTool[],
  options: RegistryPromptOptions = {}
): string {
  const {
    includeExamples = false,
    includeNotes = false,
    includeLimitations = false,
    includeRelations = false,
    groupByCategory = false,
    categories,
    maxExamplesPerTool,
    minimal = false,
  } = options;

  let toolsToInclude = tools;

  if (categories && categories.length > 0) {
    toolsToInclude = tools.filter((tool) => categories.includes(tool.metadata.category));
  }

  if (toolsToInclude.length === 0) {
    return 'No tools available.';
  }

  const lines: string[] = ['Available Tools:', ''];

  if (groupByCategory) {
    const toolsByCategory = new Map<ToolCategory, RegistryTool[]>();

    for (const tool of toolsToInclude) {
      const category = tool.metadata.category;
      if (!toolsByCategory.has(category)) {
        toolsByCategory.set(category, []);
      }
      toolsByCategory.get(category)!.push(tool);
    }

    for (const [category, categoryTools] of toolsByCategory) {
      lines.push(`${category.toUpperCase().replace(/-/g, ' ')} TOOLS:`);

      for (const tool of categoryTools) {
        lines.push(...formatToolForPrompt(tool, {
          includeExamples,
          includeNotes,
          includeLimitations,
          includeRelations,
          maxExamplesPerTool,
          minimal,
        }));
      }

      lines.push('');
    }
  } else {
    for (const tool of toolsToInclude) {
      lines.push(...formatToolForPrompt(tool, {
        includeExamples,
        includeNotes,
        includeLimitations,
        includeRelations,
        maxExamplesPerTool,
        minimal,
      }));
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

function formatToolForPrompt(
  tool: RegistryTool,
  options: RegistryPromptOptions
): string[] {
  const { metadata } = tool;
  const lines: string[] = [];

  if (options.minimal) {
    lines.push(`## ${metadata.name}`);

    let hasContent = false;

    if (options.includeRelations && metadata.relations) {
      const relationLines = formatRelations(metadata.relations);
      if (relationLines.length > 0) {
        lines.push(...relationLines);
        hasContent = true;
      }
    }

    if (options.includeExamples && metadata.examples && metadata.examples.length > 0) {
      const maxExamples = options.maxExamplesPerTool || metadata.examples.length;
      const examples = metadata.examples.slice(0, maxExamples);

      for (const example of examples) {
        lines.push(`  Example: ${example.description}`);
        lines.push(`    Input: ${JSON.stringify(example.input)}`);
        if (example.explanation) {
          lines.push(`    ${example.explanation}`);
        }
        hasContent = true;
      }
    }

    if (options.includeNotes && metadata.usageNotes) {
      lines.push(`  Notes: ${metadata.usageNotes}`);
      hasContent = true;
    }

    if (options.includeLimitations && metadata.limitations && metadata.limitations.length > 0) {
      lines.push('  Limitations:');
      for (const limitation of metadata.limitations) {
        lines.push(`    - ${limitation}`);
      }
      hasContent = true;
    }

    if (!hasContent) {
      return [];
    }

    return lines;
  }

  lines.push(`- ${metadata.name}: ${metadata.description}`);

  const schemaShape = getSchemaShape(tool.schema);
  if (schemaShape) {
    const params = Object.keys(schemaShape);
    if (params.length > 0) {
      const paramDescriptions = params.map((param) => {
        const field = schemaShape[param];
        const typeName = field._def.typeName;
        const type = typeName.replace('Zod', '').toLowerCase();
        return `${param} (${type})`;
      });
      lines.push(`  Parameters: ${paramDescriptions.join(', ')}`);
    }
  }

  if (options.includeRelations && metadata.relations) {
    const relationLines = formatRelations(metadata.relations);
    if (relationLines.length > 0) {
      lines.push(...relationLines);
    }
  }

  if (options.includeNotes && metadata.usageNotes) {
    lines.push(`  Notes: ${metadata.usageNotes}`);
  }

  if (options.includeExamples && metadata.examples && metadata.examples.length > 0) {
    const maxExamples = options.maxExamplesPerTool || metadata.examples.length;
    const examples = metadata.examples.slice(0, maxExamples);

    for (const example of examples) {
      lines.push(`  Example: ${example.description}`);
      lines.push(`    Input: ${JSON.stringify(example.input)}`);
      if (example.explanation) {
        lines.push(`    ${example.explanation}`);
      }
    }
  }

  if (options.includeLimitations && metadata.limitations && metadata.limitations.length > 0) {
    lines.push('  Limitations:');
    for (const limitation of metadata.limitations) {
      lines.push(`    - ${limitation}`);
    }
  }

  return lines;
}

function formatRelations(relations: ToolRelations): string[] {
  const lines: string[] = [];

  if (relations.requires && relations.requires.length > 0) {
    lines.push(`  Requires: ${relations.requires.join(', ')}`);
  }

  if (relations.suggests && relations.suggests.length > 0) {
    lines.push(`  Suggests: ${relations.suggests.join(', ')}`);
  }

  if (relations.conflicts && relations.conflicts.length > 0) {
    lines.push(`  Conflicts: ${relations.conflicts.join(', ')}`);
  }

  if (relations.follows && relations.follows.length > 0) {
    lines.push(`  Follows: ${relations.follows.join(', ')}`);
  }

  if (relations.precedes && relations.precedes.length > 0) {
    lines.push(`  Precedes: ${relations.precedes.join(', ')}`);
  }

  return lines;
}

function getSchemaShape(
  schema: z.ZodSchema<unknown>
): z.ZodRawShape | undefined {
  if (schema instanceof z.ZodObject) {
    return schema.shape;
  }

  return undefined;
}
