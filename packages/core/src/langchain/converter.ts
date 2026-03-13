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
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool, ToolMetadata } from '../tools/types.js';

type RuntimeSchema<TInput = unknown> = z.ZodSchema<TInput>;
type JsonSchemaObject = Record<string, unknown>;

interface LangChainConvertibleTool<TInput = unknown, TOutput = unknown> {
  metadata: ToolMetadata;
  schema: RuntimeSchema<TInput>;
  invoke(input: TInput): Promise<TOutput>;
}

function serializeToolResult(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }

  if (typeof result === 'object' && result !== null) {
    return JSON.stringify(result, null, 2);
  }

  return String(result);
}

function isJsonSchemaObject(value: unknown): value is JsonSchemaObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonSchemaDefinitionMap(
  value: unknown
): value is Record<string, JsonSchemaObject> {
  if (!isJsonSchemaObject(value)) {
    return false;
  }

  return Object.values(value).every(isJsonSchemaObject);
}

function extractToolSchema(jsonSchema: unknown): JsonSchemaObject {
  if (!isJsonSchemaObject(jsonSchema)) {
    return {};
  }

  const ref = jsonSchema.$ref;
  const definitions = jsonSchema.definitions;

  if (typeof ref !== 'string' || !isJsonSchemaDefinitionMap(definitions)) {
    return jsonSchema;
  }

  const refName = ref.replace('#/definitions/', '');
  return definitions[refName] ?? jsonSchema;
}

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
export function toLangChainTool<TInput, TOutput>(
  tool: Tool<TInput, TOutput>
): DynamicStructuredTool<RuntimeSchema<TInput>, TInput, TInput, string> {
  return new DynamicStructuredTool<RuntimeSchema<TInput>, TInput, TInput, string>({
    name: tool.metadata.name,
    description: tool.metadata.description,
    schema: tool.schema,
    func: async (input) => serializeToolResult(await tool.invoke(input)),
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
  tools: readonly LangChainConvertibleTool[]
): DynamicStructuredTool[] {
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
export function getToolJsonSchema<TInput, TOutput>(
  tool: Tool<TInput, TOutput>
): JsonSchemaObject {
  const jsonSchema = zodToJsonSchema(tool.schema, {
    name: tool.metadata.name,
    $refStrategy: 'none', // Don't use $ref for nested schemas
  });

  return extractToolSchema(jsonSchema);
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
export function getToolDescription<TInput, TOutput>(
  tool: Tool<TInput, TOutput>
): string {
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
