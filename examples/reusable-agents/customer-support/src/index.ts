/**
 * Reusable Customer Support Agent
 * 
 * A configurable customer support agent that can be customized with different
 * tools, models, and system prompts. Demonstrates best practices for creating
 * reusable agents with AgentForge.
 * 
 * @module reusable-agents/customer-support
 */

import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { ToolRegistry, toolBuilder, ToolCategory, type Tool } from '@agentforge/core';
import { currentDateTime, createAskHumanTool } from '@agentforge/tools';
import { z } from 'zod';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { loadPrompt } from './prompt-loader.js';

/**
 * Configuration schema for the customer support agent
 */
export const CustomerSupportConfigSchema = z.object({
  // Model configuration
  model: z.custom<BaseLanguageModel>().optional(),
  temperature: z.number().min(0).max(2).optional(),
  
  // Tool configuration
  customTools: z.array(z.custom<Tool>()).optional(),
  toolRegistry: z.custom<ToolRegistry>().optional(),
  enabledCategories: z.array(z.nativeEnum(ToolCategory)).optional(),
  
  // Feature flags
  enableHumanEscalation: z.boolean().optional(),
  enableTicketCreation: z.boolean().optional(),
  enableKnowledgeBase: z.boolean().optional(),
  
  // Behavior configuration
  maxIterations: z.number().int().positive().max(50).optional(),
  systemPrompt: z.string().optional(),
  
  // Business configuration
  companyName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  escalationThreshold: z.enum(['low', 'medium', 'high']).optional(),
});

export type CustomerSupportConfig = z.infer<typeof CustomerSupportConfigSchema>;

/**
 * Build system prompt from template with variable substitution
 *
 * Loads the prompt from prompts/system.md and renders it with the provided variables.
 * This pattern keeps prompts separate from code, making them easier to:
 * - Read and understand
 * - Modify without touching code
 * - Version control separately
 * - Share across teams
 *
 * @param config - Agent configuration
 * @returns Rendered system prompt
 */
function buildSystemPrompt(config: CustomerSupportConfig): string {
  const {
    systemPrompt,
    companyName,
    supportEmail,
    enableHumanEscalation,
    enableTicketCreation,
    enableKnowledgeBase,
  } = config;

  // Allow complete custom override
  if (systemPrompt) {
    return systemPrompt;
  }

  // Load and render prompt template with variables
  return loadPrompt('system', {
    companyName,
    supportEmail,
    enableHumanEscalation,
    enableTicketCreation,
    enableKnowledgeBase,
  });
}

/**
 * Create a configurable customer support agent
 * 
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const agent = createCustomerSupportAgent();
 * 
 * // With custom configuration
 * const agent = createCustomerSupportAgent({
 *   companyName: 'Acme Corp',
 *   enableHumanEscalation: true,
 *   temperature: 0.5,
 * });
 * 
 * // With custom tools
 * const agent = createCustomerSupportAgent({
 *   customTools: [myCustomTool],
 *   enableTicketCreation: true,
 * });
 * ```
 * 
 * @param config - Configuration options for the agent
 * @returns Configured ReAct agent ready to use
 */
export function createCustomerSupportAgent(config: CustomerSupportConfig = {}) {
  // Validate configuration
  const validConfig = CustomerSupportConfigSchema.parse(config);
  
  // Extract configuration with defaults
  const {
    model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: validConfig.temperature ?? 0.7,
    }),
    customTools = [],
    toolRegistry,
    enabledCategories = [],
    enableHumanEscalation = false,
    enableTicketCreation = false,
    enableKnowledgeBase = false,
    maxIterations = 10,
  } = validConfig;
  
  // Create or use provided tool registry
  const registry = toolRegistry || new ToolRegistry();
  
  // Register core tools
  registry.register(currentDateTime);
  
  // Register custom tools
  if (customTools.length > 0) {
    registry.registerMany(customTools);
  }
  
  // Add feature-specific tools
  if (enableHumanEscalation) {
    registry.register(createAskHumanTool());
  }

  if (enableTicketCreation) {
    const createTicketTool = toolBuilder()
      .name('create-support-ticket')
      .description('Create a support ticket for tracking customer issues')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        title: z.string().describe('Brief title of the issue'),
        description: z.string().describe('Detailed description of the issue'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Priority level'),
        category: z.string().describe('Issue category (e.g., billing, technical, account)'),
      }))
      .implement(async ({ title, description, priority, category }) => {
        // In a real implementation, this would integrate with a ticketing system
        const ticketId = `TICKET-${Date.now()}`;
        console.log(`[TICKET CREATED] ${ticketId}:`, { title, priority, category });
        return {
          ticketId,
          status: 'created',
          title,
          description,
          priority,
          category,
          createdAt: new Date().toISOString(),
        };
      })
      .build();

    registry.register(createTicketTool);
  }

  if (enableKnowledgeBase) {
    const searchKnowledgeBaseTool = toolBuilder()
      .name('search-knowledge-base')
      .description('Search the knowledge base for solutions to common issues')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        query: z.string().describe('Search query for the knowledge base'),
        category: z.string().optional().describe('Filter by category'),
      }))
      .implement(async ({ query, category }) => {
        // In a real implementation, this would query a knowledge base
        console.log(`[KB SEARCH] Query: "${query}", Category: ${category || 'all'}`);
        return {
          results: [
            {
              id: 'kb-1',
              title: 'How to reset your password',
              content: 'To reset your password, click on "Forgot Password" on the login page...',
              relevance: 0.95,
            },
            {
              id: 'kb-2',
              title: 'Billing FAQ',
              content: 'Common billing questions and answers...',
              relevance: 0.78,
            },
          ],
          totalResults: 2,
        };
      })
      .build();

    registry.register(searchKnowledgeBaseTool);
  }

  // Filter tools by enabled categories if specified
  const tools = enabledCategories.length > 0
    ? enabledCategories.flatMap(cat => registry.getByCategory(cat))
    : registry.getAll();

  // Build system prompt
  const systemPrompt = buildSystemPrompt(validConfig);

  // Create and return the agent
  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations,
  });
}

/**
 * Export default instance for quick usage
 */
export const customerSupportAgent = createCustomerSupportAgent();

