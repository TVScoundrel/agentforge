# Streaming & Real-Time Processing

Learn how to build responsive, real-time agent applications using streaming APIs, server-sent events, and progressive output generation.

## Overview

Streaming enables agents to:
- **Provide immediate feedback** - Show progress as work happens
- **Improve user experience** - Display partial results incrementally
- **Enable real-time interaction** - Respond to user input during execution
- **Reduce perceived latency** - Start showing results before completion
- **Handle long-running tasks** - Keep users engaged during processing

## Why Streaming Matters

Traditional request-response patterns can feel slow for agent applications:

```typescript
// ❌ Traditional: User waits for complete response
const result = await agent.invoke(input);
console.log(result);  // Shows after 30+ seconds
```

Streaming provides progressive updates:

```typescript
// ✅ Streaming: User sees progress immediately
const stream = await agent.stream(input);
for await (const chunk of stream) {
  console.log(chunk);  // Shows updates in real-time
}
```

## Basic Streaming

### Stream Agent Responses

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', streaming: true }),
  tools: [webScraper, calculator]
});

// Stream the agent's execution
const stream = await agent.stream({
  messages: [{ role: 'user', content: 'Research AI trends and analyze the data' }]
});

for await (const chunk of stream) {
  if (chunk.agent) {
    console.log('Agent:', chunk.agent.messages);
  }
  if (chunk.tools) {
    console.log('Tool:', chunk.tools.name, chunk.tools.output);
  }
}
```

### Stream LLM Tokens

Stream individual tokens as they're generated:

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ 
  model: 'gpt-4',
  streaming: true 
});

const stream = await llm.stream('Write a detailed explanation of quantum computing');

for await (const chunk of stream) {
  process.stdout.write(chunk.content);  // Print tokens as they arrive
}
```

### Stream Events

Get detailed events during agent execution:

```typescript
const stream = await agent.streamEvents({
  messages: [{ role: 'user', content: 'Complex task' }]
});

for await (const event of stream) {
  switch (event.event) {
    case 'on_llm_start':
      console.log('LLM started:', event.name);
      break;
    case 'on_llm_stream':
      process.stdout.write(event.data.chunk.content);
      break;
    case 'on_tool_start':
      console.log('Tool started:', event.name, event.data.input);
      break;
    case 'on_tool_end':
      console.log('Tool completed:', event.data.output);
      break;
    case 'on_agent_action':
      console.log('Agent action:', event.data.action);
      break;
  }
}
```

## Streaming Patterns

### 1. Progress Indicators

Show progress during long-running tasks:

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const model = new ChatOpenAI({ model: 'gpt-4', streaming: true });

const agent = createPlanExecuteAgent({
  planner: {
    model,
    systemPrompt: 'Create a detailed plan'
  },
  executor: {
    tools: [webScraper, csvParser, fileWriter],
    model
  }
});

const stream = await agent.stream({ input: 'Your task here' });

let currentStep = 0;
const totalSteps = 10;

for await (const chunk of stream) {
  if (chunk.planning) {
    console.log('📋 Planning:', chunk.planning.step);
  }
  if (chunk.execution) {
    currentStep++;
    const progress = Math.round((currentStep / totalSteps) * 100);
    console.log(`⚙️  Executing step ${currentStep}/${totalSteps} (${progress}%)`);
    console.log(`   ${chunk.execution.description}`);
  }
  if (chunk.completion) {
    console.log('✅ Complete!');
  }
}
```

### 2. Incremental Results

Display partial results as they become available:

```typescript
const stream = await agent.stream({
  input: 'Find the top 10 AI companies and their valuations'
});

const results = [];

for await (const chunk of stream) {
  if (chunk.result) {
    results.push(chunk.result);
    console.log(`Found ${results.length}/10:`, chunk.result);
  }
}

console.log('Final results:', results);
```

### 3. Real-Time Collaboration

Enable multiple users to see agent progress:

```typescript
import { EventEmitter } from 'events';

class StreamingAgent extends EventEmitter {
  async execute(input: string) {
    const stream = await agent.stream({ input });

    for await (const chunk of stream) {
      // Broadcast to all connected clients
      this.emit('chunk', chunk);
    }
    
    this.emit('complete');
  }
}

const streamingAgent = new StreamingAgent();

// Client 1
streamingAgent.on('chunk', (chunk) => {
  console.log('Client 1 received:', chunk);
});

// Client 2
streamingAgent.on('chunk', (chunk) => {
  console.log('Client 2 received:', chunk);
});

await streamingAgent.invoke('Research task');
```

## Server-Sent Events (SSE)

### Express.js Integration

```typescript
import express from 'express';
import { createReActAgent } from '@agentforge/patterns';

const app = express();

app.get('/api/agent/stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const query = req.query.q as string;
  
  try {
    const stream = await agent.stream({
      messages: [{ role: 'user', content: query }]
    });
    
    for await (const chunk of stream) {
      // Send SSE event
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.listen(3000);
```

### Client-Side Consumption

```typescript
// Browser client
const eventSource = new EventSource('/api/agent/stream?q=Research AI trends');

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }
  
  const chunk = JSON.parse(event.data);
  console.log('Received:', chunk);
  
  // Update UI
  updateUI(chunk);
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

## WebSocket Streaming

For bidirectional real-time communication:

### Server Setup

```typescript
import { WebSocketServer } from 'ws';
import { createReActAgent } from '@agentforge/patterns';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    const { query } = JSON.parse(message.toString());

    try {
      const stream = await agent.stream({
        messages: [{ role: 'user', content: query }]
      });

      for await (const chunk of stream) {
        ws.send(JSON.stringify({ type: 'chunk', data: chunk }));
      }

      ws.send(JSON.stringify({ type: 'complete' }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

### Client Setup

```typescript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  ws.send(JSON.stringify({ query: 'Research AI trends' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'chunk':
      console.log('Chunk:', message.data);
      updateUI(message.data);
      break;
    case 'complete':
      console.log('Stream complete');
      break;
    case 'error':
      console.error('Error:', message.error);
      break;
  }
};
```

## React Integration

### Custom Hook for Streaming

```typescript
import { useState, useEffect } from 'react';

function useAgentStream(query: string) {
  const [chunks, setChunks] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    setIsStreaming(true);
    setChunks([]);
    setError(null);

    const eventSource = new EventSource(`/api/agent/stream?q=${encodeURIComponent(query)}`);

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        setIsStreaming(false);
        eventSource.close();
        return;
      }

      const chunk = JSON.parse(event.data);
      setChunks((prev) => [...prev, chunk]);
    };

    eventSource.onerror = (err) => {
      setError('Stream error occurred');
      setIsStreaming(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [query]);

  return { chunks, isStreaming, error };
}

// Usage in component
function AgentChat() {
  const [query, setQuery] = useState('');
  const { chunks, isStreaming, error } = useAgentStream(query);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question..."
      />

      {isStreaming && <div>Streaming...</div>}
      {error && <div>Error: {error}</div>}

      <div>
        {chunks.map((chunk, i) => (
          <div key={i}>{JSON.stringify(chunk)}</div>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Streaming Patterns

### 1. Buffered Streaming

Buffer chunks for smoother display:

```typescript
class StreamBuffer {
  private buffer: any[] = [];
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private onFlush: (chunks: any[]) => void,
    private flushInterval: number = 100
  ) {}

  start() {
    this.interval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.onFlush([...this.buffer]);
        this.buffer = [];
      }
    }, this.flushInterval);
  }

  add(chunk: any) {
    this.buffer.push(chunk);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      if (this.buffer.length > 0) {
        this.onFlush([...this.buffer]);
      }
    }
  }
}

// Usage
const buffer = new StreamBuffer((chunks) => {
  console.log('Flushing', chunks.length, 'chunks');
  updateUI(chunks);
}, 100);

buffer.start();

const stream = await agent.stream(input);
for await (const chunk of stream) {
  buffer.add(chunk);
}

buffer.stop();
```

### 2. Selective Streaming

Stream only specific event types:

```typescript
async function streamAgentThoughts(input: string) {
  const stream = await agent.streamEvents(input);

  for await (const event of stream) {
    // Only stream agent reasoning, not tool outputs
    if (event.event === 'on_agent_action') {
      yield {
        type: 'thought',
        content: event.data.action.log
      };
    }

    if (event.event === 'on_llm_stream') {
      yield {
        type: 'token',
        content: event.data.chunk.content
      };
    }
  }
}

// Usage
for await (const item of streamAgentThoughts('Research AI')) {
  if (item.type === 'thought') {
    console.log('💭', item.content);
  } else if (item.type === 'token') {
    process.stdout.write(item.content);
  }
}
```

### 3. Multi-Stream Aggregation

Combine multiple agent streams:

```typescript
async function* aggregateStreams(...streams: AsyncIterable<any>[]) {
  const iterators = streams.map(s => s[Symbol.asyncIterator]());
  const pending = new Set(iterators);

  while (pending.size > 0) {
    const promises = Array.from(pending).map(async (iter) => {
      const result = await iter.next();
      return { iter, result };
    });

    const { iter, result } = await Promise.race(promises);

    if (result.done) {
      pending.delete(iter);
    } else {
      yield result.value;
    }
  }
}

// Usage: Stream from multiple agents simultaneously
const stream1 = agent1.stream(input);
const stream2 = agent2.stream(input);
const stream3 = agent3.stream(input);

for await (const chunk of aggregateStreams(stream1, stream2, stream3)) {
  console.log('Received from any agent:', chunk);
}
```

## Error Handling

### Graceful Stream Errors

```typescript
async function streamWithErrorHandling(input: string) {
  try {
    const stream = await agent.stream({ messages: [{ role: 'user', content: input }] });

    for await (const chunk of stream) {
      try {
        // Process chunk
        processChunk(chunk);
      } catch (chunkError) {
        console.error('Error processing chunk:', chunkError);
        // Continue streaming despite chunk error
        yield { type: 'error', error: chunkError.message };
      }
    }
  } catch (streamError) {
    console.error('Stream initialization error:', streamError);
    yield { type: 'fatal_error', error: streamError.message };
  }
}
```

### Retry on Stream Failure

```typescript
async function* streamWithRetry(
  input: string,
  maxRetries: number = 3
) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const stream = await agent.stream({ messages: [{ role: 'user', content: input }] });

      for await (const chunk of stream) {
        yield chunk;
      }

      return; // Success
    } catch (error) {
      attempt++;
      console.error(`Stream attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        yield { type: 'error', error: 'Max retries exceeded' };
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

## Performance Optimization

### 1. Chunk Batching

Reduce network overhead by batching small chunks:

```typescript
async function* batchChunks(
  stream: AsyncIterable<any>,
  batchSize: number = 10,
  maxWaitMs: number = 100
) {
  let batch: any[] = [];
  let timer: NodeJS.Timeout | null = null;

  const flushBatch = () => {
    if (batch.length > 0) {
      const toFlush = [...batch];
      batch = [];
      return toFlush;
    }
    return null;
  };

  for await (const chunk of stream) {
    batch.push(chunk);

    if (batch.length >= batchSize) {
      if (timer) clearTimeout(timer);
      const flushed = flushBatch();
      if (flushed) yield flushed;
    } else if (!timer) {
      timer = setTimeout(() => {
        const flushed = flushBatch();
        if (flushed) return flushed;
      }, maxWaitMs);
    }
  }

  // Flush remaining
  const final = flushBatch();
  if (final) yield final;
}
```

### 2. Compression

Compress streamed data for bandwidth efficiency:

```typescript
import { createGzip } from 'zlib';
import { pipeline } from 'stream';

app.get('/api/agent/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Content-Encoding', 'gzip');

  const gzip = createGzip();
  pipeline(gzip, res, (err) => {
    if (err) console.error('Pipeline error:', err);
  });

  const stream = await agent.stream(input);

  for await (const chunk of stream) {
    gzip.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  gzip.end();
});
```

### 3. Backpressure Handling

Prevent overwhelming slow clients:

```typescript
async function streamWithBackpressure(
  stream: AsyncIterable<any>,
  canWrite: () => boolean,
  maxBufferSize: number = 100
) {
  const buffer: any[] = [];

  for await (const chunk of stream) {
    buffer.push(chunk);

    // Wait if buffer is full
    while (buffer.length >= maxBufferSize || !canWrite()) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Flush buffer
    while (buffer.length > 0 && canWrite()) {
      yield buffer.shift();
    }
  }

  // Flush remaining
  while (buffer.length > 0) {
    yield buffer.shift();
  }
}
```

## Best Practices

### 1. Always Set Timeouts

```typescript
async function streamWithTimeout(input: string, timeoutMs: number = 30000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Stream timeout')), timeoutMs);
  });

  const streamPromise = (async function* () {
    const stream = await agent.stream(input);
    for await (const chunk of stream) {
      yield chunk;
    }
  })();

  return Promise.race([streamPromise, timeoutPromise]);
}
```

### 2. Provide Progress Feedback

```typescript
const stream = await agent.stream(input);

let lastUpdate = Date.now();
const updateInterval = 1000; // Update every second

for await (const chunk of stream) {
  const now = Date.now();

  if (now - lastUpdate >= updateInterval) {
    console.log('⏳ Still processing...');
    lastUpdate = now;
  }

  processChunk(chunk);
}
```

### 3. Clean Up Resources

```typescript
const controller = new AbortController();

try {
  const stream = await agent.stream(input, {
    signal: controller.signal
  });

  for await (const chunk of stream) {
    processChunk(chunk);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Stream cancelled');
  }
} finally {
  // Clean up
  controller.abort();
}
```

## Testing Streaming

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Agent Streaming', () => {
  it('should stream chunks progressively', async () => {
    const chunks: any[] = [];
    const stream = await agent.stream(input);

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('type');
  });

  it('should handle stream errors gracefully', async () => {
    const stream = await agent.stream(invalidInput);

    await expect(async () => {
      for await (const chunk of stream) {
        // Should throw
      }
    }).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('SSE Endpoint', () => {
  it('should stream events to client', (done) => {
    const chunks: any[] = [];

    request(app)
      .get('/api/agent/stream?q=test')
      .set('Accept', 'text/event-stream')
      .buffer(false)
      .parse((res, callback) => {
        res.on('data', (chunk) => {
          const data = chunk.toString();
          if (data.includes('data:')) {
            chunks.push(data);
          }
        });
        res.on('end', () => callback(null, chunks));
      })
      .end((err, res) => {
        expect(chunks.length).toBeGreaterThan(0);
        done();
      });
  });
});
```

## Next Steps

- [Resource Management](/guide/advanced/resources) - Memory and token optimization
- [Monitoring](/guide/advanced/monitoring) - Track streaming performance
- [Deployment](/guide/advanced/deployment) - Production streaming setup
- [Core API Reference](/api/core) - Core streaming utilities

## Further Reading

- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [LangChain Streaming](https://js.langchain.com/docs/expression_language/streaming)


