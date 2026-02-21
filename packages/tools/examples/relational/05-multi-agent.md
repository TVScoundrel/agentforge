# Multi-Agent System with Shared Database

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide demonstrates how to build a multi-agent system where several specialized agents share a database — a common pattern for autonomous workflow orchestration.

---

## Architecture

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Analyst   │     │  Writer    │     │  Reviewer   │
│   Agent    │     │   Agent    │     │   Agent     │
│ (read-only)│     │ (read/write│     │ (read-only) │
└─────┬──────┘     └─────┬──────┘     └──────┬──────┘
      │                  │                   │
      └──────────────────┼───────────────────┘
                         │
                    ┌────┴────┐
                    │ Shared  │
                    │   DB    │
                    └─────────┘
```

Each agent gets a different subset of database tools based on its role. All agents share the same database connection string.

---

## Setup — Shared Tool Configuration

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

const DB_URL = 'postgresql://app:secret@localhost:5432/content_platform';
```

---

## Agent 1 — Analyst (Read-Only)

This agent explores the database and produces reports. It only has read tools:

```typescript
const analyst = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalSelect, relationalGetSchema],
  systemPrompt: `You are a data analyst agent.
You have access to a PostgreSQL database at: ${DB_URL}

Your job:
- Use relational-get-schema to discover tables and columns before querying.
- Use relational-select to answer analytical questions.
- Always add ORDER BY and LIMIT to prevent large result sets.
- Summarize findings in a clear, structured format.

You CANNOT modify data. You are read-only.`,
  maxIterations: 10,
});
```

---

## Agent 2 — Writer (Read/Write)

This agent creates and updates content. It has full CRUD access:

```typescript
const writer = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalSelect, relationalInsert, relationalUpdate, relationalGetSchema],
  systemPrompt: `You are a content writer agent.
You have access to a PostgreSQL database at: ${DB_URL}

Your job:
- Inspect the schema before writing to verify column names and types.
- Use relational-insert to create new articles and drafts.
- Use relational-update to modify existing content.
- Always set status to 'draft' for new content.
- Use optimistic locking on the 'version' column when updating articles.

Safety rules:
- Never delete content — only update status to 'archived'.
- Always include a WHERE clause when updating.`,
  maxIterations: 15,
});
```

---

## Agent 3 — Reviewer (Read + Limited Write)

This agent reviews content and updates its status:

```typescript
const reviewer = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalSelect, relationalUpdate, relationalGetSchema],
  systemPrompt: `You are a content review agent.
You have access to a PostgreSQL database at: ${DB_URL}

Your job:
- Review articles with status = 'draft'.
- Check quality: title, summary, body length, and metadata completeness.
- Update status to 'approved' or 'needs_revision' with a review_notes comment.
- Use optimistic locking on the 'version' column to prevent conflicts with the writer agent.

You CANNOT create or delete content.`,
  maxIterations: 10,
});
```

---

## Orchestrating the Agents

Run agents in sequence to create a content pipeline:

```typescript
async function contentPipeline(topic: string) {
  // Step 1: Analyst researches existing content
  const analysis = await analyst.invoke({
    messages: [{
      role: 'user',
      content: `Analyze existing articles about "${topic}". How many exist? What's the average word count? Are there gaps?`,
    }],
  });
  const analysisResult = analysis.messages[analysis.messages.length - 1].content;
  console.log('Analysis:', analysisResult);

  // Step 2: Writer creates new content based on analysis
  const draft = await writer.invoke({
    messages: [{
      role: 'user',
      content: `Based on this analysis: "${analysisResult}"
Create a new article about "${topic}" filling any content gaps. Insert it as a draft.`,
    }],
  });
  const draftResult = draft.messages[draft.messages.length - 1].content;
  console.log('Draft:', draftResult);

  // Step 3: Reviewer checks the new draft
  const review = await reviewer.invoke({
    messages: [{
      role: 'user',
      content: `Review the latest draft article about "${topic}". Check quality and approve or request revisions.`,
    }],
  });
  const reviewResult = review.messages[review.messages.length - 1].content;
  console.log('Review:', reviewResult);

  return { analysisResult, draftResult, reviewResult };
}

await contentPipeline('database optimization techniques');
```

---

## Preventing Conflicts with Optimistic Locking

When multiple agents modify the same rows, use optimistic locking to catch conflicts:

```typescript
// Writer updates an article
const writeResult = await relationalUpdate.invoke({
  table: 'articles',
  data: { body: 'Updated content...', version: 3 },
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  optimisticLock: { column: 'version', expectedValue: 2 },
  vendor: 'postgresql',
  connectionString: DB_URL,
});

if (writeResult.rowCount === 0) {
  // Another agent (reviewer) modified this article since we last read it
  console.log('Conflict detected — re-read and retry');
}
```

---

## Database Schema for This Example

```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  body TEXT,
  status VARCHAR(20) DEFAULT 'draft',  -- draft, approved, needs_revision, published, archived
  review_notes TEXT,
  author_agent VARCHAR(50),
  reviewer_agent VARCHAR(50),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON articles(status);
```

---

## Best Practices

1. **Principle of least privilege** — Give each agent only the tools it needs. Read-only agents should not have write tools.
2. **Use optimistic locking** — When multiple agents write to the same tables, use version columns to detect conflicts.
3. **Use system prompts to enforce rules** — Tell agents explicitly what they can and cannot do.
4. **Inspect schema before writing** — Always include `relationalGetSchema` so agents can verify columns.
5. **Add safety guards** — Use the tool's `allowFullTableUpdate: false` (default) to prevent accidental bulk modifications.
6. **Log agent actions** — Each agent's tool calls are captured in the message history for auditing.
