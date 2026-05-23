import { z } from 'zod';
import { createTool } from './helpers.js';
import { Tool, ToolMetadata } from './types.js';
import { ToolInvoke } from './builder-implementation.js';

function assertBuildable<TInput, TOutput>(
  metadata: Partial<ToolMetadata>,
  schema?: z.ZodSchema<TInput>,
  invoke?: ToolInvoke<TOutput>,
): void {
  if (!metadata.name) {
    throw new Error('Tool name is required. Use .name() to set it.');
  }
  if (!metadata.description) {
    throw new Error('Tool description is required. Use .description() to set it.');
  }
  if (!metadata.category) {
    throw new Error('Tool category is required. Use .category() to set it.');
  }
  if (!schema) {
    throw new Error('Tool schema is required. Use .schema() to set it.');
  }
  if (!invoke) {
    throw new Error('Tool implementation is required. Use .implement() to set it.');
  }
}

export function buildTool<TInput, TOutput>(
  metadata: Partial<ToolMetadata>,
  schema?: z.ZodSchema<TInput>,
  invoke?: ToolInvoke<TOutput>,
): Tool<TInput, TOutput> {
  assertBuildable(metadata, schema, invoke);
  const finalSchema = schema as z.ZodSchema<TInput>;
  const finalInvoke = invoke as ToolInvoke<TOutput>;

  return createTool(metadata as ToolMetadata, finalSchema, async function (this: unknown, input: TInput) {
    return finalInvoke.call(this, input);
  });
}
