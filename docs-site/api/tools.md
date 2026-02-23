# @agentforge/tools

Standard tools library with 88 production-ready tools.

## Installation

```bash
pnpm add @agentforge/tools
```

## Web Tools (22)

### Web Search

```typescript
import { webSearch } from '@agentforge/tools';

// Basic search (no API key needed - uses DuckDuckGo)
const result = await webSearch.invoke({
  query: 'TypeScript programming language',
  maxResults: 10
});

console.log(`Found ${result.results.length} results from ${result.source}`);
result.results.forEach(r => {
  console.log(`${r.title}: ${r.link}`);
  console.log(`  ${r.snippet}`);
});

// Premium search with Serper API (requires SERPER_API_KEY env var)
// Get your API key at: https://serper.dev
const premiumResult = await webSearch.invoke({
  query: 'Latest AI developments 2026',
  maxResults: 5,
  preferSerper: true  // Use Serper for Google search results
});

// Check metadata
console.log(`Source: ${premiumResult.source}`);
console.log(`Fallback used: ${premiumResult.metadata?.fallbackUsed}`);
console.log(`Response time: ${premiumResult.metadata?.responseTime}ms`);
```

**Features:**
- No API key required for basic searches (uses DuckDuckGo)
- Optional Serper API for premium Google search results
- Smart fallback: automatically switches providers when needed
- Returns structured results with titles, links, and snippets
- Tracks metadata (source, fallback usage, response time)

**Environment Setup:**
```bash
# Optional: Add to your .env file for premium Google search
SERPER_API_KEY=your-serper-api-key-here
```

### HTTP Client

```typescript
import { httpClient, httpGet, httpPost } from '@agentforge/tools';

// Generic HTTP request
const response = await httpClient.invoke({
  url: 'https://api.example.com/data',
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
});

// GET request
const data = await httpGet.invoke({
  url: 'https://api.example.com/users'
});

// POST request
const result = await httpPost.invoke({
  url: 'https://api.example.com/users',
  body: { name: 'John' }
});
```

### Web Scraping

```typescript
import { webScraper, htmlParser, extractLinks } from '@agentforge/tools';

// Scrape webpage
const content = await webScraper.invoke({
  url: 'https://example.com',
  selector: '.content'
});

// Parse HTML
const parsed = await htmlParser.invoke({
  html: '<div>Content</div>',
  selector: 'div'
});

// Extract links
const links = await extractLinks.invoke({
  html: '<a href="/page">Link</a>'
});
```

### URL Utilities

```typescript
import { urlValidator, urlBuilder, urlQueryParser } from '@agentforge/tools';

// Validate URL - returns detailed URL components
const result = await urlValidator.invoke({
  url: 'https://example.com/path?query=value#hash'
});
console.log(result.data?.protocol);  // 'https:'
console.log(result.data?.hostname);  // 'example.com'
console.log(result.data?.pathname);  // '/path'

// Build URL from components
const url = await urlBuilder.invoke({
  protocol: 'https',
  hostname: 'api.example.com',
  pathname: '/users',
  query: { page: '1', limit: '10' }
});
console.log(url.url);  // 'https://api.example.com/users?page=1&limit=10'

// Parse query string - accepts URL or query string
const params = await urlQueryParser.invoke({
  input: 'https://example.com?foo=bar&baz=qux'
});
console.log(params.params);  // { foo: 'bar', baz: 'qux' }
console.log(params.count);   // 2
```

### Slack Integration

```typescript
import {
  sendSlackMessage,
  notifySlack,
  getSlackChannels,
  getSlackMessages,
  createSlackTools
} from '@agentforge/tools';

// Send a message to a Slack channel
const result = await sendSlackMessage.invoke({
  channel: 'general',  // Channel name (no #) or ID
  message: 'Hello from AgentForge! 👋'
});

// Send a notification with @mentions
const notification = await notifySlack.invoke({
  channel: 'alerts',  // Channel name (no #) or ID
  message: 'Deployment completed successfully!',
  mentions: ['john', 'jane']  // Usernames without @
});

// List available channels
const channels = await getSlackChannels.invoke({
  include_private: true  // Note: underscore, not camelCase
});

console.log(`Found ${channels.data?.count} channels`);
channels.data?.channels.forEach(ch => {
  console.log(`${ch.name} (${ch.num_members} members)`);
});

// Read message history
const messages = await getSlackMessages.invoke({
  channel: 'general',  // Channel name (no #) or ID
  limit: 10
});

console.log(`Retrieved ${messages.data?.count} messages`);
messages.data?.messages.forEach(msg => {
  console.log(`[${msg.timestamp}] ${msg.user}: ${msg.text}`);
});

// Custom configuration with factory function
const customSlackTools = createSlackTools({
  token: 'xoxb-your-custom-token'
});

// Use custom tools
const customResult = await customSlackTools.sendMessage.invoke({
  channel: 'custom',  // Channel name (no #) or ID
  message: 'Using custom token configuration'
});
```

**Features:**
- Send messages to any Slack channel
- Notify team members with @mentions
- List public and private channels
- Read message history with pagination
- Configurable via environment variables or programmatic configuration
- Full TypeScript support with Zod validation
- Structured logging for debugging

**Environment Setup:**
```bash
# Add to your .env file
# Use either a User Token or Bot Token
SLACK_USER_TOKEN=xoxp-your-user-token-here
# OR
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
```

**Getting a Slack Token:**
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Create a new app or select an existing one
3. Navigate to "OAuth & Permissions"
4. Add required scopes:
   - **User Token Scopes**: `channels:read`, `channels:history`, `chat:write`, `groups:read`, `groups:history`
   - **Bot Token Scopes**: `channels:read`, `channels:history`, `chat:write`, `groups:read`, `groups:history`
5. Install the app to your workspace
6. Copy the token (starts with `xoxp-` for user tokens or `xoxb-` for bot tokens)

**Programmatic Configuration:**
```typescript
// Override environment variables with custom configuration
const slackTools = createSlackTools({
  token: 'xoxb-your-custom-token'
});

// Use the custom tools (returns object with named properties)
const { sendMessage, notify, getChannels, getMessages } = slackTools;
```

### Confluence Integration

```typescript
import {
  searchConfluence,
  getConfluencePage,
  listConfluenceSpaces,
  getSpacePages,
  createConfluencePage,
  updateConfluencePage,
  archiveConfluencePage,
  createConfluenceTools
} from '@agentforge/tools';

// Search for pages across all spaces
const searchResult = await searchConfluence.invoke({
  query: 'API documentation',
  limit: 10
});

// Parse JSON string result
const searchData = JSON.parse(searchResult);
console.log(`Found ${searchData.count} pages (total: ${searchData.total})`);
searchData.results.forEach(page => {
  console.log(`${page.title} (${page.space})`);
  console.log(`  URL: ${page.url}`);
});

// Get a specific page by ID
const pageResult = await getConfluencePage.invoke({
  page_id: '123456'
});

// Parse JSON string result
const pageData = JSON.parse(pageResult);
console.log(`Title: ${pageData.page.title}`);
console.log(`Space: ${pageData.page.space}`);
console.log(`Content: ${pageData.page.content}`);
console.log(`Version: ${pageData.page.version}`);

// List all available spaces
const spacesResult = await listConfluenceSpaces.invoke({
  limit: 25
});

// Parse JSON string result
const spacesData = JSON.parse(spacesResult);
console.log(`Found ${spacesData.count} spaces`);
spacesData.spaces.forEach(space => {
  console.log(`${space.name} (${space.key})`);
});

// Get all pages in a specific space
const spacePagesResult = await getSpacePages.invoke({
  space_key: 'DOCS',
  limit: 50
});

// Parse JSON string result
const spacePagesData = JSON.parse(spacePagesResult);
console.log(`Found ${spacePagesData.count} pages in space ${spacePagesData.space}`);
spacePagesData.pages.forEach(page => {
  console.log(`${page.title} (ID: ${page.id})`);
});

// Create a new page
const newPageResult = await createConfluencePage.invoke({
  space_key: 'DOCS',
  title: 'New Documentation Page',
  content: '<p>This is the page content in Confluence storage format.</p>'
});

// Parse JSON string result
const newPageData = JSON.parse(newPageResult);
console.log(`Created page: ${newPageData.page.title}`);
console.log(`Page ID: ${newPageData.page.id}`);
console.log(`URL: ${newPageData.page.url}`);

// Create a child page
const childPageResult = await createConfluencePage.invoke({
  space_key: 'DOCS',
  title: 'Child Page',
  content: '<p>This is a child page.</p>',
  parent_page_id: '123456'
});

// Update an existing page
const updatedPageResult = await updateConfluencePage.invoke({
  page_id: '123456',
  title: 'Updated Title',
  content: '<p>Updated content.</p>'
});

// Parse JSON string result
const updatedPageData = JSON.parse(updatedPageResult);
console.log(`Updated page to version ${updatedPageData.page.version}`);

// Archive a page (move to trash)
const archivedPageResult = await archiveConfluencePage.invoke({
  page_id: '123456'
});

// Parse JSON string result
const archivedPageData = JSON.parse(archivedPageResult);
console.log(`Archived page: ${archivedPageData.page.title}`);

// Custom configuration with factory function
const customConfluenceTools = createConfluenceTools({
  apiKey: 'your-custom-api-key',
  email: 'custom@example.com',
  siteUrl: 'https://custom.atlassian.net'
});

// Use custom tools (returns object with named properties, not array)
const customResult = await customConfluenceTools.searchConfluence.invoke({
  query: 'search query',
  limit: 10
});

// Parse JSON string result
const customData = JSON.parse(customResult);
console.log(`Found ${customData.count} results`);
```

**Features:**
- Search pages across all Confluence spaces
- Retrieve full page content with metadata
- List all available spaces in your Confluence instance
- Get all pages within a specific space
- Create new pages with optional parent pages (hierarchical structure)
- Update existing page content and metadata
- Archive pages (move to trash)
- Configurable via environment variables or programmatic configuration
- Full TypeScript support with Zod validation
- Structured logging with `[[tools:confluence]]` prefix for debugging

**Environment Setup:**
```bash
# Add to your .env file
ATLASSIAN_API_KEY=your-atlassian-api-key-here
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_SITE_URL=https://your-site.atlassian.net
```

**Getting Confluence API Credentials:**
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive label (e.g., "AgentForge Integration")
4. Copy the generated API token
5. Use your Atlassian account email and the API token for authentication
6. Your site URL is your Confluence instance URL (e.g., `https://yourcompany.atlassian.net`)

**Programmatic Configuration:**
```typescript
// Override environment variables with custom configuration
const confluenceTools = createConfluenceTools({
  apiKey: 'your-custom-api-key',
  email: 'custom@example.com',
  siteUrl: 'https://custom.atlassian.net'
});

// Use the custom tools (returns object with named properties)
const { searchConfluence, getConfluencePage, listConfluenceSpaces, getSpacePages, createConfluencePage, updateConfluencePage, archiveConfluencePage } = confluenceTools;
```

**Content Format:**
Confluence uses "storage format" (a subset of HTML) for page content. Common elements:
```html
<p>Paragraph text</p>
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<ul><li>Bullet point</li></ul>
<ol><li>Numbered list</li></ol>
<ac:structured-macro ac:name="code">
  <ac:plain-text-body><![CDATA[code block]]></ac:plain-text-body>
</ac:structured-macro>
```

## Data Tools (31)

### JSON Processing

```typescript
import { 
  jsonParser, 
  jsonStringify, 
  jsonQuery,
  jsonValidator,
  jsonMerge 
} from '@agentforge/tools';

// Parse JSON
const parseResult = await jsonParser.invoke({
  json: '{"name": "John"}'
});
if (parseResult.success) {
  console.log(parseResult.data?.data); // { name: 'John' }
  console.log(parseResult.data?.type); // 'object'
}

// Stringify
const stringifyResult = await jsonStringify.invoke({
  data: { name: 'John' },
  pretty: true
});
if (stringifyResult.success) {
  console.log(stringifyResult.data?.json); // '{\n  "name": "John"\n}'
  console.log(stringifyResult.data?.length); // 24
}

// Query JSON (dot notation)
const queryResult = await jsonQuery.invoke({
  data: { users: [{ name: 'John' }] },
  path: 'users[0].name'
});
if (queryResult.success) {
  console.log(queryResult.data?.value); // 'John'
  console.log(queryResult.data?.type); // 'string'
}

// Validate JSON
const validationResult = await jsonValidator.invoke({
  json: '{"name": "John"}',
  schema: { type: 'object' }
});
if (validationResult.success) {
  console.log(validationResult.data?.valid); // true
  console.log(validationResult.data?.message); // 'Valid JSON'
}

// Merge JSON objects (uses .implement, returns raw value)
const merged = await jsonMerge.invoke({
  objects: [{ a: 1 }, { b: 2 }]
});
console.log(merged); // { a: 1, b: 2 }
```

### CSV Processing

```typescript
import { csvParser, csvGenerator, csvToJson, jsonToCsv } from '@agentforge/tools';

// Parse CSV
const parseResult = await csvParser.invoke({
  csv: 'name,age\nJohn,30',
  delimiter: ','
});
if (parseResult.success) {
  console.log(parseResult.data); // [{ name: 'John', age: '30' }]
  console.log(parseResult.rowCount); // 1
  console.log(parseResult.columnCount); // 2
}

// Generate CSV
const generateResult = await csvGenerator.invoke({
  data: [{ name: 'John', age: 30 }]
});
if (generateResult.success) {
  console.log(generateResult.csv); // 'name,age\nJohn,30\n'
  console.log(generateResult.rowCount); // 1
}

// Convert CSV to JSON
const csvToJsonResult = await csvToJson.invoke({
  csv: 'name,age\nJohn,30'
});
if (csvToJsonResult.success) {
  console.log(csvToJsonResult.json); // '[{"name":"John","age":"30"}]'
  console.log(csvToJsonResult.recordCount); // 1
}

// Convert JSON to CSV
const jsonToCsvResult = await jsonToCsv.invoke({
  json: '[{"name":"John","age":30}]'
});
if (jsonToCsvResult.success) {
  console.log(jsonToCsvResult.csv); // 'name,age\nJohn,30\n'
  console.log(jsonToCsvResult.rowCount); // 1
}
```

### XML Processing

```typescript
import { xmlParser, xmlGenerator, xmlToJson, jsonToXml } from '@agentforge/tools';

// Parse XML
const parseResult = await xmlParser.invoke({
  xml: '<root><name>John</name></root>'
});
if (parseResult.success) {
  console.log(parseResult.data); // { root: { name: 'John' } }
}

// Generate XML
const generateResult = await xmlGenerator.invoke({
  data: { root: { name: 'John' } }
});
if (generateResult.success) {
  console.log(generateResult.xml); // '<root><name>John</name></root>'
}

// Convert XML to JSON
const xmlToJsonResult = await xmlToJson.invoke({
  xml: '<root><name>John</name></root>',
  pretty: true
});
if (xmlToJsonResult.success) {
  console.log(xmlToJsonResult.json); // '{\n  "root": {\n    "name": "John"\n  }\n}'
}

// Convert JSON to XML
const jsonToXmlResult = await jsonToXml.invoke({
  json: '{"name":"John"}',
  rootName: 'person',
  format: true
});
if (jsonToXmlResult.success) {
  console.log(jsonToXmlResult.xml); // '<person>\n  <name>John</name>\n</person>'
}
```

### Data Transformation

```typescript
import { 
  arrayFilter, 
  arrayMap, 
  arraySort,
  arrayGroupBy,
  objectPick,
  objectOmit 
} from '@agentforge/tools';

// Filter array
const filterResult = await arrayFilter.invoke({
  array: [{ age: 25 }, { age: 30 }, { age: 35 }],
  property: 'age',
  operator: 'greater-than',
  value: 28
});
console.log(filterResult.filtered); // [{ age: 30 }, { age: 35 }]
console.log(filterResult.filteredCount); // 2

// Map array (extract properties)
const mapResult = await arrayMap.invoke({
  array: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
  properties: ['name']
});
console.log(mapResult.mapped); // [{ name: 'John' }, { name: 'Jane' }]
console.log(mapResult.count); // 2

// Sort array
const sortResult = await arraySort.invoke({
  array: [{ score: 3 }, { score: 1 }, { score: 2 }],
  property: 'score',
  order: 'asc'
});
console.log(sortResult.sorted); // [{ score: 1 }, { score: 2 }, { score: 3 }]
console.log(sortResult.count); // 3

// Group by
const groupResult = await arrayGroupBy.invoke({
  array: [{ type: 'a', val: 1 }, { type: 'a', val: 2 }, { type: 'b', val: 3 }],
  property: 'type'
});
console.log(groupResult.groups); // { a: [{ type: 'a', val: 1 }, { type: 'a', val: 2 }], b: [{ type: 'b', val: 3 }] }
console.log(groupResult.groupCount); // 2
console.log(groupResult.totalItems); // 3
```

### Neo4j Graph Database (7 tools)

Production-ready Neo4j integration with support for knowledge graphs, GraphRAG, and vector search.

#### Quick Start

```bash
# Install Neo4j driver (peer dependency)
pnpm add neo4j-driver

# Set environment variables
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# For embedding-enabled tools (optional)
EMBEDDING_PROVIDER=openai  # Options: openai, cohere, huggingface, voyage, ollama
OPENAI_API_KEY=sk-...      # Or appropriate key for your provider
```

#### Initialize Connection

```typescript
import { initializeNeo4jTools } from '@agentforge/tools';

// Initialize from environment variables
await initializeNeo4jTools();

// Or with custom config
import { neo4jPool } from '@agentforge/tools';
await neo4jPool.initialize({
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'your-password',
  database: 'neo4j',
});
```

#### 1. neo4jQuery - Execute Cypher Queries

```typescript
import { neo4jQuery } from '@agentforge/tools';

// Create nodes and relationships
const result = await neo4jQuery.execute({
  cypher: `
    CREATE (p:Person {name: $name, age: $age})
    RETURN p
  `,
  parameters: { name: 'Alice', age: 30 }
});

console.log('Records:', result.data);
console.log('Summary:', result.summary);
```

#### 2. neo4jGetSchema - Inspect Graph Schema

```typescript
import { neo4jGetSchema } from '@agentforge/tools';

const schema = await neo4jGetSchema.execute({});

console.log('Node labels:', schema.schema.nodeLabels);
console.log('Relationship types:', schema.schema.relationshipTypes);
console.log('Property keys:', schema.schema.propertyKeys);
console.log('Indexes:', schema.schema.indexes);
console.log('Constraints:', schema.schema.constraints);
```

#### 3. neo4jFindNodes - Find Nodes by Label/Properties

```typescript
import { neo4jFindNodes } from '@agentforge/tools';

// Find all persons
const persons = await neo4jFindNodes.execute({
  label: 'Person',
  limit: 10
});

// Find with property filters
const adults = await neo4jFindNodes.execute({
  label: 'Person',
  properties: { age: 30 },
  limit: 5
});

console.log(`Found ${adults.count} nodes`);
adults.nodes.forEach(node => {
  console.log(node.properties);
});
```

#### 4. neo4jTraverse - Graph Traversal

```typescript
import { neo4jTraverse } from '@agentforge/tools';

// Traverse from a starting node
const result = await neo4jTraverse.execute({
  startNodeId: 123,
  relationshipType: 'KNOWS',  // Single relationship type (optional)
  direction: 'outgoing',       // lowercase: 'outgoing', 'incoming', or 'both'
  maxDepth: 2,
  limit: 20
});

console.log(`Found ${result.count} paths`);
result.paths.forEach(path => {
  console.log('Start node:', path.start);
  console.log('End node:', path.end);
  console.log('Relationships:', path.relationships);
  console.log('Depth:', path.depth);
});
```

#### 5. neo4jVectorSearch - Semantic Search

```typescript
import { neo4jVectorSearch } from '@agentforge/tools';

// Search with pre-computed embedding
const embedding = [0.1, 0.2, 0.3, /* ... 1536 dimensions */];

const results = await neo4jVectorSearch.execute({
  indexName: 'document_embeddings',
  queryVector: embedding,
  limit: 5
});

console.log(`Found ${results.count} similar nodes`);
results.results.forEach(item => {
  console.log(`Score: ${item.score}`);
  console.log('Node:', item.node.properties);
});
```

#### 6. neo4jVectorSearchWithEmbedding - Semantic Search (Auto-Embedding)

```typescript
import { neo4jVectorSearchWithEmbedding } from '@agentforge/tools';

// Search with plain text - embedding generated automatically!
const results = await neo4jVectorSearchWithEmbedding.execute({
  indexName: 'document_embeddings',
  queryText: 'How do graph databases work?',
  limit: 5
});

console.log('Query:', results.query.text);
console.log('Embedding model:', results.embedding.model);
console.log('Embedding dimensions:', results.embedding.dimensions);

results.results.forEach(item => {
  console.log(`${item.node.properties.title} (score: ${item.score})`);
});
```

#### 7. neo4jCreateNodeWithEmbedding - Create Nodes with Auto-Embedding

```typescript
import { neo4jCreateNodeWithEmbedding } from '@agentforge/tools';

// Create node with automatic embedding generation
const result = await neo4jCreateNodeWithEmbedding.execute({
  label: 'Document',
  properties: {
    title: 'Introduction to Neo4j',
    content: 'Neo4j is a powerful graph database...',
    category: 'database'
  },
  textProperty: 'content',        // Property to generate embedding from
  embeddingProperty: 'embedding'  // Where to store the embedding
});

console.log('Node created:', result.nodeId);
console.log('Embedding dimensions:', result.embedding.dimensions);
console.log('Model used:', result.embedding.model);
```

#### Embedding Providers

AgentForge supports **5 embedding providers** for maximum flexibility:

| Provider | Best For | Dimensions | Cost | Setup |
|----------|----------|------------|------|-------|
| **OpenAI** | Production, quality | 1536-3072 | Low | `OPENAI_API_KEY` |
| **Cohere** | Multilingual | 384-1024 | Medium | `COHERE_API_KEY` |
| **HuggingFace** | Open-source | 384-1024 | Low-Free | `HUGGINGFACE_API_KEY` |
| **Voyage** | Domain-specific | 1024-1536 | Medium | `VOYAGE_API_KEY` |
| **Ollama** | Privacy, offline | 384-1024 | Free | Local (no key) |

**Switch providers easily:**

```bash
# OpenAI (default)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Cohere
EMBEDDING_PROVIDER=cohere
COHERE_API_KEY=...

# HuggingFace
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=...

# Voyage AI
EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=...

# Ollama (local, no API key!)
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434  # Optional
```

**Ollama Setup (Privacy-Focused):**

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull an embedding model
ollama pull nomic-embed-text

# Start Ollama
ollama serve

# Use in AgentForge (no API key needed!)
EMBEDDING_PROVIDER=ollama
```

#### GraphRAG Example

Complete GraphRAG implementation with automatic embeddings:

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
  `
});

// 2. Add documents with automatic embeddings
const documents = [
  {
    title: 'Neo4j Guide',
    content: 'Neo4j is a graph database that stores data as nodes and relationships.'
  },
  {
    title: 'GraphRAG Overview',
    content: 'GraphRAG combines graph databases with retrieval-augmented generation.'
  },
  {
    title: 'Vector Search',
    content: 'Vector search enables semantic similarity matching using embeddings.'
  }
];

for (const doc of documents) {
  await neo4jCreateNodeWithEmbedding.execute({
    label: 'Document',
    properties: doc,
    textProperty: 'content',
    embeddingProperty: 'embedding'
  });
}

// 3. Query using semantic search
const results = await neo4jVectorSearchWithEmbedding.execute({
  indexName: 'document_embeddings',
  queryText: 'What is GraphRAG?',
  limit: 3
});

console.log(`Found ${results.count} relevant documents:`);
results.results.forEach(item => {
  console.log(`- ${item.node.properties.title} (score: ${item.score})`);
});
```

**Key Benefits:**
- ✅ No manual embedding generation
- ✅ Provider-agnostic (switch with env vars)
- ✅ Automatic dimension handling
- ✅ Built-in retry logic
- ✅ Production-ready error handling

### Relational Database Tools (6)

Vendor-agnostic tools for PostgreSQL, MySQL, and SQLite. See the [Database Tools Guide](/guide/concepts/database) for concepts and the [Database Agent Tutorial](/tutorials/database-agent) for a walkthrough.

**Installation:**
```bash
pnpm add @agentforge/tools pg        # PostgreSQL
pnpm add @agentforge/tools mysql2    # MySQL
pnpm add @agentforge/tools better-sqlite3  # SQLite
```

::: info Return Pattern
All relational tools return `{ success: true, ... }` on success or `{ success: false, error: string }` on failure. They **never throw**.
:::

#### relationalQuery

Execute raw SQL with parameterized binding:

```typescript
import { relationalQuery } from '@agentforge/tools';

const result = await relationalQuery.invoke({
  sql: 'SELECT id, email FROM users WHERE status = $1 LIMIT 10',
  params: ['active'],
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});

// Success: { success: true, rows: [...], rowCount: 10, executionTime: 12 }
// Error:   { success: false, error: '...', rows: [], rowCount: 0 }
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sql` | `string` | Yes | SQL query with placeholders (`$1` for PG, `?` for MySQL/SQLite) |
| `params` | `unknown[] \| Record<string, unknown>` | No | Positional or named parameters |
| `vendor` | `'postgresql' \| 'mysql' \| 'sqlite'` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Database connection string |

#### relationalSelect

Type-safe SELECT without writing SQL:

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  table: 'orders',
  columns: ['id', 'total', 'status'],
  where: [
    { column: 'status', operator: 'eq', value: 'pending' },
    { column: 'total', operator: 'gt', value: 100 },
  ],
  orderBy: [{ column: 'total', direction: 'desc' }],
  limit: 10,
  offset: 0,
  vendor: 'postgresql',
  connectionString: DB_URL,
});

// Success: { success: true, rows: [...], rowCount: 10, executionTime: 8 }
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name (e.g. `users` or `public.users`) |
| `columns` | `string[]` | No | Column filter (omit for `SELECT *`) |
| `where` | `WhereCondition[]` | No | WHERE conditions (combined with AND) |
| `orderBy` | `OrderBy[]` | No | ORDER BY clauses |
| `limit` | `number` | No | Max rows to return |
| `offset` | `number` | No | Rows to skip |
| `streaming` | `StreamingOptions` | No | Chunked streaming mode |
| `vendor` | `string` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Connection string |

**WhereCondition:**
```typescript
{ column: string, operator: Operator, value?: ScalarValue }
```
Operators: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `like`, `in`, `notIn`, `isNull`, `isNotNull`

**StreamingOptions:**
| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable chunked streaming |
| `chunkSize` | `number` | `100` | Rows per chunk (1–5000) |
| `maxRows` | `number` | — | Cap on total streamed rows |
| `sampleSize` | `number` | `50` | Rows included in response payload (0–5000) |
| `benchmark` | `boolean` | `false` | Memory benchmark mode |

#### relationalInsert

Insert single rows or batch arrays:

```typescript
import { relationalInsert } from '@agentforge/tools';

// Single row with RETURNING
const result = await relationalInsert.invoke({
  table: 'users',
  data: { email: 'alice@example.com', name: 'Alice' },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// { success: true, rowCount: 1, insertedIds: [42], rows: [], executionTime: 5 }

// Batch insert
const batch = await relationalInsert.invoke({
  table: 'events',
  data: events, // Array of records
  batch: { batchSize: 200, continueOnError: true },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// { success: true, rowCount: 1000, batch: { successfulItems: 1000, ... } }
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name |
| `data` | `Record \| Record[]` | Yes | Row(s) to insert |
| `returning` | `{ mode, idColumn? }` | No | Return mode: `'none'` (default), `'id'`, `'row'` |
| `batch` | `BatchOptions` | No | Batch execution controls |
| `vendor` | `string` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Connection string |

**BatchOptions** (shared by Insert, Update, Delete):
| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable batched processing |
| `batchSize` | `number` | `100` | Items per chunk (1–5000) |
| `continueOnError` | `boolean` | `true` | Continue on chunk failure |
| `maxRetries` | `number` | `0` | Retries per failed chunk (0–5) |
| `retryDelayMs` | `number` | `0` | Delay between retries in ms (0–60000) |
| `benchmark` | `boolean` | `false` | Synthetic benchmark mode |

#### relationalUpdate

Conditional updates with safety guards:

```typescript
import { relationalUpdate } from '@agentforge/tools';

// Single update
const result = await relationalUpdate.invoke({
  table: 'users',
  data: { status: 'verified' },
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// { success: true, rowCount: 1, executionTime: 3 }

// Batch update (multiple independent operations)
const batch = await relationalUpdate.invoke({
  table: 'products',
  operations: [
    { data: { price: 9.99 }, where: [{ column: 'id', operator: 'eq', value: 1 }] },
    { data: { price: 19.99 }, where: [{ column: 'id', operator: 'eq', value: 2 }] },
  ],
  batch: { batchSize: 50 },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name |
| `data` | `Record` | Conditional | Column-value pairs (single mode) |
| `where` | `WhereCondition[]` | Conditional | Required unless `allowFullTableUpdate: true` |
| `allowFullTableUpdate` | `boolean` | No | Explicit opt-in for no-WHERE update |
| `optimisticLock` | `{ column, expectedValue }` | No | Optimistic locking condition |
| `operations` | `UpdateOperation[]` | Conditional | Batch mode (mutually exclusive with `data`) |
| `batch` | `BatchOptions` | No | Batch execution controls |

#### relationalDelete

Safe deletion with WHERE requirement:

```typescript
import { relationalDelete } from '@agentforge/tools';

// Hard delete
const result = await relationalDelete.invoke({
  table: 'sessions',
  where: [{ column: 'expires_at', operator: 'lt', value: '2026-01-01' }],
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// { success: true, rowCount: 150, softDeleted: false, executionTime: 12 }

// Soft delete
const soft = await relationalDelete.invoke({
  table: 'users',
  where: [{ column: 'id', operator: 'eq', value: 42 }],
  softDelete: { column: 'deleted_at' },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// { success: true, rowCount: 1, softDeleted: true }
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name |
| `where` | `WhereCondition[]` | Conditional | Required unless `allowFullTableDelete: true` |
| `allowFullTableDelete` | `boolean` | No | Explicit opt-in for full-table delete |
| `cascade` | `boolean` | No | Cascade-aware error messaging |
| `softDelete` | `{ column?, value? }` | No | Soft-delete mode (`column` defaults to `'deleted_at'`) |
| `operations` | `DeleteOperation[]` | Conditional | Batch delete operations |
| `batch` | `BatchOptions` | No | Batch execution controls |

#### relationalGetSchema

Introspect tables, columns, keys, and indexes:

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const result = await relationalGetSchema.invoke({
  vendor: 'postgresql',
  connectionString: DB_URL,
  tables: ['users', 'orders'],
  cacheTtlMs: 300000,
});

// Success response:
// {
//   success: true,
//   schema: {
//     vendor: 'postgresql',
//     tables: [
//       {
//         name: 'users',
//         schema: 'public',
//         columns: [
//           { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true, defaultValue: null },
//           { name: 'email', type: 'varchar(255)', isNullable: false, isPrimaryKey: false, defaultValue: null },
//         ],
//         primaryKey: ['id'],
//         foreignKeys: [],
//         indexes: [{ name: 'users_pkey', columns: ['id'], isUnique: true }],
//       },
//     ],
//     generatedAt: '2026-02-21T...',
//   },
//   summary: { tableCount: 2, columnCount: 8, foreignKeyCount: 1, indexCount: 3 },
// }
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor` | `string` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Connection string |
| `database` | `string` | No | Database name for cache scoping |
| `tables` | `string[]` | No | Filter to specific tables |
| `cacheTtlMs` | `number` | No | Cache TTL in ms (0 disables) |
| `refreshCache` | `boolean` | No | Force cache invalidation |

#### ConnectionManager

The `ConnectionManager` class handles connection lifecycle, pooling, and reconnection.

```typescript
import { ConnectionManager } from '@agentforge/tools';

const manager = new ConnectionManager(
  {
    vendor: 'postgresql',
    connection: {
      connectionString: 'postgresql://user:pass@localhost:5432/mydb',
      pool: { max: 20, acquireTimeoutMillis: 5000, idleTimeoutMillis: 30000 },
    },
  },
  { enabled: true, maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 30000 },
);
```

**Methods:**
| Method | Returns | Description |
|---|---|---|
| `connect()` | `Promise<void>` | Connect to the database (idempotent) |
| `disconnect()` | `Promise<void>` | Close connection and cancel reconnection |
| `dispose()` | `Promise<void>` | Disconnect and remove all event listeners |
| `isConnected()` | `boolean` | Check connection status |
| `getState()` | `ConnectionState` | Get current state (`'disconnected'`, `'connecting'`, `'connected'`, `'reconnecting'`, `'error'`) |
| `getVendor()` | `DatabaseVendor` | Get configured vendor |
| `getPoolMetrics()` | `PoolMetrics` | Pool stats: `totalCount`, `activeCount`, `idleCount`, `waitingCount` |
| `isHealthy()` | `Promise<boolean>` | Health check (`SELECT 1`) |

**Events:**
| Event | Payload | Description |
|---|---|---|
| `'connected'` | — | Connection established |
| `'disconnected'` | — | Connection closed |
| `'error'` | `Error` | Connection error |
| `'reconnecting'` | `{ attempt, maxAttempts, delayMs }` | Reconnection attempt scheduled |

#### withTransaction

ACID transactions with isolation levels and timeout:

```typescript
import { withTransaction, ConnectionManager } from '@agentforge/tools';

const result = await withTransaction(manager, async (tx) => {
  await tx.execute(sql`UPDATE accounts SET balance = balance - 100 WHERE id = 1`);
  await tx.execute(sql`UPDATE accounts SET balance = balance + 100 WHERE id = 2`);
  return { transferred: true };
}, {
  isolationLevel: 'serializable',
  timeoutMs: 5000,
});
```

| Option | Type | Description |
|---|---|---|
| `isolationLevel` | `'read uncommitted' \| 'read committed' \| 'repeatable read' \| 'serializable'` | Transaction isolation level |
| `timeoutMs` | `number` | Max transaction duration before auto-rollback |

The `TransactionContext` (`tx`) provides: `execute()`, `isActive()`, `commit()`, `rollback()`, `createSavepoint()`, `rollbackToSavepoint()`, `releaseSavepoint()`, `withSavepoint()`.

## File Tools (18)

### File Operations

```typescript
import { 
  fileReader, 
  fileWriter, 
  fileAppend,
  fileDelete,
  fileExists 
} from '@agentforge/tools';

// Read file
const readResult = await fileReader.invoke({
  path: '/path/to/file.txt',
  encoding: 'utf-8'
});
if (readResult.success) {
  console.log(readResult.data?.content); // File contents
  console.log(readResult.data?.size); // File size in bytes
  console.log(readResult.data?.path); // '/path/to/file.txt'
  console.log(readResult.data?.encoding); // 'utf-8'
}

// Write file
await fileWriter.invoke({
  path: '/path/to/file.txt',
  content: 'Hello World'
});

// Append to file
await fileAppend.invoke({
  path: '/path/to/file.txt',
  content: '\nNew line'
});

// Delete file
await fileDelete.invoke({
  path: '/path/to/file.txt'
});

// Check if file exists
const exists = await fileExists.invoke({
  path: '/path/to/file.txt'
});
```

### Directory Operations

```typescript
import { 
  directoryList, 
  directoryCreate,
  directoryDelete,
  fileSearch 
} from '@agentforge/tools';

// List directory
const listResult = await directoryList.invoke({
  path: '/path/to/dir',
  recursive: true
});
if (listResult.success) {
  console.log(listResult.data?.files); // Array of file objects
  console.log(listResult.data?.count); // Number of files
  console.log(listResult.data?.path); // '/path/to/dir'
}

// Create directory
await directoryCreate.invoke({
  path: '/path/to/new/dir'
});

// Search files
const searchResult = await fileSearch.invoke({
  directory: '/path/to/dir',
  pattern: '*.ts',
  recursive: true
});
if (searchResult.success) {
  console.log(searchResult.data?.matches); // Array of matching file paths
  console.log(searchResult.data?.count); // Number of matches
  console.log(searchResult.data?.directory); // '/path/to/dir'
  console.log(searchResult.data?.pattern); // '*.ts'
}
```

## Utility Tools (22)

### Date/Time

```typescript
import { dateFormatter, currentDateTime, dateArithmetic, dateDifference } from '@agentforge/tools';
```

### String Utilities

```typescript
import {
  stringCaseConverter,
  stringTrim,
  stringReplace,
  stringSplit,
  stringJoin,
  stringSubstring,
  stringLength
} from '@agentforge/tools';
```

### Math Operations

```typescript
import {
  calculator,
  mathFunctions,  // Includes round, abs, floor, ceil, etc.
  randomNumber,
  statistics
} from '@agentforge/tools';
```

### Validation

```typescript
import {
  emailValidator,
  urlValidatorSimple,
  phoneValidator,
  creditCardValidator,
  ipValidator,
  uuidValidator
} from '@agentforge/tools';
```

## Agent Tools (1)

### Ask Human

```typescript
import { createAskHumanTool } from '@agentforge/tools';

// Create the tool
const askHuman = createAskHumanTool();

// Use in your agent
const tools = [askHuman, ...otherTools];

// The agent can call this tool to request human input
// Execution pauses until a human responds
```

**Features:**
- Human-in-the-loop workflows
- Priority levels (low, normal, high, critical)
- Timeout handling with default responses
- Suggested responses for UI
- LangGraph interrupt integration

**Note:** Requires `@langchain/langgraph` to be installed.

## Complete Tool List

See the [Tools README](https://github.com/TVScoundrel/agentforge/tree/main/packages/tools) for the complete list of all 88 tools with detailed documentation.

