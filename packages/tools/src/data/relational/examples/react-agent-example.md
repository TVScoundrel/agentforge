# AgentForge ReAct Pattern — Database Integration Example

This example shows how to wire the relational database tools into an AgentForge ReAct agent so the LLM can autonomously query, insert, update, and introspect a database.

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../../../docs/LOGGING_STANDARDS.md).

## Setup

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import {
  relationalQuery,
  relationalSelect,
  relationalInsert,
  relationalUpdate,
  relationalDelete,
  relationalGetSchema,
} from '@agentforge/tools';
```

## Basic Agent — Read-Only

Give the agent only read tools to safely explore a database:

```typescript
const readOnlyAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalSelect, relationalGetSchema],
  systemPrompt: `You are a database analyst agent.
You have access to a PostgreSQL database.
Use relational-get-schema to discover tables and columns first.
Then use relational-select to answer the user's questions.
Always use the connection string: postgresql://analyst:readonly@localhost:5432/analytics

Important:
- Inspect the schema before querying to ensure correct column names.
- Use WHERE clauses to limit result sets.
- Never modify data.`,
  maxIterations: 10,
});

const result = await readOnlyAgent.invoke({
  messages: [{
    role: 'user',
    content: 'How many active users signed up this month?',
  }],
});

console.log(result.messages[result.messages.length - 1].content);
```

## Full CRUD Agent

Provide all tools for a fully autonomous database agent:

```typescript
const crudAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [
    relationalQuery,
    relationalSelect,
    relationalInsert,
    relationalUpdate,
    relationalDelete,
    relationalGetSchema,
  ],
  systemPrompt: `You are a database operations agent.
You manage a PostgreSQL database at postgresql://app:secret@localhost:5432/production

Rules:
1. Always inspect the schema before writing to verify column names and types.
2. Use relational-select for reads and relational-insert/update/delete for writes.
3. Use relational-query only for complex queries that cannot be expressed with the type-safe tools.
4. Prefer soft deletes over hard deletes when the table has a deleted_at column.
5. Use optimistic locking when updating rows with a version column.
6. Summarize what you changed after each write operation.`,
  maxIterations: 15,
});

const result = await crudAgent.invoke({
  messages: [{
    role: 'user',
    content: 'Create a new user named "Charlie" with email charlie@example.com, then verify the insertion by selecting the user.',
  }],
});
```

## Multi-Database Agent

An agent that can switch between databases based on the task:

```typescript
const multiDbAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalSelect, relationalInsert, relationalGetSchema],
  systemPrompt: `You are a multi-database operations agent.
You have access to three databases:

- PostgreSQL (analytics): postgresql://reader:pass@pg-host:5432/analytics
- MySQL (inventory): mysql://app:pass@mysql-host:3306/inventory
- SQLite (cache): /tmp/cache.db

Choose the appropriate database based on context:
- Use PostgreSQL for reporting and analytics queries.
- Use MySQL for inventory and product operations.
- Use SQLite for temporary caching and scratch work.

Always specify the correct vendor and connectionString for each tool call.`,
  maxIterations: 10,
});

const result = await multiDbAgent.invoke({
  messages: [{
    role: 'user',
    content: 'Check the inventory for product SKU-123 in MySQL, then log the lookup in the SQLite cache.',
  }],
});
```

## Agent with State Persistence

Use a checkpointer so the agent remembers conversation context across invocations:

```typescript
import { MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();

const persistentAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalSelect, relationalGetSchema],
  checkpointer,
  systemPrompt: `You are a database assistant. Remember previous queries in our conversation.
Database: postgresql://user:pass@localhost:5432/mydb`,
  maxIterations: 10,
});

// First turn — agent discovers schema
await persistentAgent.invoke({
  messages: [{ role: 'user', content: 'What tables are in the database?' }],
}, {
  configurable: { thread_id: 'session-1' },
});

// Second turn — agent remembers the schema from the first turn
const result = await persistentAgent.invoke({
  messages: [{ role: 'user', content: 'Show me the first 5 rows from the users table.' }],
}, {
  configurable: { thread_id: 'session-1' },
});
```

## Using the Builder API

The `ReActAgentBuilder` provides a fluent alternative to `createReActAgent`:

```typescript
import { ReActAgentBuilder } from '@agentforge/patterns';

const agent = new ReActAgentBuilder()
  .withLLM(new ChatOpenAI({ model: 'gpt-4', temperature: 0 }))
  .withTools([relationalSelect, relationalGetSchema, relationalQuery])
  .withSystemPrompt(`You are a SQL analyst. Database: postgresql://user:pass@localhost/db`)
  .withMaxIterations(10)
  .build();

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'List all tables and their row counts.' }],
});
```

## Testing with Mocks

Use `@agentforge/testing` to test agent behavior without a real LLM or database:

```typescript
import { describe, it, expect } from 'vitest';
import { createMockLLM, createMockTool } from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';

describe('Database agent', () => {
  it('should query schema before selecting', async () => {
    const mockLLM = createMockLLM({
      responses: [
        // First: agent decides to inspect schema
        'I will check the schema first.',
        // Then: agent uses the results to query
        'Now I can select from the users table.',
        // Final: agent summarizes
        'The users table has 3 columns: id, name, email.',
      ],
    });

    const mockSchema = createMockTool({
      name: 'relational-get-schema',
      returns: JSON.stringify({
        tables: [{
          name: 'users',
          columns: [
            { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
            { name: 'name', type: 'text', nullable: false },
            { name: 'email', type: 'text', nullable: true },
          ],
        }],
      }),
    });

    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [mockSchema],
      maxIterations: 5,
    });

    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Describe the users table.' }],
    });

    expect(result).toBeDefined();
  });
});
```
