# @agentforge/tools

Standard tools library with 68+ production-ready tools.

## Installation

```bash
pnpm add @agentforge/tools
```

## Web Tools (10)

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

// Validate URL
const isValid = await urlValidator.invoke({
  url: 'https://example.com'
});

// Build URL
const url = await urlBuilder.invoke({
  base: 'https://api.example.com',
  path: '/users',
  query: { page: 1, limit: 10 }
});

// Parse query string
const params = await urlQueryParser.invoke({
  url: 'https://example.com?foo=bar&baz=qux'
});
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
const data = await jsonParser.invoke({
  json: '{"name": "John"}'
});

// Stringify
const json = await jsonStringify.invoke({
  data: { name: 'John' },
  pretty: true
});

// Query JSON (JSONPath)
const result = await jsonQuery.invoke({
  data: { users: [{ name: 'John' }] },
  query: '$.users[0].name'
});

// Validate JSON
const isValid = await jsonValidator.invoke({
  json: '{"name": "John"}',
  schema: { type: 'object' }
});

// Merge JSON objects
const merged = await jsonMerge.invoke({
  objects: [{ a: 1 }, { b: 2 }]
});
```

### CSV Processing

```typescript
import { csvParser, csvGenerator, csvToJson, jsonToCsv } from '@agentforge/tools';

// Parse CSV
const data = await csvParser.invoke({
  csv: 'name,age\nJohn,30',
  delimiter: ','
});

// Generate CSV
const csv = await csvGenerator.invoke({
  data: [{ name: 'John', age: 30 }]
});

// Convert CSV to JSON
const json = await csvToJson.invoke({
  csv: 'name,age\nJohn,30'
});

// Convert JSON to CSV
const csvData = await jsonToCsv.invoke({
  data: [{ name: 'John', age: 30 }]
});
```

### XML Processing

```typescript
import { xmlParser, xmlGenerator, xmlToJson, jsonToXml } from '@agentforge/tools';

// Parse XML
const data = await xmlParser.invoke({
  xml: '<root><name>John</name></root>'
});

// Generate XML
const xml = await xmlGenerator.invoke({
  data: { root: { name: 'John' } }
});
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
const filtered = await arrayFilter.invoke({
  array: [1, 2, 3, 4],
  predicate: 'x > 2'
});

// Map array
const mapped = await arrayMap.invoke({
  array: [1, 2, 3],
  transform: 'x * 2'
});

// Sort array
const sorted = await arraySort.invoke({
  array: [3, 1, 2],
  order: 'asc'
});

// Group by
const grouped = await arrayGroupBy.invoke({
  array: [{ type: 'a', val: 1 }, { type: 'a', val: 2 }],
  key: 'type'
});
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
const content = await fileReader.invoke({
  path: '/path/to/file.txt',
  encoding: 'utf-8'
});

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
const files = await directoryList.invoke({
  path: '/path/to/dir',
  recursive: true
});

// Create directory
await directoryCreate.invoke({
  path: '/path/to/new/dir'
});

// Search files
const results = await fileSearch.invoke({
  path: '/path/to/dir',
  pattern: '*.ts',
  recursive: true
});
```

## Utility Tools (22)

### Date/Time

```typescript
import { formatDate, parseDate, dateAdd, dateDiff, getCurrentTime } from '@agentforge/tools';
```

### String Utilities

```typescript
import { 
  stringCase, 
  stringTrim, 
  stringReplace,
  stringSplit,
  stringJoin,
  stringTemplate,
  stringHash 
} from '@agentforge/tools';
```

### Math Operations

```typescript
import { calculator, randomNumber, round, percentage } from '@agentforge/tools';
```

### Validation

```typescript
import { 
  validateEmail, 
  validateUrl, 
  validatePhone,
  validateCreditCard,
  validateIPAddress,
  validateUUID 
} from '@agentforge/tools';
```

## Complete Tool List

See the [Tools README](https://github.com/TVScoundrel/agentforge/tree/main/packages/tools) for the complete list of all 68 tools with detailed documentation.

