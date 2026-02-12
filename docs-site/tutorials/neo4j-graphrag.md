# Building GraphRAG Applications with Neo4j

Learn how to build production-ready GraphRAG (Graph Retrieval-Augmented Generation) applications using AgentForge's Neo4j tools.

## What is GraphRAG?

GraphRAG combines the power of:
- **Knowledge Graphs** - Structured relationships between entities
- **Vector Embeddings** - Semantic similarity search
- **LLM Generation** - Natural language understanding and generation

This enables AI agents to retrieve rich, contextual information by combining semantic search with graph traversal.

## Prerequisites

```bash
# Install dependencies
pnpm add @agentforge/tools neo4j-driver

# Install Neo4j (choose one):
# - Docker: docker run -p 7687:7687 -p 7474:7474 neo4j
# - Desktop: https://neo4j.com/download/
# - Cloud: https://neo4j.com/cloud/aura/
```

## Tutorial: Building a Knowledge Base Agent

We'll build an AI agent that can:
1. Ingest documents into a knowledge graph
2. Generate embeddings automatically
3. Answer questions using GraphRAG retrieval

### Step 1: Setup and Configuration

```typescript
// config.ts
import { initializeNeo4jTools } from '@agentforge/tools';

export async function setupNeo4j() {
  // Initialize from environment variables
  await initializeNeo4jTools();
  
  console.log('✅ Neo4j connected');
}
```

**Environment variables (.env):**

```bash
# Neo4j Connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Embedding Provider (choose one)
EMBEDDING_PROVIDER=openai  # or: cohere, huggingface, voyage, ollama
OPENAI_API_KEY=sk-...      # or appropriate key for your provider
```

### Step 2: Create the Knowledge Graph Schema

```typescript
// schema.ts
import { neo4jQuery } from '@agentforge/tools';

export async function createSchema() {
  // Create vector index for semantic search
  await neo4jQuery.execute({
    cypher: `
      CREATE VECTOR INDEX document_embeddings IF NOT EXISTS
      FOR (n:Document)
      ON (n.embedding)
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: 1536,
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `
  });

  // Create constraints for data integrity
  await neo4jQuery.execute({
    cypher: `
      CREATE CONSTRAINT document_id IF NOT EXISTS
      FOR (d:Document) REQUIRE d.id IS UNIQUE
    `
  });

  // Create indexes for faster queries
  await neo4jQuery.execute({
    cypher: `
      CREATE INDEX document_category IF NOT EXISTS
      FOR (d:Document) ON (d.category)
    `
  });

  console.log('✅ Schema created');
}
```

### Step 3: Ingest Documents

```typescript
// ingest.ts
import { 
  neo4jQuery, 
  neo4jCreateNodeWithEmbedding 
} from '@agentforge/tools';

export async function ingestDocuments(documents: Array<{
  id: string;
  title: string;
  content: string;
  category: string;
  author?: string;
  tags?: string[];
}>) {
  for (const doc of documents) {
    // Create document node with automatic embedding
    const result = await neo4jCreateNodeWithEmbedding.execute({
      label: 'Document',
      properties: {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        createdAt: new Date().toISOString()
      },
      textProperty: 'content',        // Generate embedding from content
      embeddingProperty: 'embedding'  // Store embedding here
    });

    console.log(`✅ Created document: ${doc.title}`);
    console.log(`   Model: ${result.embedding.model}`);
    console.log(`   Dimensions: ${result.embedding.dimensions}`);

    // Create relationships to author
    if (doc.author) {
      await neo4jQuery.execute({
        cypher: `
          MATCH (d:Document {id: $docId})
          MERGE (a:Author {name: $author})
          MERGE (a)-[:AUTHORED]->(d)
        `,
        parameters: { docId: doc.id, author: doc.author }
      });
    }

    // Create relationships to tags
    if (doc.tags) {
      for (const tag of doc.tags) {
        await neo4jQuery.execute({
          cypher: `
            MATCH (d:Document {id: $docId})
            MERGE (t:Tag {name: $tag})
            MERGE (d)-[:TAGGED_WITH]->(t)
          `,
          parameters: { docId: doc.id, tag }
        });
      }
    }
  }

  console.log(`✅ Ingested ${documents.length} documents`);
}
```

### Step 4: Build the Retrieval Function

```typescript
// retrieval.ts
import {
  neo4jVectorSearchWithEmbedding,
  neo4jTraverse
} from '@agentforge/tools';

export async function retrieveContext(query: string, options = {
  topK: 5,
  expandDepth: 2
}) {
  // 1. Find semantically similar documents
  const searchResults = await neo4jVectorSearchWithEmbedding.execute({
    indexName: 'document_embeddings',
    queryText: query,
    limit: options.topK
  });

  console.log(`🔍 Found ${searchResults.count} relevant documents`);
  console.log(`   Using: ${searchResults.embedding.model}`);

  // 2. Expand context by traversing relationships
  const expandedContext = [];

  for (const item of searchResults.results) {
    const nodeId = item.node.identity;

    // Get related entities (authors, tags, cited documents)
    // Note: To traverse multiple relationship types, call traverse multiple times
    const neighbors = await neo4jTraverse.execute({
      startNodeId: nodeId,
      // relationshipType is optional - omit to follow all relationships
      direction: 'both',  // lowercase: 'outgoing', 'incoming', or 'both'
      maxDepth: options.expandDepth,
      limit: 20
    });

    expandedContext.push({
      document: item.node.properties,
      score: item.score,
      relatedEntities: neighbors.paths.map(path => ({
        start: path.start,
        end: path.end,
        relationships: path.relationships,
        depth: path.depth
      }))
    });
  }

  return expandedContext;
}
```

### Step 5: Create the Agent

```typescript
// agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  neo4jVectorSearchWithEmbedding,
  neo4jFindNodes,
  neo4jTraverse
} from '@agentforge/tools';
import { retrieveContext } from './retrieval';

export async function createKnowledgeAgent() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0
  });

  // Give the agent Neo4j tools
  const tools = [
    neo4jVectorSearchWithEmbedding,
    neo4jFindNodes,
    neo4jTraverse
  ];

  const agent = createReactAgent({
    llm: model,
    tools
  });

  return agent;
}

// Use the agent
export async function answerQuestion(question: string) {
  // 1. Retrieve relevant context
  const context = await retrieveContext(question);

  // 2. Format context for the LLM
  const formattedContext = context.map((item, i) => {
    const doc = item.document;
    const related = item.relatedEntities.length;

    return `
Document ${i + 1} (Relevance: ${item.score.toFixed(3)}):
Title: ${doc.title}
Category: ${doc.category}
Content: ${doc.content}
Related Entities: ${related} (authors, tags, citations)
    `.trim();
  }).join('\n\n---\n\n');

  // 3. Create the agent
  const agent = await createKnowledgeAgent();

  // 4. Invoke with context
  const response = await agent.invoke({
    messages: [{
      role: 'user',
      content: `
Context from knowledge graph:
${formattedContext}

Question: ${question}

Please answer the question using the provided context. If you need more information, you can use the Neo4j tools to explore the knowledge graph.
      `.trim()
    }]
  });

  return response;
}
```

### Step 6: Put It All Together

```typescript
// main.ts
import { setupNeo4j } from './config';
import { createSchema } from './schema';
import { ingestDocuments } from './ingest';
import { answerQuestion } from './agent';

async function main() {
  // 1. Setup
  await setupNeo4j();
  await createSchema();

  // 2. Ingest sample documents
  const documents = [
    {
      id: 'doc-1',
      title: 'Introduction to Graph Databases',
      content: 'Graph databases like Neo4j store data as nodes and relationships, enabling efficient traversal of connected data.',
      category: 'database',
      author: 'Alice Johnson',
      tags: ['graphs', 'databases', 'neo4j']
    },
    {
      id: 'doc-2',
      title: 'Understanding GraphRAG',
      content: 'GraphRAG combines knowledge graphs with retrieval-augmented generation to provide rich context for LLMs.',
      category: 'ai',
      author: 'Bob Smith',
      tags: ['graphrag', 'ai', 'rag']
    },
    {
      id: 'doc-3',
      title: 'Vector Embeddings Explained',
      content: 'Vector embeddings represent text as high-dimensional vectors, enabling semantic similarity search.',
      category: 'ai',
      author: 'Alice Johnson',
      tags: ['embeddings', 'vectors', 'ai']
    }
  ];

  await ingestDocuments(documents);

  // 3. Ask questions
  const questions = [
    'What is GraphRAG?',
    'How do graph databases work?',
    'What has Alice Johnson written about?'
  ];

  for (const question of questions) {
    console.log(`\n❓ Question: ${question}`);
    const answer = await answerQuestion(question);
    console.log(`💡 Answer: ${answer.messages[answer.messages.length - 1].content}`);
  }
}

main().catch(console.error);
```

## Advanced Patterns

### Multi-Hop Reasoning

```typescript
import { neo4jQuery } from '@agentforge/tools';

// Find documents through multi-hop relationships
const result = await neo4jQuery.execute({
  cypher: `
    CALL db.index.vector.queryNodes('document_embeddings', 5, $queryVector)
    YIELD node, score

    // Expand to related documents through citations
    OPTIONAL MATCH (node)-[:CITES]->(cited:Document)
    OPTIONAL MATCH (node)<-[:CITES]-(citing:Document)

    // Get author's other works
    OPTIONAL MATCH (node)<-[:AUTHORED]-(author:Author)-[:AUTHORED]->(otherDocs:Document)

    RETURN
      node,
      score,
      collect(DISTINCT cited) as citedDocs,
      collect(DISTINCT citing) as citingDocs,
      collect(DISTINCT otherDocs) as authorOtherWorks
    ORDER BY score DESC
  `,
  parameters: { queryVector: embedding }
});
```

### Hybrid Search (Vector + Keyword)

```typescript
// Combine semantic search with keyword filtering
const result = await neo4jQuery.execute({
  cypher: `
    CALL db.index.vector.queryNodes('document_embeddings', 10, $queryVector)
    YIELD node, score
    WHERE node.category = $category
      AND any(tag IN node.tags WHERE tag IN $requiredTags)
    RETURN node, score
    ORDER BY score DESC
    LIMIT 5
  `,
  parameters: {
    queryVector: embedding,
    category: 'ai',
    requiredTags: ['graphrag', 'rag']
  }
});
```

## Embedding Provider Comparison

### When to Use Each Provider

**OpenAI** - Best for production
```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small  # 1536 dims, $0.02/1M tokens
```

**Cohere** - Best for multilingual
```bash
EMBEDDING_PROVIDER=cohere
COHERE_API_KEY=...
EMBEDDING_MODEL=embed-multilingual-v3.0  # 1024 dims, 100+ languages
```

**HuggingFace** - Best for customization
```bash
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=...
EMBEDDING_MODEL=BAAI/bge-large-en-v1.5  # 1024 dims, state-of-the-art
```

**Voyage** - Best for domain-specific
```bash
EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=...
EMBEDDING_MODEL=voyage-code-2  # 1536 dims, optimized for code
```

**Ollama** - Best for privacy/offline
```bash
# No API key needed!
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text  # 768 dims, runs locally
```

## Best Practices

### 1. Vector Index Dimensions

Match your index dimensions to your embedding model:

```typescript
// OpenAI text-embedding-3-small: 1536 dimensions
\`vector.dimensions\`: 1536

// Cohere embed-english-v3.0: 1024 dimensions
\`vector.dimensions\`: 1024

// Ollama nomic-embed-text: 768 dimensions
\`vector.dimensions\`: 768
```

### 2. Batch Processing

Process documents in batches for better performance:

```typescript
const BATCH_SIZE = 10;

for (let i = 0; i < documents.length; i += BATCH_SIZE) {
  const batch = documents.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(doc => ingestDocument(doc)));
  console.log(`Processed ${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length}`);
}
```

### 3. Error Handling

```typescript
try {
  const result = await neo4jVectorSearchWithEmbedding.execute({
    indexName: 'document_embeddings',
    queryText: query,
    limit: 5
  });
} catch (error) {
  if (error.message.includes('Index not found')) {
    console.error('Vector index not created. Run createSchema() first.');
  } else if (error.message.includes('API key')) {
    console.error('Embedding provider not configured. Check your .env file.');
  } else {
    throw error;
  }
}
```

### 4. Connection Pooling

```typescript
import { neo4jPool } from '@agentforge/tools';

// Graceful shutdown
process.on('SIGTERM', async () => {
  await neo4jPool.close();
  process.exit(0);
});
```

## Next Steps

- Explore [Neo4j Tools API Reference](/api/tools#neo4j-graph-database-7-tools)
- Learn about [Custom Tools](/tutorials/custom-tools)
- Check out [Production Deployment](/tutorials/production-deployment)

## Resources

- [Neo4j Documentation](https://neo4j.com/docs/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/)
- [Vector Search in Neo4j](https://neo4j.com/docs/cypher-manual/current/indexes-for-vector-search/)
- [AgentForge GitHub](https://github.com/TVScoundrel/agentforge)



