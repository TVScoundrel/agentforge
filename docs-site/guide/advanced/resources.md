# Resource Management

Learn how to optimize memory usage, manage token consumption, and efficiently handle computational resources in agent applications.

## Overview

Resource management is critical for:
- **Cost control** - Minimize API costs and infrastructure expenses
- **Performance** - Optimize memory and CPU usage
- **Scalability** - Handle multiple concurrent agents
- **Reliability** - Prevent resource exhaustion and crashes
- **User experience** - Maintain responsive applications

## Token Management

### Understanding Token Usage

Tokens are the primary cost driver in LLM applications:

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ 
  model: 'gpt-4',
  callbacks: [{
    handleLLMEnd: (output) => {
      const usage = output.llmOutput?.tokenUsage;
      console.log('Tokens used:', {
        prompt: usage?.promptTokens,
        completion: usage?.completionTokens,
        total: usage?.totalTokens,
        estimatedCost: calculateCost(usage?.totalTokens, 'gpt-4')
      });
    }
  }]
});

function calculateCost(tokens: number, model: string): number {
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 },  // per 1K tokens
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
  };
  
  return (tokens / 1000) * pricing[model].input;
}
```

### Token Budgets

Set limits to prevent runaway costs:

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  llm,
  tools,
  maxTokens: 10000,  // Total token budget
  onTokenLimitReached: (usage) => {
    console.warn('Token limit reached:', usage);
    throw new Error('Token budget exceeded');
  }
});

// Track cumulative usage
let totalTokens = 0;
const maxBudget = 50000;

const result = await agent.invoke(input, {
  callbacks: [{
    handleLLMEnd: (output) => {
      totalTokens += output.llmOutput?.tokenUsage?.totalTokens || 0;
      
      if (totalTokens > maxBudget) {
        throw new Error(`Budget exceeded: ${totalTokens}/${maxBudget} tokens`);
      }
    }
  }]
});
```

### Optimize Prompt Length

Reduce token usage by optimizing prompts:

```typescript
// ❌ Verbose prompt (high token count)
const verbosePrompt = `
You are a highly skilled and experienced research assistant with expertise in 
finding accurate information. Your task is to search the web thoroughly and 
comprehensively to find the most relevant and up-to-date information about the 
topic that the user has requested. Please make sure to verify all facts and 
provide citations for your sources.
`;

// ✅ Concise prompt (lower token count)
const concisePrompt = `You are a research assistant. Find accurate, current information and cite sources.`;

const agent = createReActAgent({
  llm,
  tools,
  systemMessage: concisePrompt  // Save ~50 tokens per request
});
```

### Trim Message History

Limit context window size:

```typescript
import { BufferMemory } from '@langchain/memory';

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
  maxTokenLimit: 2000,  // Limit history to 2000 tokens
});

// Or use a sliding window
class SlidingWindowMemory {
  private messages: any[] = [];
  private maxMessages: number;
  
  constructor(maxMessages: number = 10) {
    this.maxMessages = maxMessages;
  }
  
  addMessage(message: any) {
    this.messages.push(message);
    
    // Keep only recent messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }
  
  getMessages() {
    return this.messages;
  }
}
```

### Summarize Long Contexts

Compress long conversations:

```typescript
import { ChatOpenAI } from '@langchain/openai';

async function summarizeHistory(messages: any[], maxTokens: number = 500) {
  const llm = new ChatOpenAI({ model: 'gpt-3.5-turbo' });
  
  const summary = await llm.invoke([
    {
      role: 'system',
      content: 'Summarize this conversation concisely, preserving key information.'
    },
    {
      role: 'user',
      content: JSON.stringify(messages)
    }
  ]);
  
  return summary.content;
}

// Usage
if (messages.length > 20) {
  const summary = await summarizeHistory(messages.slice(0, -5));
  messages = [
    { role: 'system', content: `Previous conversation summary: ${summary}` },
    ...messages.slice(-5)  // Keep recent messages
  ];
}
```

## Memory Management

### Monitor Memory Usage

Track memory consumption:

```typescript
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB'
  };
}

// Log memory before and after agent execution
console.log('Memory before:', getMemoryUsage());
const result = await agent.invoke(input);
console.log('Memory after:', getMemoryUsage());
```

### Memory Limits

Set memory limits for Node.js:

```bash
# Set max heap size to 2GB
node --max-old-space-size=2048 app.js

# Set max heap size to 4GB
node --max-old-space-size=4096 app.js
```

### Garbage Collection

Optimize garbage collection:

```typescript
// Force garbage collection (requires --expose-gc flag)
if (global.gc) {
  global.gc();
  console.log('Garbage collection triggered');
}

// Run with: node --expose-gc app.js

// Monitor GC events
const v8 = require('v8');

setInterval(() => {
  const heapStats = v8.getHeapStatistics();
  console.log('Heap usage:', {
    used: Math.round(heapStats.used_heap_size / 1024 / 1024) + ' MB',
    total: Math.round(heapStats.total_heap_size / 1024 / 1024) + ' MB',
    limit: Math.round(heapStats.heap_size_limit / 1024 / 1024) + ' MB'
  });
}, 10000);
```

### Clean Up Resources

Properly dispose of resources:

```typescript
class ManagedAgent {
  private agent: any;
  private resources: any[] = [];
  
  constructor(config: any) {
    this.agent = createReActAgent(config);
  }
  
  async invoke(input: any) {
    try {
      return await this.agent.invoke(input);
    } finally {
      this.cleanup();
    }
  }
  
  private cleanup() {
    // Clear large objects
    this.resources.forEach(resource => {
      if (resource.dispose) {
        resource.dispose();
      }
    });
    this.resources = [];

    // Force GC if available
    if (global.gc) {
      global.gc();
    }
  }
}
```

## Caching Strategies

### Response Caching

Cache LLM responses to reduce costs:

```typescript
import { Redis } from 'ioredis';

class CachedLLM {
  private llm: ChatOpenAI;
  private cache: Redis;
  private ttl: number;

  constructor(llm: ChatOpenAI, cacheConfig: { ttl: number }) {
    this.llm = llm;
    this.cache = new Redis();
    this.ttl = cacheConfig.ttl;
  }

  async invoke(messages: any[]) {
    const cacheKey = this.getCacheKey(messages);

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit');
      return JSON.parse(cached);
    }

    // Call LLM
    console.log('Cache miss - calling LLM');
    const result = await this.llm.invoke(messages);

    // Store in cache
    await this.cache.setex(cacheKey, this.ttl, JSON.stringify(result));

    return result;
  }

  private getCacheKey(messages: any[]): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(messages))
      .digest('hex');
  }
}

// Usage
const cachedLLM = new CachedLLM(
  new ChatOpenAI({ model: 'gpt-4' }),
  { ttl: 3600 }  // Cache for 1 hour
);
```

### Tool Result Caching

Cache expensive tool operations:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';

const cachedWebSearch = toolBuilder()
  .name('web-search')
  .description('Search the web')
  .category(ToolCategory.WEB)
  .schema(z.object({ query: z.string() }))
  .implement(async ({ query }) => {
    const cacheKey = `search:${query}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Perform search
    const results = await performWebSearch(query);

    // Cache results for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(results));

    return results;
  })
  .build();
```

### Semantic Caching

Cache based on semantic similarity:

```typescript
import { OpenAIEmbeddings } from '@langchain/openai';
import { cosineSimilarity } from '@langchain/core/utils/math';

class SemanticCache {
  private embeddings: OpenAIEmbeddings;
  private cache: Map<string, { embedding: number[], response: any }>;
  private similarityThreshold: number;

  constructor(similarityThreshold: number = 0.95) {
    this.embeddings = new OpenAIEmbeddings();
    this.cache = new Map();
    this.similarityThreshold = similarityThreshold;
  }

  async get(query: string): Promise<any | null> {
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Find similar cached queries
    for (const [key, value] of this.cache.entries()) {
      const similarity = cosineSimilarity(queryEmbedding, value.embedding);

      if (similarity >= this.similarityThreshold) {
        console.log(`Semantic cache hit (similarity: ${similarity})`);
        return value.response;
      }
    }

    return null;
  }

  async set(query: string, response: any) {
    const embedding = await this.embeddings.embedQuery(query);
    this.cache.set(query, { embedding, response });
  }
}

// Usage
const semanticCache = new SemanticCache(0.95);

async function cachedAgentCall(query: string) {
  // Check semantic cache
  const cached = await semanticCache.get(query);
  if (cached) return cached;

  // Call agent
  const result = await agent.invoke({ messages: [{ role: 'user', content: query }] });

  // Cache result
  await semanticCache.set(query, result);

  return result;
}
```

## Rate Limiting

### Request Rate Limiting

Prevent API rate limit errors:

```typescript
import { RateLimiter } from 'limiter';

class RateLimitedLLM {
  private llm: ChatOpenAI;
  private limiter: RateLimiter;

  constructor(llm: ChatOpenAI, requestsPerMinute: number = 60) {
    this.llm = llm;
    this.limiter = new RateLimiter({
      tokensPerInterval: requestsPerMinute,
      interval: 'minute'
    });
  }

  async invoke(messages: any[]) {
    // Wait for rate limit token
    await this.limiter.removeTokens(1);

    return await this.llm.invoke(messages);
  }
}

// Usage
const rateLimitedLLM = new RateLimitedLLM(
  new ChatOpenAI({ model: 'gpt-4' }),
  60  // 60 requests per minute
);
```

### Token Rate Limiting

Limit tokens per time period:

```typescript
class TokenRateLimiter {
  private tokensUsed: number = 0;
  private resetTime: number;
  private maxTokensPerPeriod: number;
  private periodMs: number;

  constructor(maxTokensPerPeriod: number, periodMs: number = 60000) {
    this.maxTokensPerPeriod = maxTokensPerPeriod;
    this.periodMs = periodMs;
    this.resetTime = Date.now() + periodMs;
  }

  async checkLimit(estimatedTokens: number): Promise<void> {
    // Reset if period expired
    if (Date.now() >= this.resetTime) {
      this.tokensUsed = 0;
      this.resetTime = Date.now() + this.periodMs;
    }

    // Check if we would exceed limit
    if (this.tokensUsed + estimatedTokens > this.maxTokensPerPeriod) {
      const waitTime = this.resetTime - Date.now();
      console.log(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Reset after waiting
      this.tokensUsed = 0;
      this.resetTime = Date.now() + this.periodMs;
    }

    this.tokensUsed += estimatedTokens;
  }
}

// Usage
const tokenLimiter = new TokenRateLimiter(100000, 60000); // 100K tokens per minute

async function rateLimitedInvoke(input: string) {
  const estimatedTokens = estimateTokenCount(input);
  await tokenLimiter.checkLimit(estimatedTokens);

  return await agent.invoke({ messages: [{ role: 'user', content: input }] });
}
```

## Concurrency Control

### Limit Concurrent Agents

Prevent resource exhaustion:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5);  // Max 5 concurrent agents

const tasks = queries.map(query =>
  limit(async () => {
    console.log('Starting agent for:', query);
    const result = await agent.invoke({ messages: [{ role: 'user', content: query }] });
    console.log('Completed:', query);
    return result;
  })
);

const results = await Promise.all(tasks);
```

### Queue Management

Process requests in a queue:

```typescript
class AgentQueue {
  private queue: Array<{ input: any, resolve: Function, reject: Function }> = [];
  private processing: number = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue(input: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ input, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.processing++;

    try {
      const result = await agent.invoke(item.input);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.processing--;
      this.processQueue();
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

// Usage
const agentQueue = new AgentQueue(3);

const results = await Promise.all(
  queries.map(query => agentQueue.enqueue({ messages: [{ role: 'user', content: query }] }))
);
```

## Resource Pooling

### LLM Connection Pool

Reuse LLM instances:

```typescript
class LLMPool {
  private pool: ChatOpenAI[] = [];
  private available: ChatOpenAI[] = [];
  private poolSize: number;

  constructor(config: any, poolSize: number = 5) {
    this.poolSize = poolSize;

    for (let i = 0; i < poolSize; i++) {
      const llm = new ChatOpenAI(config);
      this.pool.push(llm);
      this.available.push(llm);
    }
  }

  async acquire(): Promise<ChatOpenAI> {
    while (this.available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.available.pop()!;
  }

  release(llm: ChatOpenAI) {
    this.available.push(llm);
  }

  async use<T>(fn: (llm: ChatOpenAI) => Promise<T>): Promise<T> {
    const llm = await this.acquire();
    try {
      return await fn(llm);
    } finally {
      this.release(llm);
    }
  }
}

// Usage
const llmPool = new LLMPool({ model: 'gpt-4' }, 5);

const result = await llmPool.use(async (llm) => {
  return await llm.invoke(messages);
});
```

## Monitoring & Alerts

### Resource Monitoring

Track resource usage over time:

```typescript
class ResourceMonitor {
  private metrics: Array<{
    timestamp: number;
    memory: any;
    tokens: number;
  }> = [];

  record(tokens: number) {
    this.metrics.push({
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      tokens
    });

    // Keep only last hour
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
  }

  getStats() {
    const totalTokens = this.metrics.reduce((sum, m) => sum + m.tokens, 0);
    const avgMemory = this.metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / this.metrics.length;

    return {
      totalTokens,
      avgMemoryMB: Math.round(avgMemory / 1024 / 1024),
      requestCount: this.metrics.length,
      tokensPerRequest: Math.round(totalTokens / this.metrics.length)
    };
  }
}

const monitor = new ResourceMonitor();

// Record after each request
const result = await agent.invoke(input, {
  callbacks: [{
    handleLLMEnd: (output) => {
      monitor.record(output.llmOutput?.tokenUsage?.totalTokens || 0);
    }
  }]
});

// Check stats periodically
setInterval(() => {
  console.log('Resource stats:', monitor.getStats());
}, 60000);
```

### Alert on Thresholds

Send alerts when limits are exceeded:

```typescript
class ResourceAlerts {
  private thresholds: {
    memoryMB: number;
    tokensPerMinute: number;
    errorRate: number;
  };

  constructor(thresholds: any) {
    this.thresholds = thresholds;
  }

  check(metrics: any) {
    if (metrics.memoryMB > this.thresholds.memoryMB) {
      this.alert('HIGH_MEMORY', `Memory usage: ${metrics.memoryMB}MB`);
    }

    if (metrics.tokensPerMinute > this.thresholds.tokensPerMinute) {
      this.alert('HIGH_TOKEN_USAGE', `Token rate: ${metrics.tokensPerMinute}/min`);
    }

    if (metrics.errorRate > this.thresholds.errorRate) {
      this.alert('HIGH_ERROR_RATE', `Error rate: ${metrics.errorRate}%`);
    }
  }

  private alert(type: string, message: string) {
    console.error(`🚨 ALERT [${type}]: ${message}`);

    // Send to monitoring service
    // sendToSlack(message);
    // sendToPagerDuty(type, message);
  }
}
```

## Best Practices

### 1. Set Resource Limits

Always define limits to prevent runaway costs:

```typescript
const agent = createReActAgent({
  llm,
  tools,
  maxIterations: 15,
  maxTokens: 10000,
  timeout: 60000  // 1 minute
});
```

### 2. Use Appropriate Models

Choose the right model for the task:

```typescript
// ✅ Use cheaper models for simple tasks
const simpleAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-3.5-turbo' }),  // $0.002/1K tokens
  tools: [calculator]
});

// ✅ Use expensive models only when needed
const complexAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),  // $0.03/1K tokens
  tools: [webScraper, calculator]
});
```

### 3. Implement Caching

Cache aggressively to reduce costs:

```typescript
// Cache LLM responses
// Cache tool results
// Cache embeddings
// Use semantic caching for similar queries
```

### 4. Monitor and Alert

Track resource usage and set up alerts:

```typescript
// Monitor memory, tokens, errors
// Alert on threshold violations
// Track costs over time
```

## Next Steps

- [Monitoring](/guide/advanced/monitoring) - Detailed observability
- [Deployment](/guide/advanced/deployment) - Production optimization
- [Streaming](/guide/advanced/streaming) - Efficient data transfer
- [Core API Reference](/api/core) - Core resource utilities

## Further Reading

- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Redis Caching](https://redis.io/docs/manual/client-side-caching/)


