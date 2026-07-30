# Express.js Integration Example

An Express.js REST API integration example with AgentForge, featuring rate limiting, security headers, streaming, and conversation management.

> **Demo security boundary:** The chat routes require an `X-Demo-User-Id` header and scope conversation history to that value. This header is only an example ownership boundary, not authentication; replace it with an identity established by verified application authentication before exposing the API to users.

## Features

- **RESTful API**: Clean, well-structured API endpoints
- **Security**: Helmet, CORS, rate limiting
- **Chat API**: Conversation management with history
- **Streaming**: Server-Sent Events (SSE) for real-time responses
- **Performance**: Singleton agent pattern for efficiency
- **Monitoring**: Request logging and health checks
- **Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error handling

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

## Installation

```bash
# From the repository root
pnpm install
```

## Configuration

Create a `.env` file in the repository root:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional
PORT=3000  # Optional
CORS_ORIGIN=http://localhost:3000  # Optional; one exact trusted browser origin
JSON_BODY_LIMIT=100kb  # Optional; increase only for a documented payload need
URLENCODED_BODY_LIMIT=100kb  # Optional; increase only for a documented payload need
NODE_ENV=development  # Optional
```

The example defaults to `http://localhost:3000` for CORS and sends credentials only
for that explicitly configured origin. Set `CORS_ORIGIN` to the exact frontend
origin used by the deployment; origins outside that value are not granted CORS
access. For local development only, `CORS_ORIGIN=*` enables wildcard access and
disables credentials. This example does not provide authentication or authorization.

JSON and URL-encoded request bodies are limited to 100 KB by default. Set
`JSON_BODY_LIMIT` and/or `URLENCODED_BODY_LIMIT` to a larger value only when the
application has a documented need, and keep the values bounded in production.

## Usage

Start the server:

```bash
# Development mode with hot reload
pnpm tsx --watch examples/integrations/express-api/src/server.ts

# Production mode
pnpm tsx examples/integrations/express-api/src/server.ts
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-07T10:00:00.000Z",
  "uptime": 123.456,
  "memory": {...},
  "environment": "development"
}
```

### Agent Invocation

```bash
POST /api/agent/invoke
Content-Type: application/json

{
  "message": "What is 25 * 4?",
  "threadId": "optional-thread-id",
  "config": {
    "temperature": 0.7
  }
}
```

Response:

```json
{
  "success": true,
  "response": "25 * 4 = 100",
  "threadId": "thread-123",
  "metadata": {
    "duration": 1234,
    "messageCount": 3,
    "model": "gpt-4"
  }
}
```

### Agent Streaming

```bash
POST /api/agent/stream
Content-Type: application/json

{
  "message": "Tell me a story"
}
```

Returns Server-Sent Events stream:

```
data: {"content":"Once"}
data: {"content":"Once upon"}
data: {"content":"Once upon a time"}
data: [DONE]
```

### Agent Info

```bash
GET /api/agent/info
```

Response:

```json
{
  "name": "ReAct Agent",
  "model": "gpt-4",
  "tools": ["calculator", "currentDateTime"],
  "maxIterations": 10,
  "capabilities": [...]
}
```

### Chat Message

```bash
POST /api/chat/message
Content-Type: application/json

{
  "conversationId": "conv-123",
  "message": "Hello!"
}
```

Include the demo owner header with every chat request:

```http
X-Demo-User-Id: user-123
```

Conversation IDs are scoped to that owner. History, deletion, and conversation listing do not authorize access based on the caller-provided conversation ID alone; production applications must replace the demo header with a verified identity from their authentication layer.

Response:

```json
{
  "success": true,
  "conversationId": "conv-123",
  "message": "Hello! How can I help you?",
  "messageCount": 2
}
```

### Get Chat History

```bash
GET /api/chat/history/:conversationId
```

### Clear Chat History

```bash
DELETE /api/chat/history/:conversationId
```

### List Conversations

```bash
GET /api/chat/conversations
```

## Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Invoke agent
curl -X POST http://localhost:3000/api/agent/invoke \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 10 + 5?"}'

# Stream response
curl -X POST http://localhost:3000/api/agent/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Count to 5"}' \
  --no-buffer

# Chat
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## Testing with JavaScript

```javascript
// Invoke agent
const response = await fetch('http://localhost:3000/api/agent/invoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'What is 25 * 4?' }),
});
const data = await response.json();
console.log(data.response);

// Stream response
const streamResponse = await fetch('http://localhost:3000/api/agent/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Tell me a story' }),
});

const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      console.log(JSON.parse(data).content);
    }
  }
}
```

## Production Deployment

### Environment Variables

```bash
NODE_ENV=production
OPENAI_API_KEY=your-key
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### PM2

```bash
pm2 start dist/server.js --name agentforge-api
```

## Security Best Practices

1. **API Keys**: Use environment variables, never commit keys
2. **Rate Limiting**: Adjust limits based on your needs
3. **CORS**: Set specific origins in production
4. **Helmet**: Enabled by default for security headers
5. **Input Validation**: All inputs validated with Zod
6. **Error Handling**: Errors logged but not exposed in production

## Performance Optimization

1. **Agent Singleton**: Agent initialized once and reused
2. **Connection Pooling**: Reuse HTTP connections
3. **Caching**: Cache responses for repeated queries
4. **Compression**: Enable gzip compression
5. **Load Balancing**: Use multiple instances with PM2 or Docker

## Learn More

- [AgentForge Documentation](../../../docs-site/)
- [Express.js Documentation](https://expressjs.com/)
- [API Best Practices](https://restfulapi.net/)

## License

MIT
