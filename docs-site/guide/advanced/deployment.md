# Deployment Strategies

Learn how to deploy AgentForge applications to production with best practices for scalability, reliability, and security.

## Overview

Production deployment requires:
- **Scalability** - Handle varying loads efficiently
- **Reliability** - Ensure high availability and fault tolerance
- **Security** - Protect API keys and sensitive data
- **Performance** - Optimize for low latency and high throughput
- **Observability** - Monitor and debug production issues

## Deployment Architectures

### 1. Serverless Deployment

Deploy agents as serverless functions:

```typescript
// Vercel Edge Function
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

export const config = {
  runtime: 'edge'
};

const agent = createReActAgent({
  llm: new ChatOpenAI({
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }),
  tools: [webSearch, calculator]
});

export default async function handler(req: Request) {
  const { query } = await req.json();
  
  try {
    const result = await agent.invoke({
      messages: [{ role: 'user', content: query }]
    });
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

**Pros:**
- Auto-scaling
- Pay per use
- No infrastructure management
- Global distribution

**Cons:**
- Cold starts
- Execution time limits
- Limited memory
- Stateless

### 2. Container Deployment

Deploy with Docker and Kubernetes:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]
```

```yaml
# kubernetes.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentforge-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentforge-api
  template:
    metadata:
      labels:
        app: agentforge-api
    spec:
      containers:
      - name: api
        image: agentforge-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: agentforge-api
spec:
  selector:
    app: agentforge-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentforge-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentforge-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Pros:**
- Full control
- Stateful support
- No execution limits
- Custom scaling

**Cons:**
- Infrastructure management
- Higher baseline cost
- More complex setup

### 3. Hybrid Deployment

Combine serverless and containers:

```typescript
// API Gateway (Serverless)
export default async function handler(req: Request) {
  const { query, priority } = await req.json();
  
  if (priority === 'high') {
    // Route to dedicated container cluster
    return await fetch('https://agents.company.com/invoke', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  } else {
    // Handle in serverless function
    return await agent.invoke({ messages: [{ role: 'user', content: query }] });
  }
}
```

## Environment Configuration

### Environment Variables

Manage configuration securely:

```typescript
// config.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional(),
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MAX_CONCURRENT_AGENTS: z.coerce.number().default(10),
  TOKEN_BUDGET_PER_REQUEST: z.coerce.number().default(10000)
});

export const config = envSchema.parse(process.env);
```

```bash
# .env.production
NODE_ENV=production
OPENAI_API_KEY=sk-...
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://...
LOG_LEVEL=info
MAX_CONCURRENT_AGENTS=20
TOKEN_BUDGET_PER_REQUEST=15000
```

### Secrets Management

Use secure secret management:

```typescript
// AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  
  return response.SecretString!;
}

// Initialize with secrets
const openaiKey = await getSecret('openai-api-key');
const llm = new ChatOpenAI({ apiKey: openaiKey });
```

```typescript
// HashiCorp Vault
import vault from 'node-vault';

const vaultClient = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getVaultSecret(path: string): Promise<any> {
  const result = await vaultClient.read(path);
  return result.data;
}

const secrets = await getVaultSecret('secret/agentforge');
const llm = new ChatOpenAI({ apiKey: secrets.openai_key });
```

## Load Balancing

### Application Load Balancer

Distribute traffic across instances:

```typescript
// Express.js with clustering
import cluster from 'cluster';
import os from 'os';
import express from 'express';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();  // Replace dead worker
  });
} else {
  const app = express();
  
  app.post('/api/agent', async (req, res) => {
    const result = await agent.invoke(req.body);
    res.json(result);
  });
  
  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

### Queue-Based Load Balancing

Use message queues for async processing:

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Producer: Add jobs to queue
const agentQueue = new Queue('agent-tasks', { connection });

app.post('/api/agent/async', async (req, res) => {
  const job = await agentQueue.add('invoke', {
    query: req.body.query,
    userId: req.user.id
  });
  
  res.json({ jobId: job.id });
});

// Consumer: Process jobs
const worker = new Worker('agent-tasks', async (job) => {
  const result = await agent.invoke({
    messages: [{ role: 'user', content: job.data.query }]
  });
  
  return result;
}, { connection, concurrency: 5 });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
```

## Caching Layer

### Redis Caching

Implement distributed caching:

```typescript
import { Redis } from 'ioredis';

class DistributedCache {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get(key: string): Promise<any | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

const cache = new DistributedCache(process.env.REDIS_URL!);

// Cached agent endpoint
app.post('/api/agent', async (req, res) => {
  const cacheKey = `agent:${hashQuery(req.body.query)}`;

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  // Invoke agent
  const result = await agent.invoke(req.body);

  // Cache result
  await cache.set(cacheKey, result, 3600);

  res.json({ ...result, cached: false });
});
```

### CDN Integration

Cache responses at the edge:

```typescript
// Cloudflare Workers
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cache = caches.default;

    // Check cache
    let response = await cache.match(request);
    if (response) {
      return response;
    }

    // Invoke agent
    const { query } = await request.json();
    const result = await agent.invoke({ messages: [{ role: 'user', content: query }] });

    // Create cacheable response
    response = new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });

    // Store in cache
    await cache.put(request, response.clone());

    return response;
  }
};
```

## Database Integration

### PostgreSQL with Connection Pooling

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Store agent results
async function saveAgentResult(userId: string, query: string, result: any) {
  const client = await pool.connect();

  try {
    await client.query(
      'INSERT INTO agent_results (user_id, query, result, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, query, JSON.stringify(result)]
    );
  } finally {
    client.release();
  }
}

// Retrieve history
async function getAgentHistory(userId: string, limit: number = 10) {
  const result = await pool.query(
    'SELECT * FROM agent_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );

  return result.rows;
}
```

### MongoDB for Unstructured Data

```typescript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URL!);
await client.connect();

const db = client.db('agentforge');
const results = db.collection('agent_results');

// Create indexes
await results.createIndex({ userId: 1, createdAt: -1 });
await results.createIndex({ query: 'text' });

// Store result
async function saveResult(data: any) {
  await results.insertOne({
    ...data,
    createdAt: new Date()
  });
}

// Search results
async function searchResults(userId: string, searchQuery: string) {
  return await results.find({
    userId,
    $text: { $search: searchQuery }
  }).toArray();
}
```

## Health Checks

### Comprehensive Health Endpoint

```typescript
import express from 'express';

const app = express();

app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      llm: await checkLLM()
    }
  };

  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');

  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error' };
  }
}

async function checkRedis(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error' };
  }
}

async function checkLLM(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    await llm.invoke([{ role: 'user', content: 'test' }]);
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error' };
  }
}
```

### Readiness Probe

```typescript
app.get('/ready', async (req, res) => {
  // Check if application is ready to serve traffic
  const ready = {
    initialized: agentInitialized,
    database: await checkDatabase(),
    cache: await checkRedis()
  };

  const isReady = Object.values(ready).every(check =>
    typeof check === 'boolean' ? check : check.status === 'ok'
  );

  res.status(isReady ? 200 : 503).json(ready);
});
```

## Security

### API Authentication

```typescript
import jwt from 'jsonwebtoken';

// JWT middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/api/agent', authenticateToken, async (req, res) => {
  const result = await agent.invoke(req.body);
  res.json(result);
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Per-user rate limiting
const userLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: async (req) => {
    // Different limits based on user tier
    const user = await getUserTier(req.user.id);
    return user.tier === 'premium' ? 100 : 10;
  },
  keyGenerator: (req) => req.user.id
});

app.use('/api/agent', authenticateToken, userLimiter);
```

### Input Validation

```typescript
import { z } from 'zod';

const agentRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  options: z.object({
    maxTokens: z.number().min(100).max(10000).optional(),
    temperature: z.number().min(0).max(2).optional()
  }).optional()
});

app.post('/api/agent', async (req, res) => {
  try {
    const validated = agentRequestSchema.parse(req.body);
    const result = await agent.invoke({
      messages: [{ role: 'user', content: validated.query }]
    });
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});
```

## Error Handling

### Global Error Handler

```typescript
import { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Log to monitoring service
  logger.error('Request failed', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Send appropriate response
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'RateLimitError') {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Generic error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
};

app.use(errorHandler);
```

### Graceful Shutdown

```typescript
let server: any;

async function gracefulShutdown(signal: string) {
  console.log(`${signal} received, starting graceful shutdown`);

  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close database connections
  await pool.end();
  console.log('Database pool closed');

  // Close Redis connection
  await redis.quit();
  console.log('Redis connection closed');

  // Wait for ongoing requests to complete (max 30s)
  setTimeout(() => {
    console.log('Forcing shutdown');
    process.exit(0);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server = app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t agentforge-api:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push agentforge-api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/agentforge-api \
            api=agentforge-api:${{ github.sha }}
          kubectl rollout status deployment/agentforge-api
```

## Monitoring in Production

### Application Metrics

```typescript
import { register, collectDefaultMetrics } from 'prom-client';

// Collect default metrics
collectDefaultMetrics({ prefix: 'agentforge_' });

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Logging

```typescript
import winston from 'winston';
import { Logtail } from '@logtail/node';

const logtail = new Logtail(process.env.LOGTAIL_TOKEN!);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Stream({ stream: logtail })
  ]
});
```

## Best Practices

### 1. Use Environment-Specific Configurations

```typescript
const config = {
  development: {
    logLevel: 'debug',
    cacheEnabled: false,
    maxConcurrentAgents: 2
  },
  production: {
    logLevel: 'info',
    cacheEnabled: true,
    maxConcurrentAgents: 20
  }
}[process.env.NODE_ENV || 'development'];
```

### 2. Implement Circuit Breakers

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(agent.invoke, {
  timeout: 30000,  // 30 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

breaker.fallback(() => ({ error: 'Service temporarily unavailable' }));

app.post('/api/agent', async (req, res) => {
  const result = await breaker.fire(req.body);
  res.json(result);
});
```

### 3. Use Blue-Green Deployments

Deploy new versions without downtime:

```yaml
# Deploy green version
kubectl apply -f deployment-green.yaml

# Wait for green to be ready
kubectl wait --for=condition=available deployment/agentforge-api-green

# Switch traffic to green
kubectl patch service agentforge-api -p '{"spec":{"selector":{"version":"green"}}}'

# Remove blue version
kubectl delete deployment agentforge-api-blue
```

### 4. Implement Canary Releases

Gradually roll out new versions:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: agentforge-api
spec:
  hosts:
  - agentforge-api
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: agentforge-api
        subset: v2
  - route:
    - destination:
        host: agentforge-api
        subset: v1
      weight: 90
    - destination:
        host: agentforge-api
        subset: v2
      weight: 10
```

## Next Steps

- [Monitoring](/guide/advanced/monitoring) - Production monitoring
- [Resource Management](/guide/advanced/resources) - Optimize resources
- [Streaming](/guide/advanced/streaming) - Real-time deployment
- [Examples](/examples/deployment) - Deployment examples

## Further Reading

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [The Twelve-Factor App](https://12factor.net/)


