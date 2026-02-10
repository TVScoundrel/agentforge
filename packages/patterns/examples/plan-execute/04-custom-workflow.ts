/**
 * Custom Plan-Execute Workflow Example
 *
 * This example demonstrates how to build a custom Plan-Execute workflow
 * using the individual node creators and custom routing logic.
 *
 * This is useful when you need:
 * - Custom planning logic
 * - Additional nodes in the workflow
 * - Custom routing and decision-making
 * - Integration with other patterns
 * - Fine-grained control over execution
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/plan-execute/04-custom-workflow.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END } from '@langchain/langgraph';
import {
  PlanExecuteState,
  createPlannerNode,
  createExecutorNode,
  createReplannerNode,
  createFinisherNode,
  type PlanExecuteStateType,
} from '../../src/plan-execute/index.js';
import { ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Define a simple tool
const taskTool = {
  metadata: {
    name: 'execute-task',
    description: 'Execute a specific task',
    category: ToolCategory.UTILITY,
  },
  schema: z.object({
    task: z.string().describe('Task description'),
  }),
  invoke: async ({ task }: { task: string }) => {
    console.log(`  [Tool] Executing: ${task}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return { task, status: 'completed', result: `Completed: ${task}` };
  },
};

async function main() {
  console.log('🔧 Custom Plan-Execute Workflow Example\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create individual nodes
  const plannerNode = createPlannerNode({
    model: llm,
    maxSteps: 5,
    systemPrompt: 'Create a clear, step-by-step plan.',
  });

  const executorNode = createExecutorNode({
    tools: [taskTool],
    parallel: false,
  });

  const replannerNode = createReplannerNode({
    model: llm,
    replanThreshold: 0.8,
  });

  const finisherNode = createFinisherNode();

  // Custom validation node
  const validationNode = async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    console.log('\n[Validation] Checking plan quality...');

    if (!state.plan || state.plan.steps.length === 0) {
      console.log('[Validation] ⚠️  No plan found, needs replanning');
      return { status: 'planning' };
    }

    if (state.plan.steps.length > 10) {
      console.log('[Validation] ⚠️  Plan too complex, needs simplification');
      return { status: 'planning' };
    }

    console.log('[Validation] ✅ Plan looks good');
    return { status: 'executing' };
  };

  // Custom progress tracking node
  const progressNode = async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    const total = state.plan?.steps.length || 0;
    const completed = state.pastSteps?.length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    console.log(`\n[Progress] ${completed}/${total} steps completed (${percentage}%)`);

    // Add progress bar
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    console.log(`[Progress] ${bar} ${percentage}%`);

    return {};
  };

  // Custom routing logic
  const routeAfterPlanning = (state: PlanExecuteStateType): string => {
    console.log('\n[Router] Routing after planning...');
    return 'validate';
  };

  const routeAfterValidation = (state: PlanExecuteStateType): string => {
    console.log('[Router] Routing after validation...');
    if (state.status === 'planning') {
      return 'plan';
    }
    return 'execute';
  };

  const routeAfterExecution = (state: PlanExecuteStateType): string => {
    console.log('[Router] Routing after execution...');

    // Check if all steps are complete
    const totalSteps = state.plan?.steps.length || 0;
    const completedSteps = state.pastSteps?.length || 0;

    if (completedSteps >= totalSteps) {
      return 'finish';
    }

    // Check if we should replan
    const lastStep = state.pastSteps?.[state.pastSteps.length - 1];
    if (lastStep?.status === 'failed') {
      console.log('[Router] Step failed, triggering replan');
      return 'replan';
    }

    return 'progress';
  };

  const routeAfterProgress = (state: PlanExecuteStateType): string => {
    console.log('[Router] Routing after progress check...');
    return 'execute';
  };

  const routeAfterReplan = (state: PlanExecuteStateType): string => {
    console.log('[Router] Routing after replan...');
    return 'execute';
  };

  // Build the custom workflow
  // @ts-expect-error - LangGraph's complex generic types don't infer well
  const workflow = new StateGraph(PlanExecuteState)
    .addNode('plan', plannerNode)
    .addNode('validate', validationNode)
    .addNode('execute', executorNode)
    .addNode('progress', progressNode)
    .addNode('replan', replannerNode)
    .addNode('finish', finisherNode);

  // Add edges
  workflow
    .addEdge('__start__', 'plan')
    .addConditionalEdges('plan', routeAfterPlanning as any, {
      validate: 'validate',
    })
    .addConditionalEdges('validate', routeAfterValidation as any, {
      plan: 'plan',
      execute: 'execute',
    })
    .addConditionalEdges('execute', routeAfterExecution as any, {
      finish: 'finish',
      replan: 'replan',
      progress: 'progress',
    })
    .addConditionalEdges('progress', routeAfterProgress as any, {
      execute: 'execute',
    })
    .addConditionalEdges('replan', routeAfterReplan as any, {
      execute: 'execute',
    })
    .addEdge('finish', END);

  // Compile the workflow
  const agent = workflow.compile();

  // Run the custom workflow
  const query = 'Create a simple 3-step plan and execute it';

  console.log('📝 Query:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80) + '\n');

  const result = await agent.invoke({
    input: query,
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log('Plan:');
  result.plan?.steps.forEach((step, idx) => {
    console.log(`  ${idx + 1}. ${step.description}`);
  });

  console.log('\nCompleted Steps:');
  result.pastSteps?.forEach((step, idx) => {
    console.log(`  ✓ ${idx + 1}. ${step.description} (${step.status})`);
  });

  console.log('\nFinal Response:');
  console.log(`  ${result.response}\n`);

  console.log('='.repeat(80));
  console.log('\n💡 Key Takeaways:');
  console.log('  1. Individual nodes can be composed into custom workflows');
  console.log('  2. Custom routing provides fine-grained control');
  console.log('  3. Additional nodes (validation, progress) can be added');
  console.log('  4. Workflows can be tailored to specific needs\n');
}

main().catch(console.error);

