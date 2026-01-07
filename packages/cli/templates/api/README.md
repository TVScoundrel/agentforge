# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

A REST API service powered by AgentForge agents.

## Features

- ✅ Express.js REST API
- ✅ ReAct agent integration
- ✅ Health check endpoint
- ✅ CORS support
- ✅ Error handling
- ✅ Request logging
- ✅ Environment configuration

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

### Installation

```bash
pnpm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your-api-key-here
PORT=3000
```

### Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T12:00:00.000Z",
  "uptime": 123.456
}
```

### Chat with Agent
```bash
POST /api/agent/chat
Content-Type: application/json

{
  "message": "Hello, how can you help me?"
}
```

Response:
```json
{
  "success": true,
  "response": "I'm an AI assistant. I can help you with..."
}
```

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── server.ts             # Express server setup
│   └── routes/
│       ├── agent.ts          # Agent API routes
│       └── health.ts         # Health check routes
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Adding Routes

Create a new route file in `src/routes/`:

```typescript
import { Router } from 'express';

const router = Router();

router.get('/my-endpoint', async (req, res) => {
  // Handle request
  res.json({ message: 'Success' });
});

export { router as myRouter };
```

Then register it in `src/server.ts`:

```typescript
import { myRouter } from './routes/my-route.js';
app.use('/api/my-route', myRouter);
```

## Deployment

See the [deployment guides](../../templates/deployment/) for deploying to:
- AWS Lambda (serverless)
- Google Cloud Run
- Azure Container Apps
- Docker + Kubernetes

## Learn More

- [AgentForge Documentation](../../docs/)
- [Express.js Documentation](https://expressjs.com/)
- [API Best Practices](../../docs/guides/api-best-practices.md)

## License

MIT

