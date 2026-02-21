# Building a Database-Powered Agent

In this tutorial, you'll build an AI agent that can connect to a PostgreSQL database, explore its schema, run queries, and answer natural-language questions about your data — all in about 20 minutes.

## What You'll Build

A database assistant agent that can:
- Discover tables and columns automatically
- Answer questions like "What are the top 5 customers by revenue?"
- Insert, update, and delete records through conversation
- Handle errors gracefully

## Prerequisites

- Node.js 18+
- A running PostgreSQL instance (or SQLite for quick testing)
- An OpenAI API key (or any LangChain-compatible LLM)
- Basic TypeScript knowledge

## Step 1: Set Up the Project

```bash
npx @agentforge/cli create db-agent
cd db-agent
pnpm install
```

Install the database driver and LLM provider:

```bash
pnpm add @agentforge/tools @agentforge/patterns @langchain/openai pg
pnpm add -D @types/pg
```

Create `.env`:

```bash
OPENAI_API_KEY=your-api-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
```

::: tip Quick Start with SQLite
If you don't have PostgreSQL available, use SQLite instead:

```bash
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3
```

Then use `vendor: 'sqlite'` and `connectionString: ':memory:'` or a file path in the examples below.
:::

## Step 2: Test the Connection

Create `src/index.ts`:

```typescript
import { ConnectionManager } from '@agentforge/tools';

const DB_URL = process.env.DATABASE_URL!;

async function main() {
  const manager = new ConnectionManager({
    vendor: 'postgresql',
    connection: DB_URL,
  });

  await manager.connect();
  console.log('Connected:', manager.isConnected()); // true
  console.log('State:', manager.getState());         // 'connected'

  const healthy = await manager.isHealthy();
  console.log('Healthy:', healthy);                  // true

  await manager.disconnect();
}

main().catch(console.error);
```

Run it:

```bash
npx tsx src/index.ts
```

You should see `Connected: true`. If you get a `MissingPeerDependencyError`, make sure the right database driver is installed.

## Step 3: Discover the Schema

Before querying, the agent needs to know what tables and columns exist. The `relationalGetSchema` tool handles this:

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const DB_URL = process.env.DATABASE_URL!;

async function exploreSchema() {
  const result = await relationalGetSchema.invoke({
    vendor: 'postgresql',
    connectionString: DB_URL,
    cacheTtlMs: 300000, // Cache for 5 minutes
  });

  if (!result.success) {
    console.error('Schema introspection failed:', result.error);
    return;
  }

  console.log(`Found ${result.summary.tableCount} tables:`);

  for (const table of result.schema.tables) {
    const cols = table.columns
      .map((c) => `${c.name} (${c.type}${c.isNullable ? ', nullable' : ''})`)
      .join(', ');
    console.log(`  ${table.name}: ${cols}`);
    console.log(`    Primary key: ${table.primaryKey.join(', ')}`);
  }
}

exploreSchema().catch(console.error);
```

Example output:

```
Found 3 tables:
  users: id (integer), email (varchar(255)), name (varchar(100)), created_at (timestamp)
    Primary key: id
  orders: id (integer), user_id (integer), total (numeric(10,2)), status (varchar(20))
    Primary key: id
  products: id (integer), name (varchar(200)), price (numeric(10,2)), stock (integer)
    Primary key: id
```

## Step 4: Query with CRUD Tools

Now use the type-safe query tools instead of writing raw SQL:

```typescript
import { relationalSelect, relationalInsert } from '@agentforge/tools';

const DB_URL = process.env.DATABASE_URL!;

async function queryExamples() {
  // SELECT — find high-value pending orders
  const orders = await relationalSelect.invoke({
    table: 'orders',
    columns: ['id', 'user_id', 'total', 'status'],
    where: [
      { column: 'status', operator: 'eq', value: 'pending' },
      { column: 'total', operator: 'gte', value: 100 },
    ],
    orderBy: [{ column: 'total', direction: 'desc' }],
    limit: 10,
    vendor: 'postgresql',
    connectionString: DB_URL,
  });

  if (orders.success) {
    console.log(`Found ${orders.rowCount} high-value pending orders`);
    console.log(orders.rows);
  }

  // INSERT — add a new user
  const newUser = await relationalInsert.invoke({
    table: 'users',
    data: { email: 'bob@example.com', name: 'Bob' },
    returning: { mode: 'id', idColumn: 'id' },
    vendor: 'postgresql',
    connectionString: DB_URL,
  });

  if (newUser.success) {
    console.log('Created user with ID:', newUser.insertedIds[0]);
  } else {
    console.log('Insert failed:', newUser.error);
  }
}

queryExamples().catch(console.error);
```

::: info No SQL Required
The CRUD tools build parameterized SQL internally. You never write SQL strings — just describe what you want with structured objects. The framework handles vendor differences automatically.
:::

## Step 5: Wire Tools into a ReAct Agent

This is where it gets exciting. Give the database tools to a ReAct agent and let it answer questions in natural language:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import {
  relationalGetSchema,
  relationalSelect,
  relationalQuery,
} from '@agentforge/tools';

const DB_URL = process.env.DATABASE_URL!;

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalGetSchema, relationalSelect, relationalQuery],
  systemPrompt: `You are a database assistant.
Database: PostgreSQL at ${DB_URL}

Workflow:
1. ALWAYS call relational-get-schema first to discover tables and columns.
2. Use relational-select for simple single-table queries (filters, ordering, pagination).
3. Use relational-query for complex queries (JOINs, aggregations, subqueries).
4. Always include LIMIT to prevent large result sets.

Rules:
- Never guess column names — always verify against the schema first.
- If a table doesn't exist, tell the user which tables ARE available.
- Use parameterized queries ($1, $2, ...) for any user-provided values.
- Report results in a readable format.`,
  maxIterations: 10,
});

async function chat(question: string) {
  console.log(`\nQ: ${question}`);

  const result = await agent.invoke({
    messages: [{ role: 'user', content: question }],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log(`A: ${lastMessage.content}`);
}

async function main() {
  await chat('What tables are in the database?');
  await chat('Show me the top 5 users by order count, including their email.');
  await chat('How many orders are pending vs completed?');
}

main().catch(console.error);
```

The agent will:
1. Call `relational-get-schema` to discover tables
2. Use `relational-select` or `relational-query` to answer the question
3. Format results in a human-readable response

## Step 6: Add Error Handling

Tools return `{ success: false, error }` instead of throwing. Wrap operations for robustness:

```typescript
import { relationalInsert } from '@agentforge/tools';

async function createUser(email: string, name: string) {
  const result = await relationalInsert.invoke({
    table: 'users',
    data: { email, name },
    returning: { mode: 'id', idColumn: 'id' },
    vendor: 'postgresql',
    connectionString: process.env.DATABASE_URL!,
  });

  if (!result.success) {
    // Tools sanitize errors — match on keywords
    if (result.error?.includes('unique') || result.error?.includes('duplicate')) {
      return { success: false, reason: 'Email already exists' };
    }
    if (result.error?.includes('not-null') || result.error?.includes('NOT NULL')) {
      return { success: false, reason: 'Required field missing' };
    }
    return { success: false, reason: result.error };
  }

  return { success: true, userId: result.insertedIds[0] };
}
```

### Retry Pattern

For transient failures (network issues, lock contention), wrap with retries:

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  { maxRetries = 3, baseDelayMs = 1000 } = {},
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

// Usage — throw on failure to trigger retries
const result = await withRetry(async () => {
  const res = await relationalSelect.invoke({
    table: 'users',
    columns: ['id', 'email'],
    vendor: 'postgresql',
    connectionString: process.env.DATABASE_URL!,
  });
  if (!res.success) throw new Error(res.error ?? 'Query failed');
  return res;
});
```

## Complete Working Example

Here's a self-contained agent that ties everything together:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import {
  ConnectionManager,
  relationalGetSchema,
  relationalSelect,
  relationalInsert,
  relationalUpdate,
  relationalDelete,
  relationalQuery,
} from '@agentforge/tools';

const DB_URL = process.env.DATABASE_URL!;

// Set up connection with pooling and reconnection
const manager = new ConnectionManager(
  {
    vendor: 'postgresql',
    connection: {
      connectionString: DB_URL,
      pool: { max: 10 },
    },
  },
  { enabled: true, maxAttempts: 3 },
);

// Create the agent with all database tools
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [
    relationalGetSchema,
    relationalSelect,
    relationalInsert,
    relationalUpdate,
    relationalDelete,
    relationalQuery,
  ],
  systemPrompt: `You are a database management assistant.
Database vendor: postgresql
Connection string: ${DB_URL}

Always introspect the schema first. Use type-safe tools (select, insert, update, delete) when possible. Fall back to raw SQL (query) only for JOINs and aggregations. Always include LIMIT. Never guess column names.`,
  maxIterations: 15,
});

async function main() {
  await manager.connect();
  console.log('Database connected. Pool metrics:', manager.getPoolMetrics());

  const result = await agent.invoke({
    messages: [{
      role: 'user',
      content: 'Show me a summary of all tables and their row counts.',
    }],
  });

  const answer = result.messages[result.messages.length - 1];
  console.log('\nAgent:', answer.content);

  // Cleanup
  await manager.disconnect();
}

main().catch(console.error);
```

## What's Next?

- **[Database Tools Guide](/guide/concepts/database)** — Deep dive into all features: transactions, batch operations, streaming, security
- **[API Reference](/api/tools#relational-database-tools-6)** — Full parameter and response documentation
- **[Advanced Examples](https://github.com/TVScoundrel/agentforge/tree/main/packages/tools/examples/relational)** — 9 detailed integration guides covering transactions, streaming, multi-agent systems, and more
