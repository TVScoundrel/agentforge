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
  .category(ToolCategory.DATA)
  .tags(['database', 'query', 'users'])
  .schema(z.object({
    table: z.enum(['users', 'orders', 'products']),
    filters: z.record(z.any()).optional(),
    limit: z.number().min(1).max(100).default(10)
  }))
  .examples([
    {
      input: { table: 'users', filters: { active: true }, limit: 5 },
      output: { count: 5, rows: [] }
    }
  ])
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
  .category(ToolCategory.FILE)
  .tags(['file', 'read', 'filesystem'])
  .schema(z.object({
    path: z.string().describe('File path'),
    encoding: z.enum(['utf-8', 'ascii', 'base64']).default('utf-8')
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
});
```

## Best Practices

1. **Always validate inputs** - Use Zod schemas
2. **Handle errors gracefully** - Return structured error responses
3. **Add metadata** - Categories, tags, examples
4. **Document thoroughly** - Clear descriptions
5. **Test extensively** - Unit and integration tests
6. **Consider security** - Validate paths, sanitize inputs
7. **Rate limit** - Prevent abuse
8. **Log operations** - For debugging and monitoring

## Next Steps

- [Advanced Patterns](/tutorials/advanced-patterns) - Use tools in complex patterns
- [Production Deployment](/tutorials/production-deployment) - Deploy tools to production
- [Tool Registry](/guide/concepts/tools) - Learn about tool discovery

