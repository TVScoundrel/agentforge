# Phase 2.3: Memory & Persistence Helpers - Design Document

## Overview

Phase 2.3 focuses on providing ergonomic utilities for LangGraph's memory and persistence features. We'll create factory functions and configuration helpers that make it easier to work with checkpointers and thread management.

## Philosophy

**We wrap, don't replace**: We provide type-safe, ergonomic wrappers around LangGraph's checkpointer system, not a competing implementation.

## Features

### 1. Checkpointer Factory Functions

Simplified creation of LangGraph checkpointers with sensible defaults.

```typescript
import { createMemoryCheckpointer, createSqliteCheckpointer } from '@agentforge/core';

// Development - in-memory checkpointer
const devCheckpointer = createMemoryCheckpointer();

// Local persistence - SQLite
const localCheckpointer = await createSqliteCheckpointer({
  path: './checkpoints.db',
  autoMigrate: true,
});

// Use with graph
const app = workflow.compile({ checkpointer: devCheckpointer });
```

### 2. Thread Management Helpers

Utilities for managing conversation threads and configurations.

```typescript
import { createThreadConfig, generateThreadId } from '@agentforge/core';

// Generate unique thread IDs
const threadId = generateThreadId(); // UUID v4
const threadId2 = generateThreadId('user-123'); // Deterministic from seed

// Create thread configurations
const config = createThreadConfig({
  threadId: 'conversation-1',
  checkpointId: 'checkpoint-abc',
  metadata: { userId: 'user-123' },
});

// Helper for conversation memory
const conversationConfig = createConversationConfig({
  userId: 'user-123',
  sessionId: 'session-456',
});
```

### 3. Checkpointer Utilities

Helper functions for working with checkpointers.

```typescript
import { 
  getCheckpointHistory,
  getLatestCheckpoint,
  clearThread,
} from '@agentforge/core';

// Get checkpoint history for a thread
const history = await getCheckpointHistory(checkpointer, {
  threadId: 'conversation-1',
  limit: 10,
});

// Get latest checkpoint
const latest = await getLatestCheckpoint(checkpointer, {
  threadId: 'conversation-1',
});

// Clear a thread's checkpoints
await clearThread(checkpointer, {
  threadId: 'conversation-1',
});
```

## Implementation Plan

### File Structure

```
src/langgraph/persistence/
├── index.ts                 # Public exports
├── checkpointer.ts          # Checkpointer factory functions
├── thread.ts                # Thread management utilities
└── utils.ts                 # Checkpointer utility functions

tests/langgraph/persistence/
├── checkpointer.test.ts     # Checkpointer factory tests
├── thread.test.ts           # Thread management tests
└── utils.test.ts            # Utility function tests
```

### API Design

#### 1. Checkpointer Factories (`checkpointer.ts`)

```typescript
export interface CheckpointerOptions {
  // Common options
  serializer?: SerializerProtocol;
}

export interface SqliteCheckpointerOptions extends CheckpointerOptions {
  path?: string;
  autoMigrate?: boolean;
}

export function createMemoryCheckpointer(
  options?: CheckpointerOptions
): MemorySaver;

export async function createSqliteCheckpointer(
  options?: SqliteCheckpointerOptions
): Promise<SqliteSaver>;
```

#### 2. Thread Management (`thread.ts`)

```typescript
export interface ThreadConfig {
  threadId: string;
  checkpointId?: string;
  checkpointNamespace?: string;
  metadata?: Record<string, any>;
}

export interface ConversationConfig {
  userId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export function generateThreadId(seed?: string): string;
export function createThreadConfig(config: Partial<ThreadConfig>): RunnableConfig;
export function createConversationConfig(config: ConversationConfig): RunnableConfig;
```

#### 3. Checkpointer Utilities (`utils.ts`)

```typescript
export interface CheckpointHistoryOptions {
  threadId: string;
  limit?: number;
  before?: string;
}

export async function getCheckpointHistory(
  checkpointer: BaseCheckpointSaver,
  options: CheckpointHistoryOptions
): Promise<CheckpointTuple[]>;

export async function getLatestCheckpoint(
  checkpointer: BaseCheckpointSaver,
  options: { threadId: string }
): Promise<CheckpointTuple | null>;

export async function clearThread(
  checkpointer: BaseCheckpointSaver,
  options: { threadId: string }
): Promise<void>;
```

## Testing Strategy

### Test Coverage (10 tests minimum)

1. **Checkpointer Factories** (4 tests)
   - Create memory checkpointer
   - Create SQLite checkpointer with default options
   - Create SQLite checkpointer with custom path
   - Checkpointer works with StateGraph

2. **Thread Management** (3 tests)
   - Generate unique thread IDs
   - Create thread config with all options
   - Create conversation config

3. **Checkpointer Utilities** (3 tests)
   - Get checkpoint history
   - Get latest checkpoint
   - Clear thread checkpoints

## Dependencies

- `@langchain/langgraph-checkpoint` - Base checkpointer (already included)
- `@langchain/langgraph-checkpoint-sqlite` - SQLite checkpointer (peer dependency)
- `uuid` - For thread ID generation

## Success Criteria

- ✅ All factory functions create valid checkpointers
- ✅ Thread management utilities work correctly
- ✅ Checkpointer utilities handle edge cases
- ✅ 10+ tests passing
- ✅ Full TypeScript type safety
- ✅ Complete documentation

