# @agentforge/tools

> Production-ready tools collection for AgentForge - 81 tools for web, data, file, utility, and agent operations

[![npm version](https://img.shields.io/npm/v/@agentforge/tools)](https://www.npmjs.com/package/@agentforge/tools)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## 🎉 Status: Production Ready & Published

**81 production-ready tools** | **Full TypeScript support** | **Comprehensive documentation** | **LangChain compatible**

## 📦 Installation

```bash
npm install @agentforge/tools
# or
pnpm add @agentforge/tools
# or
yarn add @agentforge/tools
```

## 🎯 Overview

This package provides **81 ready-to-use tools** organized into 5 categories:

- **🌐 Web Tools** (22 tools) - HTTP requests, web search, web scraping, HTML parsing, URL manipulation, Slack integration, Confluence integration
- **📊 Data Tools** (18 tools) - JSON, CSV, XML processing and data transformation
- **📁 File Tools** (18 tools) - File operations, directory management, path utilities
- **🔧 Utility Tools** (22 tools) - Date/time, strings, math, validation
- **🤖 Agent Tools** (1 tool) - Human-in-the-loop and agent interaction

All tools feature:
- ✅ Full TypeScript support with type inference
- ✅ Zod schema validation
- ✅ Comprehensive error handling
- ✅ Detailed documentation and examples
- ✅ LangChain compatibility
- ✅ Production-tested and ready

## 🚀 Quick Start

```typescript
import { httpGet, jsonParser, fileReader, calculator } from '@agentforge/tools';

// Make an HTTP GET request
const response = await httpGet.execute({
  url: 'https://api.example.com/data'
});

// Parse JSON
const parsed = await jsonParser.execute({
  json: '{"name": "John", "age": 30}'
});

// Read a file
const file = await fileReader.execute({
  path: './data.txt',
  encoding: 'utf8'
});

// Perform calculations
const result = await calculator.execute({
  operation: 'add',
  a: 10,
  b: 20
});
```

## 📚 Tool Categories

### 🌐 Web Tools (22 tools)

Tools for web interactions, HTTP operations, and integrations.

#### Web Search
- **`webSearch`** - Search the web using DuckDuckGo (free) or Serper API (optional premium)
  - No API key required for basic searches (uses DuckDuckGo)
  - Optional Serper API for premium Google search results
  - Smart fallback: automatically switches providers when needed
  - Returns structured results with titles, links, and snippets

#### HTTP Client Tools
- **`httpClient`** - Full-featured HTTP client with all methods (GET, POST, PUT, DELETE, PATCH)
- **`httpGet`** - Simple GET requests
- **`httpPost`** - Simple POST requests with JSON body

#### Web Scraping Tools
- **`webScraper`** - Extract data from web pages using CSS selectors
- **`htmlParser`** - Parse HTML and extract elements
- **`extractLinks`** - Extract all links from HTML
- **`extractImages`** - Extract all images from HTML

#### URL Tools
- **`urlValidator`** - Validate and parse URLs
- **`urlBuilder`** - Build URLs from components
- **`urlQueryParser`** - Parse query parameters

#### Slack Tools
- **`sendSlackMessage`** - Send messages to Slack channels
- **`notifySlack`** - Send notifications with @mentions
- **`getSlackChannels`** - List available Slack channels
- **`getSlackMessages`** - Read message history from channels
- **`createSlackTools()`** - Factory function for custom Slack configuration

#### Confluence Tools
- **`searchConfluence`** - Search Confluence using CQL (Confluence Query Language)
- **`getConfluencePage`** - Get full page content by ID
- **`listConfluenceSpaces`** - List all available Confluence spaces
- **`getSpacePages`** - Get all pages from a specific space
- **`createConfluencePage`** - Create new Confluence pages
- **`updateConfluencePage`** - Update existing Confluence pages
- **`archiveConfluencePage`** - Archive pages (move to trash)
- **`createConfluenceTools()`** - Factory function for custom Confluence configuration

### 📊 Data Tools (18 tools)

Tools for data processing and transformation.

#### JSON Tools
- **`jsonParser`** - Parse JSON strings
- **`jsonStringify`** - Convert objects to JSON
- **`jsonQuery`** - Query JSON using dot notation
- **`jsonValidator`** - Validate JSON syntax
- **`jsonMerge`** - Merge multiple JSON objects

#### CSV Tools
- **`csvParser`** - Parse CSV to objects
- **`csvGenerator`** - Generate CSV from objects
- **`csvToJson`** - Convert CSV to JSON
- **`jsonToCsv`** - Convert JSON to CSV

#### XML Tools
- **`xmlParser`** - Parse XML to objects
- **`xmlGenerator`** - Generate XML from objects
- **`xmlToJson`** - Convert XML to JSON
- **`jsonToXml`** - Convert JSON to XML

#### Data Transformation Tools
- **`arrayFilter`** - Filter arrays by property values
- **`arrayMap`** - Extract properties from array objects
- **`arraySort`** - Sort arrays by property
- **`arrayGroupBy`** - Group arrays by property
- **`objectPick`** - Pick specific properties from objects
- **`objectOmit`** - Omit specific properties from objects

### 📁 File Tools (18 tools)

Tools for file system operations.

#### File Operations
- **`fileReader`** - Read file contents
- **`fileWriter`** - Write content to files
- **`fileAppend`** - Append content to files
- **`fileDelete`** - Delete files
- **`fileExists`** - Check if file/directory exists

#### Directory Operations
- **`directoryList`** - List directory contents
- **`directoryCreate`** - Create directories
- **`directoryDelete`** - Delete directories
- **`fileSearch`** - Search for files by pattern

#### Path Utilities
- **`pathJoin`** - Join path segments
- **`pathResolve`** - Resolve absolute paths
- **`pathParse`** - Parse path components
- **`pathBasename`** - Get filename from path
- **`pathDirname`** - Get directory from path
- **`pathExtension`** - Get file extension
- **`pathRelative`** - Get relative path
- **`pathNormalize`** - Normalize paths

### 🔧 Utility Tools (22 tools)

General utility tools for common operations.

#### Date/Time Tools
- **`currentDateTime`** - Get current date/time
- **`dateFormatter`** - Format dates
- **`dateArithmetic`** - Add/subtract time
- **`dateDifference`** - Calculate date differences
- **`dateComparison`** - Compare dates

#### String Tools
- **`stringCaseConverter`** - Convert string cases
- **`stringTrim`** - Trim whitespace
- **`stringReplace`** - Replace substrings
- **`stringSplit`** - Split strings
- **`stringJoin`** - Join string arrays
- **`stringSubstring`** - Extract substrings
- **`stringLength`** - Get string length/word count

#### Math Tools
- **`calculator`** - Basic arithmetic operations
- **`mathFunctions`** - Mathematical functions (sqrt, sin, cos, etc.)
- **`randomNumber`** - Generate random numbers
- **`statistics`** - Calculate statistics (avg, median, stddev)

#### Validation Tools
- **`emailValidator`** - Validate email addresses
- **`urlValidatorSimple`** - Validate URLs
- **`phoneValidator`** - Validate phone numbers
- **`creditCardValidator`** - Validate credit cards (Luhn algorithm)
- **`ipValidator`** - Validate IPv4/IPv6 addresses
- **`uuidValidator`** - Validate UUIDs

## 💡 Usage Examples

### Web Search Example

```typescript
import { webSearch } from '@agentforge/tools';

// Basic search (no API key needed - uses DuckDuckGo)
const result = await webSearch.execute({
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
const premiumResult = await webSearch.execute({
  query: 'Latest AI developments 2026',
  maxResults: 5,
  preferSerper: true  // Use Serper for Google search results
});

// Check metadata
console.log(`Source: ${premiumResult.source}`);
console.log(`Fallback used: ${premiumResult.metadata?.fallbackUsed}`);
console.log(`Response time: ${premiumResult.metadata?.responseTime}ms`);
```

**Environment Setup:**
```bash
# Optional: Add to your .env file for premium Google search
SERPER_API_KEY=your-serper-api-key-here
```

**Input Schema:**
```typescript
{
  query: string;           // Search query (required)
  maxResults?: number;     // Max results to return (default: 10)
  preferSerper?: boolean;  // Prefer Serper over DuckDuckGo (default: false)
}
```

**Output Schema:**
```typescript
{
  results: Array<{
    title: string;      // Result title
    link: string;       // Result URL
    snippet: string;    // Result description/snippet
    position: number;   // Result position (1-based)
  }>;
  source: 'duckduckgo' | 'serper';  // Which provider was used
  metadata?: {
    fallbackUsed: boolean;    // Whether fallback to DuckDuckGo occurred
    responseTime: number;     // Response time in milliseconds
  };
}
```

**DuckDuckGo vs Serper:**

| Feature | DuckDuckGo (Free) | Serper (Premium) |
|---------|-------------------|------------------|
| **API Key** | ❌ Not required | ✅ Required ([get key](https://serper.dev)) |
| **Cost** | 🆓 Free | 💰 Paid (see [pricing](https://serper.dev/pricing)) |
| **Search Engine** | DuckDuckGo | Google |
| **Rate Limits** | Generous | Based on plan |
| **Result Quality** | Good | Excellent (Google results) |
| **Use Case** | Development, testing, low-volume | Production, high-quality results |
| **Fallback** | N/A | Auto-fallback to DuckDuckGo on error |

**When to use each:**
- **DuckDuckGo**: Default choice, no setup needed, great for development and testing
- **Serper**: Production use cases requiring Google-quality results, set `preferSerper: true`

### Web Scraping Example

```typescript
import { webScraper } from '@agentforge/tools';

const result = await webScraper.execute({
  url: 'https://example.com',
  selector: 'article h1',
  extractText: true,
  extractLinks: true,
  extractMetadata: true
});

console.log(result.text);
console.log(result.links);
console.log(result.metadata);
```

### Slack Integration Example

```typescript
import {
  sendSlackMessage,
  notifySlack,
  getSlackChannels,
  getSlackMessages,
  createSlackTools
} from '@agentforge/tools';

// Send a simple message
const message = await sendSlackMessage.execute({
  channel: 'general',
  message: 'Hello from AgentForge!'
});

// Send a notification with mentions
const notification = await notifySlack.execute({
  channel: 'alerts',
  message: 'System alert: High CPU usage detected',
  mentions: ['john', 'jane']  // Will send as: @john @jane System alert...
});

// List available channels
const channels = await getSlackChannels.execute({
  include_private: false  // Only public channels
});
console.log(channels.data?.channels);

// Read message history
const history = await getSlackMessages.execute({
  channel: 'general',
  limit: 50
});
console.log(`Found ${history.data?.count} messages`);

// Custom configuration (for multiple workspaces or custom bot settings)
const customTools = createSlackTools({
  token: 'xoxb-your-custom-token',
  botName: 'My Custom Bot',
  botIcon: ':rocket:'
});

await customTools.sendMessage.execute({
  channel: 'general',
  message: 'Message from custom bot!'
});
```

**Environment Setup:**
```bash
# Add to your .env file
SLACK_USER_TOKEN=xoxp-your-user-token
# OR
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

**Getting a Slack Token:**
1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app or select existing
3. Add OAuth scopes: `chat:write`, `channels:read`, `channels:history`
4. Install app to workspace
5. Copy the token (starts with `xoxb-` for bot or `xoxp-` for user)

### Confluence Integration Example

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

// Search for pages
const searchResults = await searchConfluence.execute({
  cql: 'type=page AND space=DOCS',
  limit: 10
});
console.log(`Found ${searchResults.results.length} pages`);

// Get a specific page
const page = await getConfluencePage.execute({
  page_id: '123456'
});
console.log(`Page title: ${page.page.title}`);
console.log(`Content: ${page.page.content}`);

// List all spaces
const spaces = await listConfluenceSpaces.execute({
  limit: 50
});
console.log(`Found ${spaces.spaces.length} spaces`);

// Get pages from a space
const spacePages = await getSpacePages.execute({
  space_key: 'DOCS',
  limit: 25
});
console.log(`Found ${spacePages.pages.length} pages in DOCS space`);

// Create a new page
const newPage = await createConfluencePage.execute({
  space_key: 'DOCS',
  title: 'My New Page',
  content: '<p>This is the page content in HTML format</p>',
  parent_page_id: '789012'  // Optional parent page
});
console.log(`Created page with ID: ${newPage.page.id}`);

// Update an existing page
const updated = await updateConfluencePage.execute({
  page_id: newPage.page.id,
  title: 'Updated Page Title',
  content: '<p>Updated content</p>'
});
console.log(`Updated to version ${updated.page.version}`);

// Archive a page
const archived = await archiveConfluencePage.execute({
  page_id: newPage.page.id,
  reason: 'No longer needed'
});
console.log(archived.archived.note);

// Custom configuration (for multiple Confluence instances)
const customTools = createConfluenceTools({
  apiKey: 'your-api-key',
  email: 'your-email@example.com',
  siteUrl: 'https://your-domain.atlassian.net'
});

await customTools.searchConfluence.execute({
  cql: 'type=page',
  limit: 5
});
```

**Environment Setup:**
```bash
# Add to your .env file
ATLASSIAN_API_KEY=your-api-key-here
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_SITE_URL=https://your-domain.atlassian.net
```

**Getting a Confluence API Key:**
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "AgentForge")
4. Copy the generated token
5. Use your Atlassian email and the API token for authentication

### Data Processing Example

```typescript
import { csvParser, arrayFilter, arraySort } from '@agentforge/tools';

// Parse CSV data
const parsed = await csvParser.execute({
  csv: 'name,age,city\nJohn,30,NYC\nJane,25,LA',
  hasHeaders: true
});

// Filter the data
const filtered = await arrayFilter.execute({
  array: parsed.data,
  property: 'age',
  operator: 'greater-than',
  value: 25
});

// Sort the results
const sorted = await arraySort.execute({
  array: filtered.filtered,
  property: 'age',
  order: 'desc'
});

console.log(sorted.sorted);
```

### File Operations Example

```typescript
import { fileReader, fileWriter, directoryList } from '@agentforge/tools';

// Read a file
const content = await fileReader.execute({
  path: './data.json',
  encoding: 'utf8'
});

// Process and write back
const processed = JSON.parse(content.content);
processed.updated = new Date().toISOString();

await fileWriter.execute({
  path: './data-updated.json',
  content: JSON.stringify(processed, null, 2),
  createDirs: true
});

// List directory
const files = await directoryList.execute({
  path: './',
  recursive: false,
  includeDetails: true
});

console.log(files.files);
```

### Date/Time Example

```typescript
import { currentDateTime, dateArithmetic, dateDifference } from '@agentforge/tools';

// Get current date
const now = await currentDateTime.execute({
  format: 'custom',
  customFormat: 'yyyy-MM-dd HH:mm:ss'
});

// Add 7 days
const future = await dateArithmetic.execute({
  date: now.iso,
  operation: 'add',
  amount: 7,
  unit: 'days'
});

// Calculate difference
const diff = await dateDifference.execute({
  startDate: now.iso,
  endDate: future.result,
  unit: 'hours'
});

console.log(`${diff.difference} hours until ${future.result}`);
```

### String Manipulation Example

```typescript
import { stringCaseConverter, stringReplace, stringSplit } from '@agentforge/tools';

// Convert to different cases
const camel = await stringCaseConverter.execute({
  text: 'hello world example',
  targetCase: 'camel'
});
// Result: "helloWorldExample"

const kebab = await stringCaseConverter.execute({
  text: 'HelloWorldExample',
  targetCase: 'kebab'
});
// Result: "hello-world-example"

// Replace text
const replaced = await stringReplace.execute({
  text: 'Hello World, Hello Universe',
  search: 'Hello',
  replace: 'Hi',
  global: true
});
// Result: "Hi World, Hi Universe"

// Split string
const parts = await stringSplit.execute({
  text: 'apple,banana,orange',
  delimiter: ','
});
// Result: ["apple", "banana", "orange"]
```

### Validation Example

```typescript
import { emailValidator, urlValidatorSimple, creditCardValidator } from '@agentforge/tools';

// Validate email
const email = await emailValidator.execute({
  email: 'user@example.com'
});
console.log(email.valid); // true

// Validate URL
const url = await urlValidatorSimple.execute({
  url: 'https://example.com/path'
});
console.log(url.valid); // true

// Validate credit card
const card = await creditCardValidator.execute({
  cardNumber: '4532-1488-0343-6467'
});
console.log(card.valid); // true (passes Luhn check)
```

## 🔗 Using with LangChain

All tools are compatible with LangChain through the `@agentforge/core` integration:

```typescript
import { httpGet, jsonParser } from '@agentforge/tools';
import { toLangChainTool } from '@agentforge/core';

// Convert to LangChain tools
const langchainHttpGet = toLangChainTool(httpGet);
const langchainJsonParser = toLangChainTool(jsonParser);

// Use with LangChain agents
const tools = [langchainHttpGet, langchainJsonParser];
```

## 📖 API Reference

### Tool Structure

All tools follow the same structure:

```typescript
interface Tool<TInput, TOutput> {
  metadata: {
    name: string;
    description: string;
    category: ToolCategory;
    tags?: string[];
  };
  schema: ZodSchema<TInput>;
  execute: (input: TInput) => Promise<TOutput>;
}
```

### Error Handling

Most tools return a result object with a `success` field:

```typescript
const result = await someTool.execute({ ... });

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Type Safety

All tools are fully typed with TypeScript:

```typescript
import { httpGet } from '@agentforge/tools';

// TypeScript knows the input type
const result = await httpGet.execute({
  url: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
});

// TypeScript knows the output type
console.log(result.data);
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## 📊 Tool Statistics

- **Total Tools**: 81
- **Web Tools**: 22 (includes 4 Slack tools + 7 Confluence tools)
- **Data Tools**: 18
- **File Tools**: 18
- **Utility Tools**: 22
- **Agent Tools**: 1
- **Lines of Code**: ~4,000
- **Full TypeScript Support**: ✅
- **Zod Validation**: ✅
- **LangChain Compatible**: ✅

## 🤝 Contributing

Contributions are welcome! Please see the main AgentForge repository for contribution guidelines.

## 📄 License

MIT © 2026 Tom Van Schoor

## 📖 Documentation

- 📚 **[Full Documentation](https://tvscoundrel.github.io/agentforge/)**
- 🚀 **[Quick Start](https://tvscoundrel.github.io/agentforge/guide/quick-start)**
- 🛠️ **[Tools API Reference](https://tvscoundrel.github.io/agentforge/api/tools)**
- 💡 **[Custom Tools Tutorial](https://tvscoundrel.github.io/agentforge/tutorials/custom-tools)**
- 📦 **[Examples](https://tvscoundrel.github.io/agentforge/examples/custom-tools)**

## 🔗 Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [npm Package](https://www.npmjs.com/package/@agentforge/tools)
- [Report Issues](https://github.com/TVScoundrel/agentforge/issues)

## 📚 Related Packages

- [@agentforge/core](https://www.npmjs.com/package/@agentforge/core) - Core abstractions
- [@agentforge/patterns](https://www.npmjs.com/package/@agentforge/patterns) - Agent patterns
- [@agentforge/testing](https://www.npmjs.com/package/@agentforge/testing) - Testing utilities
- [@agentforge/cli](https://www.npmjs.com/package/@agentforge/cli) - CLI tool

---

**Built with ❤️ by the AgentForge Team**


