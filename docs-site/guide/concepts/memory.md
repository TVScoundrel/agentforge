# Memory & Persistence

Memory allows agents to remember past interactions and maintain context across multiple conversations. AgentForge provides utilities for working with LangGraph's checkpointing system.

::: tip Related Concepts
- **[State Management](/guide/concepts/state)** - Understand state before learning about persistence
- **[Production Deployment](/tutorials/production-deployment)** - Deploy agents with persistent memory
- **[Monitoring](/guide/advanced/monitoring)** - Monitor memory usage and performance
:::

## What is Memory?

Memory in AgentForge refers to:

1. **Conversation History** - Messages exchanged between user and agent
2. **State Persistence** - Saving agent state between sessions
3. **Thread Management** - Managing multiple conversation threads
4. **Checkpoint History** - Accessing past states for debugging or rollback

## Checkpointers

Checkpointers save agent state at each step, enabling:
- ✅ **Resuming conversations** after interruptions
- ✅ **Multi-turn interactions** with context
- ✅ **Time travel** to previous states
- ✅ **Debugging** by inspecting state history

### Memory Checkpointer

For development and testing - stores state in memory:

```typescript
import { createMemoryCheckpointer } from '@agentforge/core';
import { StateGraph } from '@langchain/langgraph';

const checkpointer = createMemoryCheckpointer();

const app = workflow.compile({ checkpointer });

// First conversation
await app.invoke(
  { messages: ['Hello'] },
  { configurable: { thread_id: 'conversation-1' } }
);

// Continue conversation (remembers context)
await app.invoke(
  { messages: ['What did I just say?'] },
  { configurable: { thread_id: 'conversation-1' } }
);
```

::: warning Memory Checkpointer
Data is lost when the process exits. Use SQLite or Postgres for production.
:::

### SQLite Checkpointer

For local persistence - stores state in a SQLite database:

```typescript
import { createSqliteCheckpointer } from '@agentforge/core';

const checkpointer = await createSqliteCheckpointer({
  path: './checkpoints.db',
  autoMigrate: true, // Create tables automatically
});

const app = workflow.compile({ checkpointer });
```

**Benefits:**
- ✅ Persists across restarts
- ✅ Good for local development
- ✅ Single-machine deployments
- ✅ No external dependencies

**Limitations:**
- ❌ Not suitable for distributed systems
- ❌ Limited concurrent access
- ❌ File-based storage

::: tip Installation
Requires `@langchain/langgraph-checkpoint-sqlite`:
```bash
npm install @langchain/langgraph-checkpoint-sqlite
```
:::

## Thread Management

Threads represent separate conversation contexts.

### Creating Threads

```typescript
import { createThreadConfig, generateThreadId } from '@agentforge/core';

// Auto-generate thread ID
const config1 = createThreadConfig();

// Use specific thread ID
const config2 = createThreadConfig('user-123-session-456');

// With additional metadata
const config3 = createThreadConfig('thread-1', {
  userId: 'user-123',
  sessionId: 'session-456',
  createdAt: Date.now(),
});
```

### Using Threads

```typescript
const checkpointer = createMemoryCheckpointer();
const app = workflow.compile({ checkpointer });

// User 1's conversation
const thread1 = createThreadConfig('user-1');
await app.invoke({ messages: ['Hello'] }, thread1);
await app.invoke({ messages: ['How are you?'] }, thread1);

// User 2's conversation (separate context)
const thread2 = createThreadConfig('user-2');
await app.invoke({ messages: ['Hi there'] }, thread2);
await app.invoke({ messages: ['What can you do?'] }, thread2);
```

### Multi-User Conversations

```typescript
import { createConversationConfig } from '@agentforge/core';

// Create conversation for specific user
const userConfig = createConversationConfig('user-123', {
  sessionId: 'session-456',
  metadata: {
    name: 'Alice',
    preferences: { theme: 'dark' },
  },
});

await app.invoke({ messages: ['Hello'] }, userConfig);
```

## Checkpoint History

Access past states for debugging or rollback.

### Getting Checkpoint History

```typescript
import { getCheckpointHistory } from '@agentforge/core';

const history = await getCheckpointHistory(app, {
  threadId: 'conversation-1',
  limit: 10, // Last 10 checkpoints
});

for (const checkpoint of history) {
  console.log('Step:', checkpoint.metadata.step);
  console.log('State:', checkpoint.state);
  console.log('Timestamp:', checkpoint.metadata.timestamp);
}
```

### Getting Latest Checkpoint

```typescript
import { getLatestCheckpoint } from '@agentforge/core';

const latest = await getLatestCheckpoint(app, 'conversation-1');

if (latest) {
  console.log('Last state:', latest.state);
  console.log('Last step:', latest.metadata.step);
}
```

### Clearing Thread History

```typescript
import { clearThread } from '@agentforge/core';

// Clear all checkpoints for a thread
await clearThread(app, 'conversation-1');
```

## Conversation Patterns

### Pattern 1: Simple Chat

```typescript
import { createMemoryCheckpointer, createThreadConfig } from '@agentforge/core';

const checkpointer = createMemoryCheckpointer();
const app = workflow.compile({ checkpointer });

async function chat(userId: string, message: string) {
  const config = createThreadConfig(userId);
  
  const result = await app.invoke(
    { messages: [message] },
    config
  );
  
  return result.messages[result.messages.length - 1];
}

// Usage
await chat('user-1', 'Hello');
await chat('user-1', 'What is 2+2?');
await chat('user-1', 'Thanks!');
```

### Pattern 2: Session-Based Chat

```typescript
async function sessionChat(userId: string, sessionId: string, message: string) {
  const config = createConversationConfig(userId, {
    sessionId,
    metadata: { startedAt: Date.now() },
  });
  
  const result = await app.invoke(
    { messages: [message] },
    config
  );
  
  return result.messages[result.messages.length - 1];
}

// Different sessions for same user
await sessionChat('user-1', 'session-morning', 'Good morning');
await sessionChat('user-1', 'session-afternoon', 'Good afternoon');
```

### Pattern 3: Context Window Management

Manage conversation length to stay within LLM context limits:

```typescript
const ChatState = createStateAnnotation({
  messages: {
    schema: z.array(MessageSchema),
    reducer: (left, right) => {
      const combined = [...left, ...right];
      // Keep only last 20 messages
      return combined.slice(-20);
    },
    default: () => [],
  },
});
```

### Pattern 4: Conversation Summarization

Summarize old messages to save context:

```typescript
const SummarizedState = createStateAnnotation({
  messages: {
    schema: z.array(MessageSchema),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  },
  summary: {
    schema: z.string(),
    default: () => '',
  },
});

const summarizeNode = async (state: State) => {
  if (state.messages.length > 50) {
    // Summarize old messages
    const oldMessages = state.messages.slice(0, -20);
    const summary = await llm.invoke(
      `Summarize this conversation: ${JSON.stringify(oldMessages)}`
    );

    return {
      messages: state.messages.slice(-20), // Keep recent messages
      summary: state.summary + '\n' + summary,
    };
  }

  return {};
};
```

## Best Practices

### 1. Choose the Right Checkpointer

```typescript
// ✅ Development - use memory
if (process.env.NODE_ENV === 'development') {
  checkpointer = createMemoryCheckpointer();
}

// ✅ Production - use persistent storage
if (process.env.NODE_ENV === 'production') {
  checkpointer = await createSqliteCheckpointer({
    path: process.env.CHECKPOINT_DB_PATH,
  });
}
```

### 2. Use Meaningful Thread IDs

```typescript
// ✅ Good - descriptive and unique
const threadId = `user-${userId}-session-${sessionId}`;

// ✅ Good - includes context
const threadId = `support-ticket-${ticketId}`;

// ❌ Bad - not unique enough
const threadId = 'conversation';

// ❌ Bad - hard to debug
const threadId = generateThreadId(); // Random UUID
```

### 3. Clean Up Old Threads

```typescript
import { clearThread } from '@agentforge/core';

async function cleanupOldThreads(app, maxAge: number) {
  const threads = await getAllThreads(app);

  for (const thread of threads) {
    const age = Date.now() - thread.createdAt;

    if (age > maxAge) {
      await clearThread(app, thread.id);
      console.log(`Cleaned up thread: ${thread.id}`);
    }
  }
}

// Run daily
setInterval(() => {
  cleanupOldThreads(app, 30 * 24 * 60 * 60 * 1000); // 30 days
}, 24 * 60 * 60 * 1000);
```

### 4. Handle Checkpoint Errors

```typescript
async function safeInvoke(app, input, config) {
  try {
    return await app.invoke(input, config);
  } catch (error) {
    if (error.message.includes('checkpoint')) {
      console.error('Checkpoint error, clearing thread:', config.configurable.thread_id);
      await clearThread(app, config.configurable.thread_id);

      // Retry without history
      return await app.invoke(input, config);
    }
    throw error;
  }
}
```

### 5. Monitor Memory Usage

```typescript
import { MemoryManager } from '@agentforge/core';

const memoryManager = new MemoryManager({
  maxMemory: 1024 * 1024 * 1024, // 1GB
  checkInterval: 10000, // Check every 10s
  thresholdPercentage: 80, // Warn at 80%
  onThreshold: (stats) => {
    console.warn('Memory usage high:', stats.percentage + '%');
  },
  onLimit: async (stats) => {
    console.error('Memory limit reached, cleaning up...');
    // Clear old checkpoints
    await cleanupOldThreads(app, 7 * 24 * 60 * 60 * 1000); // 7 days
  },
});

memoryManager.start();
```

## Advanced Features

### Time Travel

Go back to a previous state:

```typescript
const history = await getCheckpointHistory(app, {
  threadId: 'conversation-1',
});

// Get state from 5 steps ago
const previousState = history[4].state;

// Resume from that state
const result = await app.invoke(
  { messages: ['Let me try again'] },
  {
    configurable: {
      thread_id: 'conversation-1',
      checkpoint_id: history[4].id,
    },
  }
);
```

### Branching Conversations

Create alternate conversation paths:

```typescript
// Main conversation
const mainConfig = createThreadConfig('main-thread');
await app.invoke({ messages: ['Hello'] }, mainConfig);

// Branch from current state
const branchConfig = createThreadConfig('branch-thread');
const currentState = await getLatestCheckpoint(app, 'main-thread');

// Start branch with same state
await app.invoke(
  currentState.state,
  branchConfig
);

// Now you have two independent threads
await app.invoke({ messages: ['Path A'] }, mainConfig);
await app.invoke({ messages: ['Path B'] }, branchConfig);
```

### Checkpoint Metadata

Add custom metadata to checkpoints:

```typescript
const result = await app.invoke(
  { messages: ['Hello'] },
  {
    configurable: {
      thread_id: 'conversation-1',
    },
    metadata: {
      userId: 'user-123',
      source: 'web-app',
      timestamp: Date.now(),
      tags: ['support', 'billing'],
    },
  }
);

// Query by metadata later
const history = await getCheckpointHistory(app, {
  threadId: 'conversation-1',
  filter: (checkpoint) => {
    return checkpoint.metadata.tags?.includes('billing');
  },
});
```

## Debugging with Memory

### Inspect State History

```typescript
async function debugConversation(threadId: string) {
  const history = await getCheckpointHistory(app, { threadId });

  console.log(`\n=== Conversation: ${threadId} ===`);

  for (const [index, checkpoint] of history.entries()) {
    console.log(`\nStep ${index + 1}:`);
    console.log('Messages:', checkpoint.state.messages);
    console.log('Metadata:', checkpoint.metadata);
  }
}

await debugConversation('conversation-1');
```

### Compare States

```typescript
async function compareStates(threadId: string, step1: number, step2: number) {
  const history = await getCheckpointHistory(app, { threadId });

  const state1 = history[step1].state;
  const state2 = history[step2].state;

  console.log('Differences:');
  console.log('Messages added:',
    state2.messages.length - state1.messages.length
  );
  console.log('Context changed:',
    JSON.stringify(state1.context) !== JSON.stringify(state2.context)
  );
}
```

## Production Considerations

### 1. Database Backups

```typescript
// Backup SQLite database regularly
import { copyFile } from 'fs/promises';

async function backupCheckpoints() {
  const timestamp = Date.now();
  await copyFile(
    './checkpoints.db',
    `./backups/checkpoints-${timestamp}.db`
  );
}

// Run daily
setInterval(backupCheckpoints, 24 * 60 * 60 * 1000);
```

### 2. Checkpoint Compression

For long conversations, compress old checkpoints:

```typescript
const CompressedState = createStateAnnotation({
  recentMessages: {
    schema: z.array(MessageSchema),
    reducer: (left, right) => [...left, ...right].slice(-10),
    default: () => [],
  },
  archivedSummary: {
    schema: z.string(),
    default: () => '',
  },
});
```

### 3. Multi-Tenant Isolation

Ensure thread isolation between tenants:

```typescript
function createTenantThreadId(tenantId: string, userId: string, sessionId: string) {
  return `tenant-${tenantId}-user-${userId}-session-${sessionId}`;
}

// Each tenant has isolated threads
const thread1 = createTenantThreadId('tenant-a', 'user-1', 'session-1');
const thread2 = createTenantThreadId('tenant-b', 'user-1', 'session-1');
```

## Next Steps

- [State Management](/guide/concepts/state) - Understanding state
- [Agent Patterns](/guide/concepts/patterns) - Using memory in patterns
- [API Reference](/api/core#memory-persistence) - Complete memory API
- [Production Deployment](/tutorials/production-deployment) - Deploying with persistence


