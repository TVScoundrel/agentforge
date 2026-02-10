/**
 * Research Team Multi-Agent Example
 *
 * This example demonstrates a research team with specialized workers:
 * - Data Collector: Gathers information from various sources
 * - Analyst: Analyzes and processes data
 * - Writer: Synthesizes findings into reports
 *
 * This pattern is useful for:
 * - Complex research tasks
 * - Multi-source data gathering
 * - Specialized analysis workflows
 * - Report generation
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/multi-agent/02-research-team.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { MultiAgentSystemBuilder } from '../../src/multi-agent/index.js';
import { ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Data Collector Tools
const searchTool = {
  name: 'search',
  description: 'Search for information on a topic',
  schema: z.object({
    query: z.string().describe('Search query'),
    sources: z.array(z.string()).optional().describe('Specific sources to search'),
  }),
  metadata: {
    category: 'data',
  },
  invoke: async ({ query, sources }: { query: string; sources?: string[] }) => {
    console.log(`  [Data Collector] Searching for: ${query}`);
    if (sources) console.log(`  [Data Collector] Sources: ${sources.join(', ')}`);

    // Simulated search results
    return {
      query,
      results: [
        { title: `Research on ${query} - Part 1`, snippet: `Key findings about ${query}...`, source: 'Academic Journal' },
        { title: `${query} Analysis`, snippet: `Detailed analysis of ${query}...`, source: 'Research Paper' },
        { title: `${query} Overview`, snippet: `Comprehensive overview of ${query}...`, source: 'Encyclopedia' },
      ],
      count: 3,
    };
  },
};

const fetchDataTool = {
  name: 'fetch_data',
  description: 'Fetch specific data points or statistics',
  schema: z.object({
    dataType: z.string().describe('Type of data to fetch'),
    parameters: z.record(z.any()).optional().describe('Additional parameters'),
  }),
  metadata: {
    category: 'data',
  },
  invoke: async ({ dataType, parameters }: { dataType: string; parameters?: Record<string, any> }) => {
    console.log(`  [Data Collector] Fetching ${dataType} data`);

    // Simulated data
    return {
      dataType,
      values: [42, 58, 73, 91, 105],
      metadata: { source: 'Database', timestamp: new Date().toISOString() },
      parameters,
    };
  },
};

// Analyst Tools
const analyzeTool = {
  name: 'analyze',
  description: 'Perform statistical or qualitative analysis on data',
  schema: z.object({
    data: z.any().describe('Data to analyze'),
    analysisType: z.enum(['statistical', 'qualitative', 'comparative']).describe('Type of analysis'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ data, analysisType }: { data: any; analysisType: string }) => {
    console.log(`  [Analyst] Performing ${analysisType} analysis`);

    // Simulated analysis
    return {
      analysisType,
      findings: [
        'Significant trend identified in the data',
        'Strong correlation between variables',
        'Notable outliers detected',
      ],
      confidence: 0.85,
      recommendations: ['Further investigation needed', 'Consider additional data sources'],
    };
  },
};

const validateTool = {
  name: 'validate',
  description: 'Validate data quality and reliability',
  schema: z.object({
    data: z.any().describe('Data to validate'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ data }: { data: any }) => {
    console.log(`  [Analyst] Validating data quality`);

    return {
      isValid: true,
      quality: 'high',
      issues: [],
      confidence: 0.92,
    };
  },
};

// Writer Tools
const generateReportTool = {
  name: 'generate_report',
  description: 'Generate a structured report from findings',
  schema: z.object({
    findings: z.array(z.string()).describe('Key findings to include'),
    format: z.enum(['summary', 'detailed', 'executive']).describe('Report format'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ findings, format }: { findings: string[]; format: string }) => {
    console.log(`  [Writer] Generating ${format} report`);

    return {
      format,
      sections: ['Introduction', 'Methodology', 'Findings', 'Conclusion'],
      content: `${format.toUpperCase()} REPORT\n\nKey Findings:\n${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
      wordCount: 500,
    };
  },
};

const citeTool = {
  metadata: {
    name: 'cite',
    description: 'Generate citations for sources',
    category: ToolCategory.UTILITY,
  },
  schema: z.object({
    sources: z.array(z.string()).describe('Sources to cite'),
    style: z.enum(['APA', 'MLA', 'Chicago']).describe('Citation style'),
  }),
  invoke: async ({ sources, style }: { sources: string[]; style: string }) => {
    console.log(`  [Writer] Generating ${style} citations`);

    return {
      style,
      citations: sources.map((s, i) => `[${i + 1}] ${s} (${style} format)`),
    };
  },
};

async function main() {
  console.log('🔬 Research Team Multi-Agent Example\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.3,
  });

  // Create multi-agent system with skill-based routing using builder
  const builder = new MultiAgentSystemBuilder({
    supervisor: {
      model: llm,
      strategy: 'skill-based',
      systemPrompt: `You are a research team supervisor.
        Route tasks to the most appropriate specialist:
        - Data Collector: for gathering information
        - Analyst: for analyzing data
        - Writer: for creating reports`,
    },
    aggregator: {
      model: llm,
      systemPrompt: 'Synthesize research findings into a comprehensive response.',
    },
    maxIterations: 10,
    verbose: true,
  });

  // Register research team workers
  builder.registerWorkers([
    {
      name: 'data_collector',
      description: 'Gathers information and data from various sources',
      capabilities: ['search', 'data_collection', 'information_gathering'],
      tools: [searchTool, fetchDataTool],
      systemPrompt: 'You are a data collection specialist. Gather comprehensive information from multiple sources.',
    },
    {
      name: 'analyst',
      description: 'Analyzes data and identifies patterns and insights',
      capabilities: ['analysis', 'statistics', 'validation', 'data_quality'],
      tools: [analyzeTool, validateTool],
      systemPrompt: 'You are a data analyst. Perform rigorous analysis and validate findings.',
    },
    {
      name: 'writer',
      description: 'Creates reports and documentation from research findings',
      capabilities: ['writing', 'reporting', 'documentation', 'citations'],
      tools: [generateReportTool, citeTool],
      systemPrompt: 'You are a technical writer. Create clear, well-structured reports.',
    },
  ]);

  // Build the system
  const system = builder.build();

  // Research task
  const task = `Research the impact of artificial intelligence on healthcare.
    Gather data, analyze trends, and create a summary report.`;

  console.log('📝 Research Task:');
  console.log(`  ${task}\n`);
  console.log('='.repeat(80) + '\n');

  const result = await system.invoke({
    input: task,
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESEARCH RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log('✅ Final Report:');
  console.log(`  ${result.response}\n`);

  if (result.workerResults && result.workerResults.length > 0) {
    console.log('👥 Worker Contributions:');
    result.workerResults.forEach((wr, idx) => {
      console.log(`  ${idx + 1}. ${wr.workerId}: ${wr.status}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

// Run the example
main().catch(console.error);

