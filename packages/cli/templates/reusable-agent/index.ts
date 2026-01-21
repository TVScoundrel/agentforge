import { z } from 'zod';
import { createReActAgent } from '@agentforge/patterns';
import { toolBuilder, ToolCategory, ToolRegistry } from '@agentforge/core';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { ChatOpenAI } from '@langchain/openai';
import { loadPrompt } from './prompt-loader.js';

/**
 * Configuration schema for {{AGENT_NAME_PASCAL}}Agent
 */
export const {{AGENT_NAME_PASCAL}}ConfigSchema = z.object({
  // Model configuration
  model: z.custom<BaseLanguageModel>().optional(),
  temperature: z.number().min(0).max(2).optional(),

  // Tool configuration
  customTools: z.array(z.any()).optional(),
  toolRegistry: z.custom<ToolRegistry>().optional(),
  enabledCategories: z.array(z.nativeEnum(ToolCategory)).optional(),

  // Feature flags
  enableExampleFeature: z.boolean().optional(),

  // Behavior configuration
  maxIterations: z.number().min(1).max(50).optional(),
  systemPrompt: z.string().optional(),

  // Domain-specific configuration
  organizationName: z.string().optional(),
  description: z.string().optional(),
});

export type {{AGENT_NAME_PASCAL}}Config = z.infer<typeof {{AGENT_NAME_PASCAL}}ConfigSchema>;

/**
 * Default configuration for {{AGENT_NAME_PASCAL}}Agent
 */
const DEFAULT_CONFIG: Partial<{{AGENT_NAME_PASCAL}}Config> = {
  temperature: 0.7,
  maxIterations: 10,
  enableExampleFeature: true,
};

/**
 * Build tools for the {{AGENT_NAME_CAMEL}} agent
 */
function buildTools(config: {{AGENT_NAME_PASCAL}}Config) {
  const tools = [];

  // Example built-in tool
  if (config.enableExampleFeature) {
    const exampleTool = toolBuilder()
      .name('example-action')
      .description('Perform an example action')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        input: z.string().describe('Input for the action'),
      }))
      .implement(async ({ input }) => {
        return {
          result: `Processed: ${input}`,
          success: true,
        };
      })
      .build();

    tools.push(exampleTool);
  }

  // Add custom tools from registry
  if (config.toolRegistry) {
    const registryTools = config.enabledCategories
      ? config.toolRegistry.getByCategory(config.enabledCategories)
      : config.toolRegistry.getAll();
    tools.push(...registryTools);
  }

  // Add custom tools
  if (config.customTools) {
    tools.push(...config.customTools);
  }

  return tools;
}

/**
 * Build system prompt for the {{AGENT_NAME_CAMEL}} agent
 */
function buildSystemPrompt(config: {{AGENT_NAME_PASCAL}}Config): string {
  if (config.systemPrompt) {
    return config.systemPrompt;
  }

  // Load prompt from external file with variable substitution
  return loadPrompt('system', {
    organizationName: config.organizationName || 'your organization',
    description: config.description || '{{AGENT_DESCRIPTION}}',
    enableExampleFeature: config.enableExampleFeature,
  });
}

/**
 * Create a {{AGENT_NAME_CAMEL}} agent
 * 
 * @param config - Configuration options for the agent
 * @returns A configured ReAct agent
 * 
 * @example
 * ```typescript
 * const agent = create{{AGENT_NAME_PASCAL}}Agent({
 *   organizationName: 'Acme Corp',
 *   enableExampleFeature: true,
 * });
 * 
 * const result = await agent.invoke({
 *   input: 'Your query here',
 * });
 * ```
 */
export function create{{AGENT_NAME_PASCAL}}Agent(config: {{AGENT_NAME_PASCAL}}Config = {}) {
  // Validate and merge with defaults
  const validatedConfig = {{AGENT_NAME_PASCAL}}ConfigSchema.parse({
    ...DEFAULT_CONFIG,
    ...config,
  });

  // Create model
  const model = validatedConfig.model || new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: validatedConfig.temperature,
  });

  // Build tools
  const tools = buildTools(validatedConfig);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(validatedConfig);

  // Create agent
  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations: validatedConfig.maxIterations,
  });
}

