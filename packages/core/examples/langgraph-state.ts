/**
 * LangGraph State Integration Example
 *
 * This example demonstrates how to use AgentForge's state utilities
 * with LangGraph to create type-safe, validated state management.
 */

import { StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { createStateAnnotation, validateState } from '../src/langgraph/state.js';

// Define state configuration with Zod schemas and reducers
const stateConfig = {
  messages: {
    schema: z.array(z.string()),
    reducer: (left: string[], right: string[]) => [...left, ...right],
    default: () => [],
    description: 'Chat message history',
  },
  context: {
    schema: z.record(z.string(), z.any()),
    default: () => ({}),
    description: 'Conversation context',
  },
  stepCount: {
    schema: z.number(),
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
    description: 'Number of processing steps',
  },
};

// Create LangGraph annotation
const AgentState = createStateAnnotation(stateConfig);

// Type inference works!
type State = typeof AgentState.State;

// Define nodes
const processInput = (state: State) => {
  console.log('Processing input...');
  console.log('Current messages:', state.messages);

  return {
    messages: ['Processed user input'],
    stepCount: 1,
  };
};

const generateResponse = (state: State) => {
  console.log('Generating response...');
  console.log('Step count:', state.stepCount);

  return {
    messages: ['Generated AI response'],
    context: { lastAction: 'generate' },
    stepCount: 1,
  };
};

const validateOutput = (state: State) => {
  console.log('Validating output...');

  // Use our validation utility
  try {
    const validated = validateState(state, stateConfig);
    console.log('✓ State is valid');
    return {
      messages: ['Output validated'],
      stepCount: 1,
    };
  } catch (error) {
    console.error('✗ State validation failed:', error);
    return {
      messages: ['Validation failed'],
      stepCount: 1,
    };
  }
};

// Build the graph
const workflow = new StateGraph(AgentState)
  .addNode('process', processInput)
  .addNode('generate', generateResponse)
  .addNode('validate', validateOutput)
  .addEdge('__start__', 'process')
  .addEdge('process', 'generate')
  .addEdge('generate', 'validate')
  .addEdge('validate', '__end__');

const app = workflow.compile();

// Run the graph
async function main() {
  console.log('=== LangGraph State Integration Example ===\n');

  const initialState = {
    messages: ['Hello, AI!'],
    context: { userId: 'user-123' },
    stepCount: 0,
  };

  console.log('Initial state:', initialState);
  console.log('\nRunning workflow...\n');

  const result = await app.invoke(initialState);

  console.log('\n=== Final State ===');
  console.log('Messages:', result.messages);
  console.log('Context:', result.context);
  console.log('Total steps:', result.stepCount);

  // Demonstrate validation
  console.log('\n=== Validation Example ===');

  const validState = {
    messages: ['test'],
    context: {},
    stepCount: 5,
  };

  const invalidState = {
    messages: 'not an array', // Invalid!
    context: {},
    stepCount: 5,
  };

  try {
    validateState(validState, stateConfig);
    console.log('✓ Valid state passed validation');
  } catch (error) {
    console.error('✗ Valid state failed validation');
  }

  try {
    validateState(invalidState, stateConfig);
    console.error('✗ Invalid state passed validation (should not happen!)');
  } catch (error) {
    console.log('✓ Invalid state correctly rejected');
  }
}

main().catch(console.error);

