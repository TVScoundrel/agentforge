/**
 * Vertical Code Review Agent
 *
 * A configurable code review agent that can be customized with different
 * languages, review criteria, and tools. Demonstrates best practices for
 * creating vertical agents with AgentForge.
 *
 * @module vertical-agents/code-review
 */

import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { ToolRegistry, toolBuilder, ToolCategory, type Tool, loadPrompt } from '@agentforge/core';
import { currentDateTime, createAskHumanTool } from '@agentforge/tools';
import { z } from 'zod';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Configuration schema for the code review agent
 */
export const CodeReviewConfigSchema = z.object({
  // Model configuration
  model: z.custom<BaseLanguageModel>().optional(),
  temperature: z.number().min(0).max(2).optional(),
  
  // Tool configuration
  customTools: z.array(z.custom<Tool>()).optional(),
  toolRegistry: z.custom<ToolRegistry>().optional(),
  enabledCategories: z.array(z.nativeEnum(ToolCategory)).optional(),
  
  // Feature flags
  enableSecurityChecks: z.boolean().optional(),
  enablePerformanceChecks: z.boolean().optional(),
  enableHumanEscalation: z.boolean().optional(),
  strictMode: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  
  // Behavior configuration
  maxIterations: z.number().int().positive().max(50).optional(),
  systemPrompt: z.string().optional(),
  
  // Review configuration
  teamName: z.string().optional(),
  languages: z.string().optional(), // e.g., "TypeScript, Python, Go"
  reviewDepth: z.enum(['quick', 'standard', 'thorough']).optional(),
});

export type CodeReviewConfig = z.infer<typeof CodeReviewConfigSchema>;

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
function buildSystemPrompt(config: CodeReviewConfig): string {
  const {
    systemPrompt,
    teamName,
    languages,
    enableSecurityChecks,
    enablePerformanceChecks,
    enableHumanEscalation,
    strictMode,
    autoApprove,
  } = config;
  
  // Allow complete custom override
  if (systemPrompt) {
    return systemPrompt;
  }

  // Resolve prompts directory relative to this module (not cwd)
  // This ensures prompts are found when the package is published/consumed
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const promptsDir = join(__dirname, '../prompts');

  // Load and render prompt template with variables
  // SECURITY: teamName and languages are treated as untrusted since they
  // can be set by users. Feature flags are trusted (booleans from config).
  return loadPrompt('system', {
    trustedVariables: {
      enableSecurityChecks,
      enablePerformanceChecks,
      enableHumanEscalation,
      strictMode,
      autoApprove,
    },
    untrustedVariables: {
      teamName,
      languages,
    },
  }, promptsDir);
}

/**
 * Create a configurable code review agent
 * 
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const agent = createCodeReviewAgent();
 * 
 * // With custom configuration
 * const agent = createCodeReviewAgent({
 *   teamName: 'Platform Team',
 *   languages: 'TypeScript, Python',
 *   enableSecurityChecks: true,
 *   strictMode: true,
 * });
 * 
 * // With custom tools
 * const agent = createCodeReviewAgent({
 *   customTools: [lintTool, testCoverageTool],
 *   enablePerformanceChecks: true,
 * });
 * ```
 * 
 * @param config - Agent configuration
 * @returns Configured ReAct agent
 */
export function createCodeReviewAgent(config: CodeReviewConfig = {}) {
  // Validate configuration
  const validConfig = CodeReviewConfigSchema.parse(config);
  
  // Extract configuration with defaults
  const {
    model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: validConfig.temperature ?? 0.3, // Lower temp for more consistent reviews
    }),
    customTools = [],
    toolRegistry,
    enabledCategories,
    enableSecurityChecks = true,
    enablePerformanceChecks = true,
    enableHumanEscalation = false,
    maxIterations = 15,
    reviewDepth = 'standard',
  } = validConfig;
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(validConfig);
  
  // Setup tool registry
  const registry = toolRegistry || new ToolRegistry();
  
  // Register built-in tools
  registry.register(currentDateTime);
  
  // Add code review specific tools
  const analyzeCodeTool = toolBuilder()
    .name('analyze-code')
    .description('Analyze code for quality, security, and performance issues. Returns detailed analysis with severity levels.')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      code: z.string().describe('The code to analyze'),
      language: z.string().describe('Programming language (e.g., typescript, python, go)'),
      context: z.string().optional().describe('Additional context about the code'),
    }))
    .implement(async ({ code, language, context }) => {
      // Mock implementation - in production, this would use static analysis tools
      return {
        issues: [
          {
            severity: 'medium',
            line: 10,
            message: 'Consider extracting this logic into a separate function',
            category: 'maintainability',
          },
        ],
        metrics: {
          complexity: 5,
          linesOfCode: code.split('\n').length,
          language,
        },
        suggestions: [
          'Add error handling for edge cases',
          'Consider adding unit tests',
        ],
      };
    })
    .build();

  const checkSecurityTool = toolBuilder()
    .name('check-security')
    .description('Check code for security vulnerabilities and best practices')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      code: z.string().describe('The code to check for security issues'),
      language: z.string().describe('Programming language'),
    }))
    .implement(async ({ code, language }) => {
      // Mock implementation - in production, this would use security scanning tools
      return {
        vulnerabilities: [],
        recommendations: [
          'Ensure all user inputs are validated',
          'Use parameterized queries for database access',
        ],
        securityScore: 85,
      };
    })
    .build();

  const checkPerformanceTool = toolBuilder()
    .name('check-performance')
    .description('Analyze code for performance issues and optimization opportunities')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      code: z.string().describe('The code to analyze for performance'),
      language: z.string().describe('Programming language'),
    }))
    .implement(async ({ code, language }) => {
      // Mock implementation - in production, this would use profiling tools
      return {
        issues: [],
        optimizations: [
          'Consider caching frequently accessed data',
          'Use async/await for I/O operations',
        ],
        estimatedComplexity: 'O(n)',
      };
    })
    .build();

  // Register code review tools
  registry.register(analyzeCodeTool);

  if (enableSecurityChecks) {
    registry.register(checkSecurityTool);
  }

  if (enablePerformanceChecks) {
    registry.register(checkPerformanceTool);
  }

  // Add human escalation if enabled
  if (enableHumanEscalation) {
    const askHuman = createAskHumanTool({
      question: 'Should we approve this architectural change?',
      context: 'Code review requires human decision',
    });
    registry.register(askHuman);
  }

  // Register custom tools
  if (customTools.length > 0) {
    registry.registerMany(customTools);
  }

  // Get tools based on enabled categories or all tools
  const tools = enabledCategories && enabledCategories.length > 0
    ? enabledCategories.flatMap(cat => registry.getByCategory(cat))
    : registry.getAll();

  // Create and return the agent
  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations,
  });
}

