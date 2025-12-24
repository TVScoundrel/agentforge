# LangGraph Persistence Utilities

Type-safe utilities for working with LangGraph's memory and persistence features.

## Overview

The persistence module provides ergonomic wrappers around LangGraph's checkpointer system, making it easier to:
- Create and configure checkpointers
- Manage conversation threads
- Access checkpoint history
- Handle multi-user conversations

## Quick Start

```typescript
import { StateGraph, Annotation } from '@langchain/langgraph';
import {
  createMemoryCheckpointer,
  createConversationConfig,
} from '@agentforge/core';

// Create a checkpointer
const checkpointer = createMemoryCheckpointer();

// Build your graph
const workflow = new StateGraph(MyState)
  .addNode('myNode', myNodeFunction)
  .addEdge('__start__', 'myNode')
  .addEdge('myNode', '__end__');

// Compile with checkpointing
const app = workflow.compile({ checkpointer });

// Create a conversation config
const config = createConversationConfig({
  userId: 'user-123',
  sessionId: 'session-456',
});

// Run with persistence
const result = await app.invoke(input, config);
```

## Checkpointer Factories

### createMemoryCheckpointer()

Creates an in-memory checkpointer for development and testing.

```typescript
const checkpointer = createMemoryCheckpointer();
```

**Use Cases:**
- Development and testing
- Temporary conversations
- Prototyping

**Limitations:**
- Data is lost when process restarts
- Not suitable for production

### createSqliteCheckpointer()

Creates a SQLite-based checkpointer for local persistence.

```typescript
const checkpointer = await createSqliteCheckpointer({
  path: './checkpoints.db',
  autoMigrate: true,
});
```

**Options:**
- `path` - Database file path (default: ':memory:')
- `autoMigrate` - Run migrations automatically (default: true)

**Requirements:**
- Requires `@langchain/langgraph-checkpoint-sqlite` package

**Use Cases:**
- Local development with persistence
- Single-server deployments
- Testing with real persistence

## Thread Management

### generateThreadId()

Generate unique or deterministic thread IDs.

```typescript
// Random ID
const randomId = generateThreadId();
// => "4d194b4c-37c7-4640-b0d0-0daf683800d4"

// Deterministic ID from seed
const deterministicId = generateThreadId('user-123');
// => "thread-dXNlci0xMjM"
```

**Parameters:**
- `seed` (optional) - Seed for deterministic ID generation

**Returns:**
- Random UUID if no seed provided
- Deterministic ID based on seed if provided

### createThreadConfig()

Create a thread configuration for LangGraph.

```typescript
const config = createThreadConfig({
  threadId: 'my-thread',
  checkpointId: 'checkpoint-123',
  checkpointNamespace: 'my-namespace',
  metadata: { userId: 'user-123' },
});
```

**Options:**
- `threadId` - Thread identifier (auto-generated if not provided)
- `checkpointId` - Specific checkpoint to resume from
- `checkpointNamespace` - Checkpoint namespace
- `metadata` - Additional metadata

### createConversationConfig()

Create a conversation-specific configuration with automatic thread ID generation.

```typescript
const config = createConversationConfig({
  userId: 'user-123',
  sessionId: 'session-456',
  metadata: { source: 'web' },
});
```

**Options:**
- `userId` - User identifier (required)
- `sessionId` - Session identifier (optional)
- `metadata` - Additional metadata

**Features:**
- Generates deterministic thread ID from userId and sessionId
- Automatically includes userId and sessionId in metadata
- Perfect for multi-user chat applications

## Checkpointer Utilities

### getCheckpointHistory()

Get checkpoint history for a thread.

```typescript
const history = await getCheckpointHistory(checkpointer, {
  threadId: 'conversation-1',
  limit: 10,
});

for (const checkpoint of history) {
  console.log('Checkpoint ID:', checkpoint.checkpoint.id);
  console.log('State:', checkpoint.checkpoint.channel_values);
}
```

**Options:**
- `threadId` - Thread identifier
- `limit` - Maximum number of checkpoints to return (default: 10)

**Returns:**
- Array of checkpoint tuples (newest first)

### getLatestCheckpoint()

Get the latest checkpoint for a thread.

```typescript
const latest = await getLatestCheckpoint(checkpointer, {
  threadId: 'conversation-1',
});

if (latest) {
  console.log('Latest state:', latest.checkpoint.channel_values);
}
```

**Returns:**
- Latest checkpoint tuple or null if no checkpoints exist

### clearThread()

Clear thread checkpoints (limited support).

```typescript
await clearThread(checkpointer, {
  threadId: 'conversation-1',
});
```

**Note:** Not all checkpointers support deletion. This function will throw an error if the checkpointer doesn't support it.

## Common Patterns

### Multi-User Chat

```typescript
const checkpointer = createMemoryCheckpointer();
const app = workflow.compile({ checkpointer });

// User 1
const user1Config = createConversationConfig({ userId: 'alice' });
await app.invoke({ message: 'Hello' }, user1Config);

// User 2
const user2Config = createConversationConfig({ userId: 'bob' });
await app.invoke({ message: 'Hi' }, user2Config);

// Each user has their own conversation history
```

### Session-Based Conversations

```typescript
// Same user, different sessions
const session1 = createConversationConfig({
  userId: 'user-123',
  sessionId: 'morning-chat',
});

const session2 = createConversationConfig({
  userId: 'user-123',
  sessionId: 'afternoon-chat',
});

// Each session has its own history
```

### Checkpoint History Review

```typescript
const history = await getCheckpointHistory(checkpointer, {
  threadId: 'conversation-1',
  limit: 5,
});

console.log(`Found ${history.length} checkpoints`);
for (const checkpoint of history) {
  const state = checkpoint.checkpoint.channel_values;
  console.log('Messages:', state.messages);
}
```

## Type Safety

All utilities are fully typed with TypeScript:

```typescript
import type {
  CheckpointerOptions,
  SqliteCheckpointerOptions,
  ThreadConfig,
  ConversationConfig,
  CheckpointHistoryOptions,
} from '@agentforge/core';
```

## See Also

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Phase 2.3 Design](../phase-2.3-design.md)
- [Phase 2.3 Complete](../PHASE_2_3_COMPLETE.md)
- [Example: phase-2.3-demo.ts](../../examples/phase-2.3-demo.ts)

