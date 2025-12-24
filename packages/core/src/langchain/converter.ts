/**
 * LangChain Integration - Tool Converter
 * 
 * Converts AgentForge tools to LangChain StructuredTool format.
 * 
 * @example
 * ```ts
 * import { toLangChainTool } from '@agentforge/core';
 * 
 * const langchainTool = toLangChainTool(agentforgeTool);
 * ```
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool } from '../tools/types.js';

/**
 * Convert an AgentForge tool to a LangChain DynamicStructuredTool
 * 
 * This allows AgentForge tools to be used with LangChain agents and chains.
 * 
 * @param tool - The AgentForge tool to convert
 * @returns A LangChain DynamicStructuredTool
 * 
 * @example
 * ```ts
 * const readFileTool = toolBuilder()
 *   .name('read-file')
 *   .description('Read a file from the file system')
 *   .category(ToolCategory.FILE_SYSTEM)
 *   .schema(z.object({
 *     path: z.string().describe('Path to the file'),
 *   }))
 *   .implement(async ({ path }) => {
 *     return fs.readFileSync(path, 'utf-8');
 *   })
 *   .build();
 * 
 * // Convert to LangChain tool
 * const langchainTool = toLangChainTool(readFileTool);
 * 
 * // Use with LangChain agent
 * const agent = createAgent({
 *   model: new ChatOpenAI(),
 *   tools: [langchainTool],
 * });
 * ```
 */
export function toLangChainTool(
  tool: Tool<any, any>
): DynamicStructuredTool<any> {
  return new DynamicStructuredTool<any>({
    name: tool.metadata.name,
    description: tool.metadata.description,
    schema: tool.schema as any,
    func: async (input: any) => {
      const result = await tool.execute(input);

      // LangChain tools must return strings
      // Convert result to string if it's not already
      if (typeof result === 'string') {
        return result;
      }

      // For objects/arrays, return JSON string
      if (typeof result === 'object' && result !== null) {
        return JSON.stringify(result, null, 2);
      }

      // For primitives, convert to string
      return String(result);
    },
  });
}

/**
 * Convert multiple AgentForge tools to LangChain tools
 * 
 * @param tools - Array of AgentForge tools
 * @returns Array of LangChain DynamicStructuredTools
 * 
 * @example
 * ```ts
 * const tools = [readFileTool, writeFileTool, searchTool];
 * const langchainTools = toLangChainTools(tools);
 * 
 * const agent = createAgent({
 *   model: new ChatOpenAI(),
 *   tools: langchainTools,
 * });
 * ```
 */
export function toLangChainTools(
  tools: Tool<any, any>[]
): DynamicStructuredTool<any>[] {
  return tools.map(toLangChainTool);
}

/**
 * Get the JSON Schema representation of a tool's input schema
 *
 * This is useful for debugging or for integrations that need the raw JSON Schema.
 *
 * @param tool - The AgentForge tool
 * @returns JSON Schema object
 *
 * @example
 * ```ts
 * const schema = getToolJsonSchema(readFileTool);
 * console.log(JSON.stringify(schema, null, 2));
 * ```
 */
export function getToolJsonSchema(tool: Tool<any, any>): Record<string, any> {
  const jsonSchema = zodToJsonSchema(tool.schema, {
    name: tool.metadata.name,
    $refStrategy: 'none', // Don't use $ref for nested schemas
  }) as any; // Type assertion needed because zod-to-json-schema types are incomplete

  // If the schema has a $ref and definitions, extract the actual schema
  if (jsonSchema.$ref && jsonSchema.definitions) {
    const refName = jsonSchema.$ref.replace('#/definitions/', '');
    return jsonSchema.definitions[refName] || jsonSchema;
  }

  return jsonSchema;
}

/**
 * Get tool metadata in a format suitable for LLM prompts
 * 
 * This creates a human-readable description of the tool including
 * its metadata, usage notes, limitations, and examples.
 * 
 * @param tool - The AgentForge tool
 * @returns Formatted tool description
 * 
 * @example
 * ```ts
 * const description = getToolDescription(readFileTool);
 * console.log(description);
 * // Output:
 * // read-file: Read a file from the file system
 * // Category: file-system
 * // Tags: file, read, io
 * // ...
 * ```
 */
export function getToolDescription(tool: Tool<any, any>): string {
  const { metadata } = tool;
  const parts: string[] = [];

  // Basic info
  parts.push(`${metadata.name}: ${metadata.description}`);
  
  if (metadata.displayName) {
    parts.push(`Display Name: ${metadata.displayName}`);
  }
  
  parts.push(`Category: ${metadata.category}`);
  
  if (metadata.tags && metadata.tags.length > 0) {
    parts.push(`Tags: ${metadata.tags.join(', ')}`);
  }
  
  if (metadata.usageNotes) {
    parts.push(`\nUsage Notes: ${metadata.usageNotes}`);
  }
  
  if (metadata.limitations && metadata.limitations.length > 0) {
    parts.push(`\nLimitations:`);
    metadata.limitations.forEach((limit) => {
      parts.push(`  - ${limit}`);
    });
  }
  
  if (metadata.examples && metadata.examples.length > 0) {
    parts.push(`\nExamples:`);
    metadata.examples.forEach((example, i) => {
      parts.push(`  ${i + 1}. ${example.description}`);
      if (example.explanation) {
        parts.push(`     ${example.explanation}`);
      }
    });
  }
  
  return parts.join('\n');
}

