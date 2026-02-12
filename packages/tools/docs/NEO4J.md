# Neo4j Tools Documentation

Complete guide to using Neo4j graph database tools in AgentForge.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [Available Tools](#available-tools)
- [Usage Examples](#usage-examples)
- [GraphRAG with Neo4j](#graphrag-with-neo4j)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Neo4j tools provide a complete interface for working with Neo4j graph databases in your AI agents. These tools are essential for:

- **Knowledge Graphs**: Build and query structured knowledge representations
- **GraphRAG**: Implement Retrieval-Augmented Generation with graph databases
- **Relationship Analysis**: Explore complex relationships between entities
- **Semantic Search**: Find similar nodes using vector embeddings

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @agentforge/tools
# Neo4j driver is included as a dependency
```

### 2. Configure Connection

Set environment variables for your Neo4j instance:

```bash
# Required
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Optional
NEO4J_DATABASE=neo4j  # Defaults to 'neo4j'

# For embedding-enabled tools (optional)
# Choose your embedding provider (defaults to 'openai')
EMBEDDING_PROVIDER=openai  # Options: openai, cohere, huggingface, voyage, ollama

# Set the appropriate API key for your chosen provider
OPENAI_API_KEY=sk-...           # For OpenAI
COHERE_API_KEY=...              # For Cohere
HUGGINGFACE_API_KEY=...         # For HuggingFace
VOYAGE_API_KEY=...              # For Voyage AI
OLLAMA_BASE_URL=http://localhost:11434  # For Ollama (optional, this is the default)

# Optional: Override default model for your provider
EMBEDDING_MODEL=text-embedding-3-small  # Provider-specific model
```

### 3. Initialize Connection

```typescript
import { initializeNeo4jTools } from '@agentforge/tools';

// Initialize from environment variables
await initializeNeo4jTools();

// Or initialize with custom config
import { neo4jPool } from '@agentforge/tools';

await neo4jPool.initialize({
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'your-password',
  database: 'neo4j',
});
```

## Available Tools

### 1. neo4jQuery

Execute arbitrary Cypher queries against Neo4j.

```typescript
import { neo4jQuery } from '@agentforge/tools';

const result = await neo4jQuery.execute({
  cypher: 'MATCH (n:Person) WHERE n.age > $minAge RETURN n LIMIT 10',
  parameters: { minAge: 25 },
  database: 'neo4j', // Optional
});

console.log(result.data);        // Query results
console.log(result.recordCount); // Number of records
console.log(result.summary);     // Query statistics
```

**Use Cases:**
- Complex graph queries
- Data manipulation (CREATE, UPDATE, DELETE)
- Custom analytics
- Batch operations

### 2. neo4jGetSchema

Introspect the graph schema to understand its structure.

```typescript
import { neo4jGetSchema } from '@agentforge/tools';

const result = await neo4jGetSchema.execute({});

console.log(result.schema.nodeLabels);        // All node labels
console.log(result.schema.relationshipTypes); // All relationship types
console.log(result.schema.propertyKeys);      // All property keys
console.log(result.schema.constraints);       // Database constraints
console.log(result.schema.indexes);           // Database indexes
```

**Use Cases:**
- Help LLMs understand graph structure
- Validate queries before execution
- Generate documentation
- Schema exploration

### 3. neo4jFindNodes

Find nodes by label and properties (simplified query interface).

```typescript
import { neo4jFindNodes } from '@agentforge/tools';

const result = await neo4jFindNodes.execute({
  label: 'Person',
  properties: {
    city: 'New York',
    active: true,
  },
  limit: 100,
});

console.log(result.nodes); // Array of matching nodes
console.log(result.count); // Number of nodes found
```

**Use Cases:**
- Simple node lookups
- Entity search
- Data validation
- Quick queries without writing Cypher

### 4. neo4jTraverse

Traverse the graph from a starting node following relationships.

```typescript
import { neo4jTraverse } from '@agentforge/tools';

const result = await neo4jTraverse.execute({
  startNodeId: 123,
  relationshipType: 'KNOWS',  // Optional
  direction: 'outgoing',       // 'outgoing', 'incoming', or 'both'
  maxDepth: 2,
  limit: 50,
});

result.paths.forEach(path => {
  console.log(`${path.start.properties.name} -> ${path.end.properties.name}`);
  console.log(`Depth: ${path.depth}`);
  console.log(`Relationships:`, path.relationships);
});
```

**Use Cases:**
- Explore connections
- Find related entities
- Path discovery
- Network analysis

### 5. neo4jVectorSearch

Perform semantic similarity search using vector indexes (essential for GraphRAG).

```typescript
import { neo4jVectorSearch } from '@agentforge/tools';

// Example: Create a 1536-dimensional embedding vector (for OpenAI text-embedding-3-small)
const embeddingVector = new Array(1536).fill(0).map(() => Math.random());

const result = await neo4jVectorSearch.execute({
  indexName: 'document_embeddings',
  queryVector: embeddingVector,
  limit: 5,
});

result.results.forEach(item => {
  console.log(`Node:`, item.node);
  console.log(`Similarity Score:`, item.score);
});
```

**Prerequisites:**
You must create a vector index first:

```cypher
CREATE VECTOR INDEX document_embeddings
FOR (n:Document)
ON (n.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
}
```

**Use Cases:**
- GraphRAG retrieval
- Semantic search
- Similar entity discovery
- Recommendation systems

### 6. neo4jVectorSearchWithEmbedding

Perform semantic search with automatic embedding generation from text.

```typescript
import { neo4jVectorSearchWithEmbedding } from '@agentforge/tools';

const result = await neo4jVectorSearchWithEmbedding.execute({
  indexName: 'document_embeddings',
  queryText: 'How do graph databases work?',  // Text is automatically embedded
  limit: 5,
});

console.log('Query:', result.query.text);
console.log('Embedding model:', result.embedding.model);
result.results.forEach(item => {
  console.log(`Node:`, item.node);
  console.log(`Similarity Score:`, item.score);
});
```

**Use Cases:**
- Simplified GraphRAG retrieval (no manual embedding generation)
- Natural language search over graph data
- Question answering systems

### 7. neo4jCreateNodeWithEmbedding

Create nodes with automatic embedding generation from text properties.

```typescript
import { neo4jCreateNodeWithEmbedding } from '@agentforge/tools';

const result = await neo4jCreateNodeWithEmbedding.execute({
  label: 'Document',
  properties: {
    title: 'Introduction to Neo4j',
    content: 'Neo4j is a powerful graph database...',
    category: 'database',
  },
  textProperty: 'content',  // Property to generate embedding from
  embeddingProperty: 'embedding',  // Where to store the embedding
});

console.log('Node created:', result.nodeId);
console.log('Embedding dimensions:', result.embedding.dimensions);
console.log('Model used:', result.embedding.model);
```

**Use Cases:**
- Building GraphRAG knowledge bases
- Automatic document indexing
- Semantic search preparation

## Usage Examples

### Example 1: Building a Knowledge Graph

```typescript
import { neo4jQuery, neo4jGetSchema } from '@agentforge/tools';

// Create a knowledge graph about AI topics
await neo4jQuery.execute({
  cypher: `
    CREATE (ai:Topic {name: 'Artificial Intelligence', category: 'Technology'})
    CREATE (ml:Topic {name: 'Machine Learning', category: 'Technology'})
    CREATE (dl:Topic {name: 'Deep Learning', category: 'Technology'})
    CREATE (nlp:Topic {name: 'NLP', category: 'Technology'})
    CREATE (ai)-[:INCLUDES]->(ml)
    CREATE (ml)-[:INCLUDES]->(dl)
    CREATE (ml)-[:INCLUDES]->(nlp)
    RETURN ai, ml, dl, nlp
  `,
});

// Verify the schema
const schema = await neo4jGetSchema.execute({});
console.log('Created labels:', schema.schema.nodeLabels);
console.log('Created relationships:', schema.schema.relationshipTypes);
```

### Example 2: Querying Relationships

```typescript
import { neo4jQuery, neo4jTraverse } from '@agentforge/tools';

// Find a starting node
const aiTopic = await neo4jQuery.execute({
  cypher: 'MATCH (t:Topic {name: "Artificial Intelligence"}) RETURN id(t) as id',
});

const aiId = aiTopic.data[0].id;

// Traverse to find all subtopics
const subtopics = await neo4jTraverse.execute({
  startNodeId: aiId,
  relationshipType: 'INCLUDES',
  direction: 'outgoing',
  maxDepth: 3,
  limit: 100,
});

console.log(`Found ${subtopics.count} related topics`);
```

### Example 3: GraphRAG Implementation (Simplified with Embeddings)

```typescript
import {
  neo4jQuery,
  neo4jCreateNodeWithEmbedding,
  neo4jVectorSearchWithEmbedding
} from '@agentforge/tools';

// 1. Create vector index (run once)
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
  `,
});

// 2. Add documents with automatic embeddings
const documents = [
  { title: 'Neo4j Guide', content: 'Neo4j is a graph database that stores data as nodes and relationships.' },
  { title: 'GraphRAG Overview', content: 'GraphRAG combines graph databases with retrieval-augmented generation.' },
  { title: 'Vector Search', content: 'Vector search enables semantic similarity matching using embeddings.' },
];

for (const doc of documents) {
  await neo4jCreateNodeWithEmbedding.execute({
    label: 'Document',
    properties: doc,
    textProperty: 'content',  // Automatically generates embedding from content
    embeddingProperty: 'embedding',
  });
}

// 3. Query using semantic search (automatic embedding generation)
const results = await neo4jVectorSearchWithEmbedding.execute({
  indexName: 'document_embeddings',
  queryText: 'What is GraphRAG?',  // Text is automatically embedded
  limit: 3,
});

console.log(`Found ${results.count} relevant documents:`);
results.results.forEach(item => {
  console.log(`- ${item.node.properties.title} (score: ${item.score})`);
});

console.log('Most relevant documents:', results.results);
```

## GraphRAG with Neo4j

GraphRAG (Graph Retrieval-Augmented Generation) combines the power of knowledge graphs with vector embeddings for enhanced retrieval.

### Benefits

1. **Structured Context**: Retrieve not just similar documents, but their relationships
2. **Multi-hop Reasoning**: Follow graph paths to gather comprehensive context
3. **Entity Relationships**: Understand how entities relate to each other
4. **Hybrid Search**: Combine semantic similarity with graph structure

### Implementation Pattern

```typescript
// 1. Find relevant nodes via vector search
const relevant = await neo4jVectorSearch.execute({
  indexName: 'embeddings',
  queryVector: queryEmbedding,
  limit: 5,
});

// 2. Expand context by traversing relationships
const expandedContext = [];
for (const item of relevant.results) {
  const nodeId = item.node.identity;

  const neighbors = await neo4jTraverse.execute({
    startNodeId: nodeId,
    maxDepth: 2,
    limit: 20,
  });

  expandedContext.push({
    node: item.node,
    score: item.score,
    relatedNodes: neighbors.paths,
  });
}

// 3. Use expanded context for generation
const context = expandedContext
  .map(item => `${item.node.properties.text}\nRelated: ${item.relatedNodes.length} entities`)
  .join('\n\n');
```

## Embedding Providers

AgentForge supports **5 embedding providers** out of the box, making it truly provider-agnostic. Choose the provider that best fits your needs based on cost, performance, privacy, and model availability.

### Supported Providers

#### 1. OpenAI (Default)

**Best for:** Production applications, high-quality embeddings, wide model selection

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small  # Optional, this is the default
```

**Available Models:**
- `text-embedding-3-small` (1536 dimensions, default)
- `text-embedding-3-large` (3072 dimensions, higher quality)
- `text-embedding-ada-002` (1536 dimensions, legacy)

**Pricing:** ~$0.02 per 1M tokens (text-embedding-3-small)

---

#### 2. Cohere

**Best for:** Multilingual embeddings, search-optimized embeddings

```bash
EMBEDDING_PROVIDER=cohere
COHERE_API_KEY=...
EMBEDDING_MODEL=embed-english-v3.0  # Optional, this is the default
```

**Available Models:**
- `embed-english-v3.0` (1024 dimensions, default)
- `embed-multilingual-v3.0` (1024 dimensions, 100+ languages)
- `embed-english-light-v3.0` (384 dimensions, faster/cheaper)

**Pricing:** ~$0.10 per 1M tokens

---

#### 3. HuggingFace

**Best for:** Open-source models, customization, cost control

```bash
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=...
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2  # Optional, this is the default
```

**Available Models:**
- `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, default, fast)
- `sentence-transformers/all-mpnet-base-v2` (768 dimensions, higher quality)
- `BAAI/bge-large-en-v1.5` (1024 dimensions, state-of-the-art)
- Any model from HuggingFace Hub with embedding support

**Pricing:** Free tier available, then ~$0.06 per 1M tokens

---

#### 4. Voyage AI

**Best for:** Domain-specific embeddings, retrieval-optimized models

```bash
EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=...
EMBEDDING_MODEL=voyage-2  # Optional, this is the default
```

**Available Models:**
- `voyage-2` (1024 dimensions, default, general purpose)
- `voyage-code-2` (1536 dimensions, optimized for code)
- `voyage-large-2` (1536 dimensions, higher quality)

**Pricing:** ~$0.12 per 1M tokens

---

#### 5. Ollama (Local)

**Best for:** Privacy, offline usage, no API costs, local development

```bash
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434  # Optional, this is the default
EMBEDDING_MODEL=nomic-embed-text  # Optional, this is the default
```

**Setup:**
```bash
# Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull an embedding model
ollama pull nomic-embed-text
```

**Available Models:**
- `nomic-embed-text` (768 dimensions, default, high quality)
- `mxbai-embed-large` (1024 dimensions, state-of-the-art)
- `all-minilm` (384 dimensions, fast and lightweight)

**Pricing:** Free (runs locally)

**Note:** No API key required! Ollama runs entirely on your machine.

---

### Choosing a Provider

| Provider | Best For | Dimensions | Cost | Privacy |
|----------|----------|------------|------|---------|
| **OpenAI** | Production, quality | 1536-3072 | Low | Cloud |
| **Cohere** | Multilingual | 384-1024 | Medium | Cloud |
| **HuggingFace** | Open-source, flexibility | 384-1024 | Low-Free | Cloud |
| **Voyage** | Domain-specific | 1024-1536 | Medium | Cloud |
| **Ollama** | Privacy, offline | 384-1024 | Free | Local |

### Switching Providers

Switching between providers is as simple as changing environment variables:

```bash
# Switch from OpenAI to Cohere
EMBEDDING_PROVIDER=cohere
COHERE_API_KEY=your-cohere-key

# Switch to local Ollama (no API key needed)
EMBEDDING_PROVIDER=ollama
# Make sure Ollama is running: ollama serve
```

**Important:** Different providers produce embeddings with different dimensions. Make sure your Neo4j vector index matches the dimensions of your chosen model:

```typescript
// For OpenAI text-embedding-3-small (1536 dimensions)
await neo4jQuery.execute({
  cypher: `
    CREATE VECTOR INDEX embeddings IF NOT EXISTS
    FOR (n:Document) ON (n.embedding)
    OPTIONS { indexConfig: { \`vector.dimensions\`: 1536 } }
  `,
});

// For Cohere embed-english-v3.0 (1024 dimensions)
await neo4jQuery.execute({
  cypher: `
    CREATE VECTOR INDEX embeddings IF NOT EXISTS
    FOR (n:Document) ON (n.embedding)
    OPTIONS { indexConfig: { \`vector.dimensions\`: 1024 } }
  `,
});
```

## Best Practices

### 1. Connection Management

```typescript
import { neo4jPool } from '@agentforge/tools';

// Initialize once at application startup
await initializeNeo4jTools();

// Use tools throughout your application
// ...

// Close connection on shutdown
process.on('SIGTERM', async () => {
  await neo4jPool.close();
});
```

### 2. Parameterized Queries

Always use parameters to prevent Cypher injection:

```typescript
// ✅ Good - parameterized
await neo4jQuery.execute({
  cypher: 'MATCH (n:Person {name: $name}) RETURN n',
  parameters: { name: userInput },
});

// ❌ Bad - string concatenation
await neo4jQuery.execute({
  cypher: `MATCH (n:Person {name: "${userInput}"}) RETURN n`,
});
```

### 3. Limit Results

Always use LIMIT to prevent overwhelming queries:

```typescript
await neo4jQuery.execute({
  cypher: 'MATCH (n:Person) RETURN n LIMIT 100',
});
```

### 4. Schema First

Get the schema before complex operations:

```typescript
const schema = await neo4jGetSchema.execute({});
// Use schema to validate your queries
```

## Troubleshooting

### Connection Issues

```typescript
// Test connection
import { neo4jPool } from '@agentforge/tools';

try {
  await neo4jPool.verifyConnectivity();
  console.log('✅ Connected to Neo4j');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
}
```

### Common Errors

**"Neo4j connection not initialized"**
- Solution: Call `await initializeNeo4jTools()` before using tools

**"Index not found"**
- Solution: Create the vector index before using `neo4jVectorSearch`

**"Invalid Cypher syntax"**
- Solution: Validate your Cypher query syntax

### Debug Mode

Enable detailed logging:

```typescript
process.env.DEBUG = 'neo4j:*';
```

## Additional Resources

- [Neo4j Cypher Manual](https://neo4j.com/docs/cypher-manual/)
- [Neo4j Vector Search](https://neo4j.com/docs/cypher-manual/current/indexes-for-vector-search/)
- [GraphRAG Patterns](https://neo4j.com/developer/graphrag/)
- [AgentForge Documentation](https://tvscoundrel.github.io/agentforge/)


