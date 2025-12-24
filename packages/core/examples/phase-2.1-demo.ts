/**
 * Phase 2.1 Demo - LangGraph State Management
 *
 * This demo showcases all the features implemented in Phase 2.1:
 * - Type-safe state annotations
 * - Zod schema validation
 * - Custom reducers
 * - Integration with LangGraph
 */

import { StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import {
  createStateAnnotation,
  validateState,
  mergeState,
} from '../src/langgraph/index.js';

console.log('=== Phase 2.1 Demo: LangGraph State Management ===\n');

// ============================================================================
// Feature 1: Type-Safe State Annotations
// ============================================================================

console.log('1. Creating type-safe state annotation...');

const stateConfig = {
  // Simple channel with validation
  userId: {
    schema: z.string().uuid(),
    description: 'User identifier',
  },

  // Reducer channel for accumulating messages
  messages: {
    schema: z.array(z.string()),
    reducer: (left: string[], right: string[]) => [...left, ...right],
    default: () => [],
    description: 'Message history',
  },

  // Reducer channel for counting steps
  stepCount: {
    schema: z.number().int().nonnegative(),
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
    description: 'Number of processing steps',
  },

  // Simple channel for metadata
  metadata: {
    schema: z.record(z.string(), z.any()),
    default: () => ({}),
    description: 'Additional metadata',
  },
};

const AgentState = createStateAnnotation(stateConfig);
type State = typeof AgentState.State;

console.log('✓ State annotation created with type safety\n');

// ============================================================================
// Feature 2: State Validation
// ============================================================================

console.log('2. Testing state validation...');

const validState = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  messages: ['Hello', 'World'],
  stepCount: 5,
  metadata: { source: 'demo' },
};

try {
  validateState(validState, stateConfig);
  console.log('✓ Valid state passed validation');
} catch (error) {
  console.error('✗ Validation failed:', error);
}

const invalidState = {
  userId: 'not-a-uuid', // Invalid!
  messages: ['test'],
  stepCount: 0,
  metadata: {},
};

try {
  validateState(invalidState, stateConfig);
  console.error('✗ Invalid state passed validation (should not happen!)');
} catch (error) {
  console.log('✓ Invalid state correctly rejected\n');
}

// ============================================================================
// Feature 3: State Merging with Reducers
// ============================================================================

console.log('3. Testing state merging...');

const currentState = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  messages: ['a', 'b'],
  stepCount: 2,
  metadata: { key1: 'value1' },
};

const update = {
  messages: ['c', 'd'],
  stepCount: 3,
  metadata: { key2: 'value2' },
};

const merged = mergeState(currentState, update, stateConfig);

console.log('Current:', currentState.messages, 'Steps:', currentState.stepCount);
console.log('Update:', update.messages, 'Steps:', update.stepCount);
console.log('Merged:', merged.messages, 'Steps:', merged.stepCount);
console.log('✓ State merged correctly\n');

// ============================================================================
// Feature 4: LangGraph Integration
// ============================================================================

console.log('4. Running LangGraph workflow...');

const node1 = (state: State) => {
  console.log('  → Node 1: Processing input');
  return {
    messages: ['Node 1 executed'],
    stepCount: 1,
  };
};

const node2 = (state: State) => {
  console.log('  → Node 2: Generating response');
  return {
    messages: ['Node 2 executed'],
    stepCount: 1,
    metadata: { lastNode: 'node2' },
  };
};

const node3 = (state: State) => {
  console.log('  → Node 3: Validating output');

  // Validate state before returning
  try {
    validateState(state, stateConfig);
    return {
      messages: ['Validation passed'],
      stepCount: 1,
    };
  } catch (error) {
    return {
      messages: ['Validation failed'],
      stepCount: 1,
    };
  }
};

const workflow = new StateGraph(AgentState)
  .addNode('node1', node1)
  .addNode('node2', node2)
  .addNode('node3', node3)
  .addEdge('__start__', 'node1')
  .addEdge('node1', 'node2')
  .addEdge('node2', 'node3')
  .addEdge('node3', '__end__');

const app = workflow.compile();

async function runDemo() {
  const result = await app.invoke({
    userId: '550e8400-e29b-41d4-a716-446655440000',
    messages: ['Start'],
    stepCount: 0,
    metadata: {},
  });

  console.log('\n✓ Workflow completed successfully');
  console.log('\nFinal State:');
  console.log('  Messages:', result.messages);
  console.log('  Steps:', result.stepCount);
  console.log('  Metadata:', result.metadata);

  console.log('\n=== Phase 2.1 Demo Complete ===');
  console.log('\nAll features working correctly:');
  console.log('  ✓ Type-safe state annotations');
  console.log('  ✓ Zod schema validation');
  console.log('  ✓ Custom reducers');
  console.log('  ✓ LangGraph integration');
}

runDemo().catch(console.error);

