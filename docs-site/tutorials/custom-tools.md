# Building Custom Tools

Learn how to create powerful custom tools for your agents.

## What You'll Learn

- Tool builder API
- Schema validation with Zod
- Error handling
- Tool metadata and discovery
- Testing custom tools

## Basic Tool Structure

Every tool has:
1. **Name** - Unique identifier
2. **Description** - What the tool does
3. **Schema** - Input validation
4. **Implementation** - The actual logic

## Example 1: Simple Calculator

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

export const calculator = toolBuilder()
  .name('calculator')
  .description('Perform mathematical calculations')
  .category(ToolCategory.UTILITY)
  .tags(['math', 'calculation'])
  .schema(z.object({
    expression: z.string().describe('Mathematical expression to evaluate')
  }))
  .implement(async ({ expression }) => {
    try {
      // Safe evaluation (in production, use a proper math parser)
      const result = eval(expression);
      
      return {
        success: true,
        data: {
          expression,
          result
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Invalid expression: ${error.message}`
      };
    }
  })
  .build();
```

## Example 2: Database Query Tool

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { db } from './database.js';

export const queryDatabase = toolBuilder()
  .name('query-database')
  .description('Query the database for user information')
  .category(ToolCategory.DATABASE)  // Use DATABASE for database operations
  .tags(['database', 'query', 'users'])
  .schema(z.object({
    table: z.enum(['users', 'orders', 'products']).describe('Database table to query'),
    filters: z.record(z.any()).optional().describe('Optional filters to apply'),
    limit: z.number().min(1).max(100).default(10).describe('Maximum number of results (1-100, default: 10)')
  }))
  .example({
    description: 'Query active users with limit',
    input: { table: 'users', filters: { active: true }, limit: 5 },
    output: { count: 5, rows: [] }
  })
  .implement(async ({ table, filters = {}, limit }) => {
    try {
      const results = await db
        .select()
        .from(table)
        .where(filters)
        .limit(limit);

      return {
        success: true,
        data: {
          table,
          count: results.length,
          rows: results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }
  })
  .build();
```

## Example 3: API Integration Tool

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import axios from 'axios';

export const githubSearch = toolBuilder()
  .name('github-search')
  .description('Search GitHub repositories')
  .category(ToolCategory.WEB)
  .tags(['github', 'search', 'api'])
  .schema(z.object({
    query: z.string().min(1).describe('Search query'),
    language: z.string().optional().describe('Programming language filter'),
    sort: z.enum(['stars', 'forks', 'updated']).default('stars')
  }))
  .implement(async ({ query, language, sort }) => {
    try {
      const params = new URLSearchParams({
        q: language ? `${query} language:${language}` : query,
        sort,
        order: 'desc',
        per_page: '10'
      });

      const response = await axios.get(
        `https://api.github.com/search/repositories?${params}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AgentForge'
          }
        }
      );

      return {
        success: true,
        data: {
          total: response.data.total_count,
          repositories: response.data.items.map((repo: any) => ({
            name: repo.full_name,
            description: repo.description,
            stars: repo.stargazers_count,
            url: repo.html_url
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `GitHub API error: ${error.message}`
      };
    }
  })
  .build();
```

## Example 4: File System Tool

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

export const readFile = toolBuilder()
  .name('read-file')
  .description('Read contents of a file')
  .category(ToolCategory.FILE_SYSTEM)  // Use FILE_SYSTEM for file operations
  .tags(['file', 'read', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('File path'),
    encoding: z.enum(['utf-8', 'ascii', 'base64']).default('utf-8').describe('File encoding (default: utf-8)')
  }))
  .implement(async ({ path: filePath, encoding }) => {
    try {
      // Security: validate path is within allowed directory
      const allowedDir = process.cwd();
      const resolvedPath = path.resolve(filePath);
      
      if (!resolvedPath.startsWith(allowedDir)) {
        return {
          success: false,
          error: 'Access denied: path outside allowed directory'
        };
      }

      const content = await fs.readFile(resolvedPath, encoding);

      return {
        success: true,
        data: {
          path: filePath,
          content,
          size: content.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `File read error: ${error.message}`
      };
    }
  })
  .build();
```

## Advanced: Tool with State

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

class RateLimitedTool {
  private requests = new Map<string, number[]>();
  private maxRequests = 10;
  private windowMs = 60000;

  async checkRateLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimitedTool();

export const rateLimitedAPI = toolBuilder()
  .name('rate-limited-api')
  .description('API call with rate limiting')
  .category(ToolCategory.WEB)
  .schema(z.object({
    endpoint: z.string(),
    userId: z.string()
  }))
  .implement(async ({ endpoint, userId }) => {
    const allowed = await rateLimiter.checkRateLimit(userId);
    
    if (!allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    // Make API call
    // ...

    return {
      success: true,
      data: { /* ... */ }
    };
  })
  .build();
```

## Tool Relations (NEW in v0.3.9)

Define relationships between tools to guide LLM workflows:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Step 1: Search tool
const searchCodebase = toolBuilder()
  .name('search-codebase')
  .description('Search for files or code patterns')
  .category(ToolCategory.FILE_SYSTEM)
  .precedes(['view-file', 'edit-file'])  // Typically called before these
  .schema(z.object({
    pattern: z.string().describe('Search pattern')
  }))
  .implement(async ({ pattern }) => {
    // Implementation
    return { files: ['app.ts', 'utils.ts'] };
  })
  .build();

// Step 2: View tool
const viewFile = toolBuilder()
  .name('view-file')
  .description('View file contents')
  .category(ToolCategory.FILE_SYSTEM)
  .follows(['search-codebase'])  // Often follows search
  .precedes(['edit-file'])        // Typically before editing
  .schema(z.object({
    path: z.string().describe('File path')
  }))
  .implement(async ({ path }) => {
    // Implementation
    return { content: '...' };
  })
  .build();

// Step 3: Edit tool
const editFile = toolBuilder()
  .name('edit-file')
  .description('Edit a file')
  .category(ToolCategory.FILE_SYSTEM)
  .requires(['view-file'])        // MUST view first
  .suggests(['run-tests'])         // Suggest testing after
  .follows(['search-codebase', 'view-file'])
  .precedes(['run-tests'])
  .schema(z.object({
    path: z.string().describe('File path'),
    content: z.string().describe('New content')
  }))
  .implement(async ({ path, content }) => {
    // Implementation
    return { success: true };
  })
  .build();
```

**Relation Types:**
- **`requires`** - Must be called before (enforced by LLM understanding)
- **`suggests`** - Recommended to use together
- **`conflicts`** - Should not be used together
- **`follows`** - Typically called after
- **`precedes`** - Typically called before

**Benefits:**
- ✅ Better LLM decision making
- ✅ Fewer workflow errors
- ✅ Improved tool discovery
- ✅ Clear usage patterns

## Testing Custom Tools

```typescript
import { describe, it, expect } from 'vitest';
import { calculator } from './calculator.js';

describe('Calculator Tool', () => {
  it('should perform addition', async () => {
    const result = await calculator.invoke({
      expression: '2 + 2'
    });

    expect(result.success).toBe(true);
    expect(result.data.result).toBe(4);
  });

  it('should handle errors', async () => {
    const result = await calculator.invoke({
      expression: 'invalid'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should have correct relations', () => {
    const metadata = editFile.metadata;

    expect(metadata.relations?.requires).toContain('view-file');
    expect(metadata.relations?.suggests).toContain('run-tests');
  });
});
```

## Best Practices

1. **Always validate inputs** - Use Zod schemas with `.describe()` on all fields
2. **Handle errors gracefully** - Return structured error responses
3. **Add metadata** - Categories, tags, examples, usage notes, limitations
4. **Define relations** - Use tool relations to guide LLM workflows (NEW in v0.3.9)
5. **Document thoroughly** - Clear descriptions that help LLMs understand when to use the tool
6. **Test extensively** - Unit and integration tests, including relation validation
7. **Consider security** - Validate paths, sanitize inputs, check permissions
8. **Rate limit** - Prevent abuse of expensive operations
9. **Log operations** - For debugging and monitoring
10. **Use minimal mode** - When using native tool calling providers to reduce token costs

## Next Steps

- [Advanced Patterns](/tutorials/advanced-patterns) - Use tools in complex patterns
- [Production Deployment](/tutorials/production-deployment) - Deploy tools to production
- [Tool Registry](/guide/concepts/tools) - Learn about tool discovery

