/**
 * Vertical Data Analyst Agent
 *
 * A configurable, vertical data analyst agent built with AgentForge.
 * Demonstrates best practices for creating flexible, production-ready AI agents.
 *
 * @module vertical-agents/data-analyst
 */

import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { toolBuilder, ToolCategory, ToolRegistry, loadPrompt } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { Tool } from '@langchain/core/tools';

/**
 * Configuration schema for the data analyst agent
 */
export const DataAnalystConfigSchema = z.object({
  // Model configuration
  model: z.custom<BaseLanguageModel>().optional(),
  temperature: z.number().min(0).max(2).optional(),
  
  // Tool configuration
  customTools: z.array(z.custom<Tool>()).optional(),
  toolRegistry: z.custom<ToolRegistry>().optional(),
  enabledCategories: z.array(z.nativeEnum(ToolCategory)).optional(),
  
  // Feature flags
  enableStatisticalAnalysis: z.boolean().optional(),
  enableDataValidation: z.boolean().optional(),
  enableVisualization: z.boolean().optional(),
  enableHumanEscalation: z.boolean().optional(),
  confidentialData: z.boolean().optional(),
  
  // Behavior configuration
  maxIterations: z.number().int().positive().max(50).optional(),
  systemPrompt: z.string().optional(),
  
  // Analysis configuration
  organizationName: z.string().optional(),
  dataTypes: z.string().optional(),
  analysisDepth: z.enum(['quick', 'standard', 'deep']).optional(),
});

export type DataAnalystConfig = z.infer<typeof DataAnalystConfigSchema>;

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<DataAnalystConfig> = {
  temperature: 0.2, // Lower temperature for more consistent analysis
  enableStatisticalAnalysis: true,
  enableDataValidation: true,
  enableVisualization: true,
  enableHumanEscalation: false,
  confidentialData: false,
  maxIterations: 15,
  analysisDepth: 'standard',
};

/**
 * Build the system prompt for the data analyst agent
 */
function buildSystemPrompt(config: DataAnalystConfig): string {
  const { 
    systemPrompt, 
    organizationName, 
    dataTypes,
    enableStatisticalAnalysis,
    enableDataValidation,
    enableVisualization,
    enableHumanEscalation,
    analysisDepth,
    confidentialData,
  } = config;
  
  // Allow complete custom override
  if (systemPrompt) {
    return systemPrompt;
  }

  // Load and render prompt template with variables
  // SECURITY: organizationName and dataTypes are treated as untrusted since they
  // can be set by users. Feature flags and derived booleans are trusted.
  return loadPrompt('system', {
    trustedVariables: {
      enableStatisticalAnalysis,
      enableDataValidation,
      enableVisualization,
      enableHumanEscalation,
      analysisDepth,
      quickAnalysis: analysisDepth === 'quick',
      standardAnalysis: analysisDepth === 'standard',
      deepAnalysis: analysisDepth === 'deep',
      confidentialData,
    },
    untrustedVariables: {
      organizationName,
      dataTypes,
    },
  });
}

/**
 * Build the tools for the data analyst agent
 */
function buildTools(config: DataAnalystConfig): Tool[] {
  const tools: Tool[] = [];
  
  // Built-in tool: analyze-data
  const analyzeDataTool = toolBuilder()
    .name('analyze-data')
    .description('Analyze a dataset to identify patterns, trends, and insights')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      data: z.string().describe('The dataset to analyze (JSON, CSV, or description)'),
      question: z.string().describe('The specific question or analysis goal'),
      context: z.string().optional().describe('Additional context about the data'),
    }))
    .implement(async ({ data, question, context }) => {
      // In a real implementation, this would perform actual data analysis
      return {
        summary: 'Data analysis completed',
        insights: ['Pattern identified', 'Trend detected'],
        recommendations: ['Consider further investigation'],
      };
    })
    .build();
  
  tools.push(analyzeDataTool);
  
  // Built-in tool: calculate-statistics (when enabled)
  if (config.enableStatisticalAnalysis) {
    const calculateStatsTool = toolBuilder()
      .name('calculate-statistics')
      .description('Calculate statistical measures for a dataset')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        data: z.array(z.number().describe('A numerical value in the dataset')).describe('Numerical data to analyze'),
        metrics: z.array(z.enum(['mean', 'median', 'mode', 'stddev', 'percentiles']).describe('Statistical metric to calculate')).describe('Statistical metrics to calculate'),
      }))
      .implement(async ({ data, metrics }) => {
        // In a real implementation, this would calculate actual statistics
        return {
          mean: 0,
          median: 0,
          mode: 0,
          stddev: 0,
          percentiles: {},
        };
      })
      .build();

    tools.push(calculateStatsTool);
  }
  
  // Built-in tool: create-visualization (when enabled)
  if (config.enableVisualization) {
    const createVisualizationTool = toolBuilder()
      .name('create-visualization')
      .description('Create a chart or graph to visualize data')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        chartType: z.enum(['bar', 'line', 'scatter', 'pie', 'histogram']).describe('Type of chart to create'),
        data: z.string().describe('Data to visualize (JSON format)'),
        title: z.string().describe('Chart title'),
        xLabel: z.string().optional().describe('X-axis label'),
        yLabel: z.string().optional().describe('Y-axis label'),
      }))
      .implement(async ({ chartType, data, title, xLabel, yLabel }) => {
        // In a real implementation, this would generate actual visualizations
        return {
          chartType,
          title,
          description: `${chartType} chart created: ${title}`,
          url: 'https://example.com/chart.png',
        };
      })
      .build();

    tools.push(createVisualizationTool);
  }

  // Built-in tool: validate-data (when enabled)
  if (config.enableDataValidation) {
    const validateDataTool = toolBuilder()
      .name('validate-data')
      .description('Check data quality and identify issues like missing values, outliers, and duplicates')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        data: z.string().describe('Dataset to validate (JSON or CSV format)'),
        checks: z.array(z.enum(['missing', 'outliers', 'duplicates', 'types', 'consistency']).describe('Type of validation check to perform')).describe('Validation checks to perform'),
      }))
      .implement(async ({ data, checks }) => {
        // In a real implementation, this would perform actual validation
        return {
          valid: true,
          issues: [],
          warnings: [],
          summary: 'Data validation completed',
        };
      })
      .build();

    tools.push(validateDataTool);
  }

  // Built-in tool: ask-human (when enabled)
  if (config.enableHumanEscalation) {
    const askHumanTool = toolBuilder()
      .name('ask-human')
      .description('Escalate complex business decisions or ambiguous data questions to a human analyst')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        question: z.string().describe('The question or decision that needs human input'),
        context: z.string().describe('Context and analysis performed so far'),
        urgency: z.enum(['low', 'medium', 'high']).optional().describe('Urgency level'),
      }))
      .implement(async ({ question, context, urgency }) => {
        // In a real implementation, this would integrate with a human-in-the-loop system
        return {
          status: 'escalated',
          message: 'Question has been escalated to a human analyst',
          ticketId: 'TICKET-123',
        };
      })
      .build();

    tools.push(askHumanTool);
  }

  // Add custom tools if provided
  if (config.customTools) {
    tools.push(...config.customTools);
  }

  // Add tools from registry if provided
  if (config.toolRegistry) {
    const registryTools = config.enabledCategories
      ? config.toolRegistry.getByCategory(config.enabledCategories)
      : config.toolRegistry.getAll();
    tools.push(...registryTools);
  }

  return tools;
}

/**
 * Create a configurable data analyst agent
 *
 * @param config - Configuration options for the agent
 * @returns A ReAct agent configured for data analysis
 *
 * @example
 * ```typescript
 * // Basic usage
 * const agent = createDataAnalystAgent();
 *
 * // With custom configuration
 * const agent = createDataAnalystAgent({
 *   organizationName: 'Acme Corp',
 *   dataTypes: 'Sales, Marketing, Customer',
 *   enableStatisticalAnalysis: true,
 *   analysisDepth: 'deep',
 * });
 * ```
 */
export function createDataAnalystAgent(config: DataAnalystConfig = {}) {
  // Validate and merge with defaults
  const validatedConfig = DataAnalystConfigSchema.parse({
    ...DEFAULT_CONFIG,
    ...config,
  });

  // Create model
  const model = validatedConfig.model || new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: validatedConfig.temperature,
  });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(validatedConfig);

  // Build tools
  const tools = buildTools(validatedConfig);

  // Create and return the agent
  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations: validatedConfig.maxIterations,
  });
}

