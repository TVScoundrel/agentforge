# @agentforge/tools

Standard tools library with 81 production-ready tools.

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

## Data Tools (18)

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

See the [Tools README](https://github.com/TVScoundrel/agentforge/tree/main/packages/tools) for the complete list of all 70 tools with detailed documentation.

