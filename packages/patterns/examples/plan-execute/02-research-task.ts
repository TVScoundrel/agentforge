/**
 * Research Task with Plan-Execute Pattern
 *
 * This example demonstrates using the Plan-Execute pattern for research tasks
 * that require gathering information from multiple sources and synthesizing results.
 *
 * This is particularly useful for:
 * - Multi-source research
 * - Information synthesis
 * - Structured data gathering
 * - Report generation
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/plan-execute/02-research-task.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createPlanExecuteAgent } from '../../src/plan-execute/index.js';
import { ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Define research tools
const searchTool = {
  metadata: {
    name: 'search',
    description: 'Search for information on a topic',
    category: ToolCategory.WEB,
  },
  schema: z.object({
    query: z.string().describe('Search query'),
    source: z.enum(['academic', 'news', 'general']).optional(),
  }),
  invoke: async ({ query, source = 'general' }: { query: string; source?: string }) => {
    // Simulated search results
    const results: Record<string, any> = {
      'quantum computing': {
        academic: 'Quantum computing leverages quantum mechanics for computation...',
        news: 'Major tech companies invest billions in quantum computing research...',
        general: 'Quantum computers use qubits instead of classical bits...',
      },
      'AI developments': {
        academic: 'Recent advances in transformer architectures have enabled...',
        news: 'New AI models show remarkable capabilities in reasoning...',
        general: 'Artificial intelligence continues to evolve rapidly...',
      },
    };

    for (const [key, value] of Object.entries(results)) {
      if (query.toLowerCase().includes(key)) {
        return {
          query,
          source,
          content: value[source] || value.general,
          relevance: 0.9,
        };
      }
    }

    return {
      query,
      source,
      content: 'No specific information found.',
      relevance: 0.3,
    };
  },
};

const summarizeTool = {
  name: 'summarize',
  description: 'Summarize text content',
  schema: z.object({
    text: z.string().describe('Text to summarize'),
    maxLength: z.number().optional().describe('Maximum summary length'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ text, maxLength = 100 }: { text: string; maxLength?: number }) => {
    // Simple summarization (in practice, would use LLM)
    const summary = text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;

    return {
      original_length: text.length,
      summary_length: summary.length,
      summary,
    };
  },
};

const compareTool = {
  name: 'compare',
  description: 'Compare multiple pieces of information',
  schema: z.object({
    items: z.array(z.string()).describe('Items to compare'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ items }: { items: string[] }) => {
    return {
      count: items.length,
      comparison: `Compared ${items.length} items`,
      similarities: 'Common themes identified',
      differences: 'Key differences noted',
    };
  },
};

const synthesizeTool = {
  name: 'synthesize',
  description: 'Synthesize information into a coherent report',
  schema: z.object({
    sources: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ sources }: { sources: Array<{ title: string; content: string }> }) => {
    const report = `
# Research Synthesis Report

## Sources Analyzed: ${sources.length}

${sources.map((s, i) => `### ${i + 1}. ${s.title}\n${s.content}`).join('\n\n')}

## Key Findings
- Multiple perspectives gathered
- Information synthesized
- Comprehensive overview provided
    `.trim();

    return { report, source_count: sources.length };
  },
};

async function main() {
  console.log('🔬 Research Task with Plan-Execute Pattern\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.2,
  });

  // Create a Plan-Execute agent for research
  const agent = createPlanExecuteAgent({
    planner: {
      model: llm,
      maxSteps: 6,
      systemPrompt: `You are a research planning assistant.
        Create a structured plan to gather and synthesize information.
        Break down research into clear, sequential steps.`,
    },
    executor: {
      tools: [searchTool, summarizeTool, compareTool, synthesizeTool],
      parallel: false,
    },
    replanner: {
      model: llm,
      replanThreshold: 0.7,
    },
    maxIterations: 5,
    verbose: true,
  });

  // Research query
  const query = 'Research quantum computing and AI developments, then create a synthesis report';

  console.log('📝 Research Query:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80) + '\n');

  const result = await agent.invoke({
    input: query,
  });

  // Display the plan
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESEARCH PLAN');
  console.log('='.repeat(80) + '\n');

  if (result.plan) {
    result.plan.steps.forEach((step, idx) => {
      console.log(`${idx + 1}. ${step.description}`);
      if (step.tool) console.log(`   Tool: ${step.tool}`);
      console.log();
    });
  }

  // Display execution progress
  console.log('='.repeat(80));
  console.log('📊 EXECUTION PROGRESS');
  console.log('='.repeat(80) + '\n');

  result.pastSteps?.forEach((step, idx) => {
    console.log(`✓ Step ${idx + 1}: ${step.description}`);
    console.log(`  Status: ${step.status}`);
    if (step.result) {
      const resultStr = JSON.stringify(step.result, null, 2);
      console.log(`  Result: ${resultStr.substring(0, 150)}...`);
    }
    console.log();
  });

  // Display final report
  console.log('='.repeat(80));
  console.log('📄 FINAL RESEARCH REPORT');
  console.log('='.repeat(80) + '\n');
  console.log(result.response);

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Key Takeaways:');
  console.log('  1. Plan-Execute excels at structured research tasks');
  console.log('  2. Each step builds on previous results');
  console.log('  3. Clear plan makes progress trackable');
  console.log('  4. Replanning adapts to unexpected results\n');
}

// Run the example
main().catch(console.error);

