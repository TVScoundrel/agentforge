/**
 * Complex Planning with Parallel Execution
 *
 * This example demonstrates advanced Plan-Execute features including:
 * - Parallel execution of independent steps
 * - Complex dependency management
 * - Replanning based on results
 * - Progress tracking
 *
 * This is particularly useful for:
 * - Complex workflows with dependencies
 * - Tasks that can be parallelized
 * - Adaptive planning
 * - Performance-critical applications
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/plan-execute/03-complex-planning.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createPlanExecuteAgent } from '../../src/plan-execute/index.js';
import { ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Define tools for a data analysis workflow
const fetchDataTool = {
  metadata: {
    name: 'fetch-data',
    description: 'Fetch data from a source',
    category: ToolCategory.DATABASE,
  },
  schema: z.object({
    source: z.string().describe('Data source name'),
  }),
  invoke: async ({ source }: { source: string }) => {
    // Simulated data fetching
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    const datasets: Record<string, any> = {
      'sales': { records: 1000, columns: ['date', 'amount', 'product'], size: '50KB' },
      'customers': { records: 500, columns: ['id', 'name', 'email'], size: '25KB' },
      'products': { records: 100, columns: ['id', 'name', 'price'], size: '10KB' },
    };

    return datasets[source] || { error: 'Source not found' };
  },
};

const validateDataTool = {
  name: 'validate_data',
  description: 'Validate data quality',
  schema: z.object({
    dataset: z.string().describe('Dataset name'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ dataset }: { dataset: string }) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      dataset,
      valid: true,
      issues: [],
      quality_score: 0.95,
    };
  },
};

const transformDataTool = {
  name: 'transform_data',
  description: 'Transform and clean data',
  schema: z.object({
    dataset: z.string(),
    operations: z.array(z.string()),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ dataset, operations }: { dataset: string; operations: string[] }) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      dataset,
      operations_applied: operations,
      rows_processed: 1000,
      success: true,
    };
  },
};

const analyzeDataTool = {
  name: 'analyze_data',
  description: 'Perform statistical analysis',
  schema: z.object({
    dataset: z.string(),
    metrics: z.array(z.string()),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ dataset, metrics }: { dataset: string; metrics: string[] }) => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      dataset,
      metrics: metrics.map(m => ({
        name: m,
        value: Math.random() * 100,
      })),
      insights: ['Trend identified', 'Outliers detected'],
    };
  },
};

const visualizeTool = {
  name: 'create_visualization',
  description: 'Create data visualizations',
  schema: z.object({
    data: z.string(),
    chart_type: z.enum(['bar', 'line', 'pie', 'scatter']),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ data, chart_type }: { data: string; chart_type: string }) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      chart_type,
      data_source: data,
      file: `${chart_type}_chart.png`,
      success: true,
    };
  },
};

const generateReportTool = {
  name: 'generate_report',
  description: 'Generate final analysis report',
  schema: z.object({
    sections: z.array(z.string()),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ sections }: { sections: string[] }) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      report: `
# Data Analysis Report

${sections.map((s, i) => `## ${i + 1}. ${s}\n\nAnalysis complete.`).join('\n\n')}

## Summary
- All data sources processed
- Analysis completed successfully
- Visualizations generated
      `.trim(),
      sections: sections.length,
      generated_at: new Date().toISOString(),
    };
  },
};

async function main() {
  console.log('🔄 Complex Planning with Parallel Execution\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create agent with parallel execution enabled
  const agent = createPlanExecuteAgent({
    planner: {
      model: llm,
      maxSteps: 10,
      systemPrompt: `You are an expert data analysis planner.
        Create efficient plans that:
        1. Identify independent steps that can run in parallel
        2. Respect data dependencies
        3. Optimize for performance
        4. Include validation and error handling`,
    },
    executor: {
      tools: [
        fetchDataTool,
        validateDataTool,
        transformDataTool,
        analyzeDataTool,
        visualizeTool,
        generateReportTool,
      ],
      parallel: true, // Enable parallel execution
      stepTimeout: 5000,
    },
    replanner: {
      model: llm,
      replanThreshold: 0.8,
      systemPrompt: 'Replan if data quality issues are found or steps fail',
    },
    maxIterations: 5,
    verbose: true,
  });

  const query = `Analyze sales, customers, and products data:
    1. Fetch all three datasets
    2. Validate and transform them
    3. Perform statistical analysis
    4. Create visualizations
    5. Generate a comprehensive report`;

  console.log('📝 Analysis Task:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();
  const result = await agent.invoke({ input: query });
  const duration = Date.now() - startTime;

  // Display plan
  console.log('\n' + '='.repeat(80));
  console.log('📋 EXECUTION PLAN');
  console.log('='.repeat(80) + '\n');

  if (result.plan) {
    result.plan.steps.forEach((step, idx) => {
      const deps = step.dependencies && step.dependencies.length > 0
        ? ` (depends on: ${step.dependencies.join(', ')})`
        : ' (independent)';
      console.log(`${idx + 1}. ${step.description}${deps}`);
    });
  }

  // Display execution summary
  console.log('\n' + '='.repeat(80));
  console.log('⚡ EXECUTION SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log(`Total Steps: ${result.pastSteps?.length || 0}`);
  console.log(`Execution Time: ${duration}ms`);
  console.log(`Status: ${result.status}`);
  console.log(`Parallel Execution: Enabled`);

  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80) + '\n');
  console.log(result.response);

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Key Takeaways:');
  console.log('  1. Parallel execution significantly improves performance');
  console.log('  2. Dependencies are automatically managed');
  console.log('  3. Replanning handles unexpected issues');
  console.log('  4. Complex workflows become manageable\n');
}

main().catch(console.error);

