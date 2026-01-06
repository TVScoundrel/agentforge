/**
 * Custom Multi-Agent Workflow Example
 *
 * This example demonstrates building a custom multi-agent workflow using
 * individual nodes and custom routing logic.
 *
 * Features:
 * - Custom supervisor node with rule-based routing
 * - Custom worker nodes with specialized logic
 * - Custom aggregator with weighted results
 * - Manual workflow construction
 *
 * This is useful when you need:
 * - Fine-grained control over the workflow
 * - Custom routing logic
 * - Specialized node behavior
 * - Complex coordination patterns
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/multi-agent/04-custom-workflow.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END } from '@langchain/langgraph';
import {
  MultiAgentState,
  createSupervisorNode,
  createWorkerNode,
  createAggregatorNode,
  type MultiAgentStateType,
} from '../../src/multi-agent/index.js';
import { z } from 'zod';

// Define specialized tools
const validatorTool = {
  name: 'validate',
  description: 'Validate input data',
  schema: z.object({
    data: z.any().describe('Data to validate'),
  }),
  execute: async ({ data }: { data: any }) => {
    console.log(`  [Validator] Validating data`);
    return { valid: true, data, issues: [] };
  },
};

const processorTool = {
  name: 'process',
  description: 'Process validated data',
  schema: z.object({
    data: z.any().describe('Data to process'),
  }),
  execute: async ({ data }: { data: any }) => {
    console.log(`  [Processor] Processing data`);
    return { processed: true, data, transformations: ['normalized', 'cleaned'] };
  },
};

const enricherTool = {
  name: 'enrich',
  description: 'Enrich processed data',
  schema: z.object({
    data: z.any().describe('Data to enrich'),
  }),
  execute: async ({ data }: { data: any }) => {
    console.log(`  [Enricher] Enriching data`);
    return { enriched: true, data, additions: ['metadata', 'context'] };
  },
};

async function main() {
  console.log('🔧 Custom Multi-Agent Workflow Example\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create individual nodes
  const supervisorNode = createSupervisorNode({
    llm,
    routingStrategy: {
      type: 'rule-based',
      rules: [
        {
          condition: (state) => !state.workerResults || state.workerResults.length === 0,
          workerId: 'validator',
        },
        {
          condition: (state) => state.workerResults?.length === 1,
          workerId: 'processor',
        },
        {
          condition: (state) => state.workerResults?.length === 2,
          workerId: 'enricher',
        },
      ],
      defaultWorkerId: 'validator',
    },
    systemPrompt: 'Route tasks through validation -> processing -> enrichment pipeline',
  });

  const validatorNode = createWorkerNode({
    workerId: 'validator',
    tools: [validatorTool],
    systemPrompt: 'Validate all input data for quality and completeness',
  });

  const processorNode = createWorkerNode({
    workerId: 'processor',
    tools: [processorTool],
    systemPrompt: 'Process and transform validated data',
  });

  const enricherNode = createWorkerNode({
    workerId: 'enricher',
    tools: [enricherTool],
    systemPrompt: 'Enrich processed data with additional context',
  });

  const aggregatorNode = createAggregatorNode({
    llm,
    systemPrompt: 'Combine results from all workers into final output',
  });

  // Custom quality check node
  const qualityCheckNode = async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    console.log('\n[Quality Check] Reviewing workflow results...');
    
    const allSuccessful = state.workerResults?.every(r => r.status === 'completed') ?? false;
    const hasEnoughResults = (state.workerResults?.length ?? 0) >= 3;
    
    if (allSuccessful && hasEnoughResults) {
      console.log('[Quality Check] ✅ All checks passed');
      return { status: 'aggregating' };
    } else {
      console.log('[Quality Check] ⚠️  Quality issues detected');
      return { status: 'routing' };
    }
  };

  // Build custom workflow
  const workflow = new StateGraph<MultiAgentStateType>({
    channels: MultiAgentState,
  })
    .addNode('supervisor', supervisorNode)
    .addNode('validator', validatorNode)
    .addNode('processor', processorNode)
    .addNode('enricher', enricherNode)
    .addNode('quality_check', qualityCheckNode)
    .addNode('aggregator', aggregatorNode);

  // Define edges
  workflow.addEdge('__start__', 'supervisor');

  // Conditional routing from supervisor to workers
  workflow.addConditionalEdges(
    'supervisor',
    (state) => {
      const nextWorker = state.currentTask?.assignedTo;
      if (!nextWorker) return 'quality_check';
      return nextWorker;
    },
    {
      validator: 'validator',
      processor: 'processor',
      enricher: 'enricher',
      quality_check: 'quality_check',
    }
  );

  // Workers return to supervisor
  workflow.addEdge('validator', 'supervisor');
  workflow.addEdge('processor', 'supervisor');
  workflow.addEdge('enricher', 'supervisor');

  // Quality check routes to aggregator or back to supervisor
  workflow.addConditionalEdges(
    'quality_check',
    (state) => state.status ?? 'routing',
    {
      routing: 'supervisor',
      aggregating: 'aggregator',
    }
  );

  workflow.addEdge('aggregator', END);

  // Compile the workflow
  const agent = workflow.compile();

  // Run the custom workflow
  const task = 'Process customer data: { name: "John Doe", email: "john@example.com" }';

  console.log('📝 Task:');
  console.log(`  ${task}\n`);
  console.log('='.repeat(80) + '\n');

  const result = await agent.invoke({
    input: task,
    workers: [
      {
        id: 'validator',
        name: 'Data Validator',
        description: 'Validates input data',
        capabilities: ['validation'],
        status: 'idle',
        currentLoad: 0,
      },
      {
        id: 'processor',
        name: 'Data Processor',
        description: 'Processes validated data',
        capabilities: ['processing'],
        status: 'idle',
        currentLoad: 0,
      },
      {
        id: 'enricher',
        name: 'Data Enricher',
        description: 'Enriches processed data',
        capabilities: ['enrichment'],
        status: 'idle',
        currentLoad: 0,
      },
    ],
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 WORKFLOW RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log('✅ Final Response:');
  console.log(`  ${result.response}\n`);

  if (result.workerResults && result.workerResults.length > 0) {
    console.log('🔄 Workflow Steps:');
    result.workerResults.forEach((wr, idx) => {
      console.log(`  ${idx + 1}. ${wr.workerId}: ${wr.status}`);
      if (wr.result) {
        console.log(`     Result: ${JSON.stringify(wr.result).substring(0, 100)}...`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
}

// Run the example
main().catch(console.error);

