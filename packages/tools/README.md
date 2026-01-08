# @agentforge/tools

> Production-ready tools collection for AgentForge - 68 tools for web, data, file, and utility operations

[![npm version](https://img.shields.io/npm/v/@agentforge/tools)](https://www.npmjs.com/package/@agentforge/tools)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## 🎉 Status: Production Ready & Published

**68 production-ready tools** | **Full TypeScript support** | **Comprehensive documentation** | **LangChain compatible**

## 📦 Installation

```bash
npm install @agentforge/tools
# or
pnpm add @agentforge/tools
# or
yarn add @agentforge/tools
```

## 🎯 Overview

This package provides **68 ready-to-use tools** organized into 4 categories:

- **🌐 Web Tools** (10 tools) - HTTP requests, web scraping, HTML parsing, URL manipulation
- **📊 Data Tools** (18 tools) - JSON, CSV, XML processing and data transformation
- **📁 File Tools** (18 tools) - File operations, directory management, path utilities
- **🔧 Utility Tools** (22 tools) - Date/time, strings, math, validation

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

### 🌐 Web Tools (10 tools)

Tools for web interactions and HTTP operations.

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

- **Total Tools**: 68
- **Web Tools**: 10
- **Data Tools**: 18
- **File Tools**: 18
- **Utility Tools**: 22
- **Lines of Code**: ~2,500
- **Full TypeScript Support**: ✅
- **Zod Validation**: ✅
- **LangChain Compatible**: ✅

## 🤝 Contributing

Contributions are welcome! Please see the main AgentForge repository for contribution guidelines.

## 📄 License

MIT

## 🔗 Links

- [AgentForge Documentation](https://github.com/agentforge/agentforge)
- [Tool Builder API](../core/docs/TOOL_BUILDER.md)
- [LangChain Integration](../core/docs/LANGCHAIN_INTEGRATION.md)

---

**Built with ❤️ by the AgentForge Team**


