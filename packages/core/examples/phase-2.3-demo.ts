/**
 * Phase 2.3 Demo: Memory & Persistence Helpers
 *
 * This example demonstrates the memory and persistence utilities.
 */

import { StateGraph, Annotation } from '@langchain/langgraph';
import {
  createMemoryCheckpointer,
  generateThreadId,
  createThreadConfig,
  createConversationConfig,
  getCheckpointHistory,
  getLatestCheckpoint,
} from '../src/langgraph/index.js';

// Define a simple chat state
const ChatState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  userId: Annotation<string>(),
});

type State = typeof ChatState.State;

// Create a simple chat node
const chatNode = (state: State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const response = `Echo: ${lastMessage}`;
  return { messages: [response] };
};

// Build the graph
const workflow = new StateGraph(ChatState)
  .addNode('chat', chatNode)
  .addEdge('__start__', 'chat')
  .addEdge('chat', '__end__');

// Example 1: Basic Checkpointing
console.log('\n=== Example 1: Basic Checkpointing ===\n');

const checkpointer = createMemoryCheckpointer();
const app = workflow.compile({ checkpointer });

// Generate a thread ID
const threadId = generateThreadId();
console.log('Generated thread ID:', threadId);

// Create thread config
const config = createThreadConfig({ threadId });

// First conversation
console.log('\nFirst message:');
let result = await app.invoke(
  { messages: ['Hello!'], userId: 'user-123' },
  config
);
console.log('Messages:', result.messages);

// Second message in same thread
console.log('\nSecond message (same thread):');
result = await app.invoke({ messages: ['How are you?'], userId: 'user-123' }, config);
console.log('Messages:', result.messages);

// Example 2: Conversation Config
console.log('\n=== Example 2: Conversation Config ===\n');

const conversationConfig = createConversationConfig({
  userId: 'user-456',
  sessionId: 'session-1',
  metadata: { source: 'web' },
});

console.log('Conversation config:', {
  threadId: conversationConfig.configurable?.thread_id,
  metadata: conversationConfig.metadata,
});

result = await app.invoke(
  { messages: ['Start conversation'], userId: 'user-456' },
  conversationConfig
);
console.log('Messages:', result.messages);

// Example 3: Checkpoint History
console.log('\n=== Example 3: Checkpoint History ===\n');

// Get checkpoint history
const history = await getCheckpointHistory(checkpointer, {
  threadId,
  limit: 5,
});

console.log(`Found ${history.length} checkpoints`);
for (const checkpoint of history.slice(0, 3)) {
  console.log('- Checkpoint ID:', checkpoint.checkpoint.id);
}

// Example 4: Latest Checkpoint
console.log('\n=== Example 4: Latest Checkpoint ===\n');

const latest = await getLatestCheckpoint(checkpointer, { threadId });
if (latest) {
  console.log('Latest checkpoint ID:', latest.checkpoint.id);
  console.log('Latest checkpoint has channel values:', Object.keys(latest.checkpoint.channel_values));
}

// Example 5: Multiple Users
console.log('\n=== Example 5: Multiple Users ===\n');

// User 1
const user1Config = createConversationConfig({ userId: 'alice' });
await app.invoke({ messages: ['Alice says hi'], userId: 'alice' }, user1Config);

// User 2
const user2Config = createConversationConfig({ userId: 'bob' });
await app.invoke({ messages: ['Bob says hello'], userId: 'bob' }, user2Config);

// User 1 again - should have their own history
const alice2 = await app.invoke(
  { messages: ['Alice again'], userId: 'alice' },
  user1Config
);
console.log('Alice messages:', alice2.messages);

// User 2 again - should have their own history
const bob2 = await app.invoke({ messages: ['Bob again'], userId: 'bob' }, user2Config);
console.log('Bob messages:', bob2.messages);

// Example 6: Deterministic Thread IDs
console.log('\n=== Example 6: Deterministic Thread IDs ===\n');

const id1 = generateThreadId('user-123');
const id2 = generateThreadId('user-123');
const id3 = generateThreadId('user-456');

console.log('Same seed produces same ID:', id1 === id2);
console.log('Different seed produces different ID:', id1 !== id3);
console.log('ID 1:', id1);
console.log('ID 2:', id2);
console.log('ID 3:', id3);

// Example 7: Random Thread IDs
console.log('\n=== Example 7: Random Thread IDs ===\n');

const random1 = generateThreadId();
const random2 = generateThreadId();

console.log('Random IDs are unique:', random1 !== random2);
console.log('Random ID 1:', random1);
console.log('Random ID 2:', random2);

console.log('\n=== All examples completed! ===\n');

