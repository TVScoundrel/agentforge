/**
 * Custom ReAct Workflow Example
 *
 * This example demonstrates how to build a custom ReAct workflow
 * using the individual node creators and custom routing logic.
 *
 * This is useful when you need:
 * - Custom stop conditions
 * - Additional nodes in the workflow
 * - Custom routing logic
 * - Integration with other patterns
 * - Fine-grained control over the ReAct loop
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/react/04-custom-workflow.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { StateGraph, END } from '@langchain/langgraph';
import {
  ReActState,
  createReasoningNode,
  createActionNode,
  createObservationNode,
  type ReActStateType,
} from '../../src/react/index.js';
import { ToolRegistry } from '@agentforge/core';
import { z } from 'zod';

// Define a simple search tool
const searchTool = {
  name: 'search',
  description: 'Search for information on a topic',
  schema: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }: { query: string }) => {
    // Simulated search results
    const results: Record<string, string> = {
      'quantum computing': 'Quantum computing uses quantum mechanics principles to process information...',
      'machine learning': 'Machine learning is a subset of AI that enables systems to learn from data...',
      'blockchain': 'Blockchain is a distributed ledger technology that ensures secure transactions...',
    };

    const normalizedQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(results)) {
      if (normalizedQuery.includes(key)) {
        return { result: value, source: 'Knowledge Base' };
      }
    }

    return { result: 'No relevant information found.', source: 'None' };
  },
};

async function main() {
  console.log('🔧 Custom ReAct Workflow Example\n');

  // Create a tool registry
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(searchTool);

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create individual nodes
  const reasoningNode = createReasoningNode(
    llm,
    toolRegistry.getAll(),
    'You are a helpful research assistant.',
    10,
    true // verbose
  );

  const actionNode = createActionNode(
    toolRegistry.getAll(),
    true // verbose
  );

  const observationNode = createObservationNode(
    true // verbose
  );

  // Custom validation node
  const validationNode = async (state: ReActStateType): Promise<Partial<ReActStateType>> => {
    console.log('[Validation] Checking response quality...');

    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage?.content?.toString() || '';

    // Custom validation logic
    if (content.length < 50) {
      console.log('[Validation] ⚠️  Response too short, continuing...');
      return { iteration: state.iteration };
    }

    if (!content.includes('quantum') && state.messages[0]?.content?.toString().includes('quantum')) {
      console.log('[Validation] ⚠️  Response missing key terms, continuing...');
      return { iteration: state.iteration };
    }

    console.log('[Validation] ✅ Response quality acceptable');
    return {};
  };

  // Custom stop condition
  const shouldContinue = (state: ReActStateType): string => {
    // Check if we have a final answer (no pending tool calls)
    const lastMessage = state.messages[state.messages.length - 1];
    const hasFinalAnswer = lastMessage && !lastMessage.additional_kwargs?.tool_calls;

    if (hasFinalAnswer) {
      console.log('[Router] → Routing to validation');
      return 'validate';
    }

    // Check iteration limit
    if (state.iteration >= 10) {
      console.log('[Router] → Max iterations reached, ending');
      return 'end';
    }

    // Check if we have tool calls to execute
    const hasToolCalls = lastMessage?.additional_kwargs?.tool_calls?.length > 0;
    if (hasToolCalls) {
      console.log('[Router] → Routing to action');
      return 'action';
    }

    console.log('[Router] → Routing to reasoning');
    return 'reasoning';
  };

  const shouldContinueAfterValidation = (state: ReActStateType): string => {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage?.content?.toString() || '';

    // If validation passed (good quality), end
    if (content.length >= 50) {
      console.log('[Router] → Validation passed, ending');
      return 'end';
    }

    // Otherwise, continue reasoning
    console.log('[Router] → Validation failed, continuing');
    return 'reasoning';
  };

  // Build the custom workflow
  // @ts-expect-error - LangGraph's complex generic types don't infer well
  const workflow = new StateGraph(ReActState)
    .addNode('reasoning', reasoningNode)
    .addNode('action', actionNode)
    .addNode('observation', observationNode)
    .addNode('validation', validationNode);

  // Add edges
  workflow
    .addEdge('__start__', 'reasoning')
    .addConditionalEdges(
      'reasoning',
      shouldContinue as any,
      {
        action: 'action',
        validate: 'validation',
        reasoning: 'reasoning',
        end: END,
      }
    )
    .addEdge('action', 'observation')
    .addEdge('observation', 'reasoning')
    .addConditionalEdges(
      'validation',
      shouldContinueAfterValidation as any,
      {
        end: END,
        reasoning: 'reasoning',
      }
    );

  // Compile the workflow
  const agent = workflow.compile();

  // Run the custom workflow
  const query = 'What is quantum computing and why is it important?';

  console.log('📝 Query:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80) + '\n');

  const result = await agent.invoke({
    messages: [new HumanMessage(query)],
    iteration: 0,
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));

  console.log(`\n🔢 Total Iterations: ${result.iteration}`);
  console.log(`💭 Thoughts: ${result.thoughts?.length || 0}`);
  console.log(`🔧 Actions: ${result.actions?.length || 0}`);
  console.log(`👁️  Observations: ${result.observations?.length || 0}`);

  console.log('\n✅ Final Answer:');
  const finalMessage = result.messages[result.messages.length - 1];
  console.log(`  ${finalMessage.content}\n`);

  console.log('='.repeat(80));
  console.log('\n💡 Key Takeaways:');
  console.log('  1. Individual nodes can be composed into custom workflows');
  console.log('  2. Custom routing logic provides fine-grained control');
  console.log('  3. Additional nodes (like validation) can be added');
  console.log('  4. Stop conditions can be customized for specific needs\n');
}

// Run the example
main().catch(console.error);

