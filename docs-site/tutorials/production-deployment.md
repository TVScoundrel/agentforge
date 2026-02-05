# Production Deployment Tutorial

Learn how to deploy AgentForge applications to production with Docker, Kubernetes, and cloud platforms.

## Overview

This tutorial covers:

- **Environment Setup** - Configuration and secrets management
- **Docker Deployment** - Containerization and Docker Compose
- **Kubernetes Deployment** - Production-ready K8s manifests
- **Cloud Platforms** - AWS, GCP, and Azure deployment
- **Monitoring & Observability** - Health checks and metrics
- **CI/CD** - Automated deployment pipelines

## Prerequisites

- Completed [Your First Agent](/tutorials/first-agent)
- Basic Docker knowledge
- Access to a cloud platform (optional)
- Node.js 20+ installed

## Step 1: Prepare Your Application

### Project Structure

Ensure your project follows this structure:

```
my-agent/
├── src/
│   ├── index.ts          # Application entry point
│   ├── agent.ts          # Agent definition
│   └── tools/            # Custom tools
├── package.json
├── tsconfig.json
├── Dockerfile
└── .dockerignore
```

### Environment Configuration

Create environment-specific configuration:

```typescript
// src/config.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // LLM Configuration
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  
  // Database (optional)
  DATABASE_URL: z.string().optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  
  // Monitoring
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
});

export const config = envSchema.parse(process.env);
```

### Production-Ready Agent

Configure your agent for production:

```typescript
// src/agent.ts
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { production } from '@agentforge/core';
import { config } from './config';

// Create model with production settings
const model = new ChatOpenAI({
  modelName: config.OPENAI_MODEL,
  temperature: 0,
  maxRetries: 3,
  timeout: 30000,
});

// Create agent
const baseAgent = createReActAgent({
  model,
  tools: [...yourTools],
  maxIterations: 10,
});

// Apply production middleware to agent nodes
// Note: This wraps individual nodes, not the entire graph
export const agent = baseAgent;

// For wrapping individual nodes with production middleware:
// import { production } from '@agentforge/core';
// const enhancedNode = production(myNode, {
//   nodeName: 'my-node',
//   enableMetrics: true,
//   enableTracing: true,
//   enableRetry: true,
//   timeout: 30000,
//   retryOptions: {
//     maxAttempts: 3,
//     backoff: 'exponential',
//   },
//   timeout: {
//     timeout: 30000, // 30 seconds
//   },
//   logging: {
//     level: config.LOG_LEVEL,
//   },
//   metrics: {
//     enabled: true,
//   },
// });
```

### Health Check Endpoint

Add health checks for monitoring:

```typescript
// src/health.ts
import { createHealthChecker } from '@agentforge/core';

export const healthChecker = createHealthChecker({
  checks: {
    llm: async () => {
      // Test LLM connection
      await model.invoke('test');
      return { healthy: true, status: 'healthy' };
    },
    database: async () => {
      // Test database connection (if applicable)
      return { healthy: true, status: 'healthy' };
    },
  },
  timeout: 5000,
  onCheckFail: (name, error) => {
    console.error(`Health check ${name} failed:`, error);
  }
});

// Express.js example
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/ready', async (req, res) => {
  const health = await healthChecker.getHealth();
  res.status(health.healthy ? 200 : 503).json(health);
});
```

### Application Entry Point

```typescript
// src/index.ts
import express from 'express';
import { agent } from './agent';
import { healthChecker } from './health';
import { config } from './config';

const app = express();
app.use(express.json());

// Health endpoints
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/ready', async (req, res) => {
  const health = await healthChecker.check();
  res.status(health.healthy ? 200 : 503).json(health);
});

// Agent endpoint
app.post('/agent/invoke', async (req, res) => {
  try {
    const { input } = req.body;
    const result = await agent.invoke({ messages: [{ role: 'user', content: input }] });
    res.json({ result });
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = parseInt(config.PORT);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Step 2: Docker Deployment

### Create Dockerfile

Create a multi-stage Dockerfile for optimal image size:

```dockerfile
# Dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Set ownership
RUN chown -R nodejs:nodejs /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
```

### Create .dockerignore

```
# .dockerignore
node_modules
dist
.git
.env
.env.*
*.log
coverage
.vscode
.idea
README.md
```

### Docker Compose for Local Testing

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://user:password@postgres:5432/agentforge
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agentforge
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
  redis-data:
```

### Build and Run

```bash
# Build the image
docker build -t my-agent:latest .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Test the endpoint
curl -X POST http://localhost:3000/agent/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello, agent!"}'

# Stop services
docker-compose down
```

## Step 3: Kubernetes Deployment

### Create Kubernetes Manifests

Create a `k8s/` directory with the following files:

#### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-app
  labels:
    app: agent
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: agent
  template:
    metadata:
      labels:
        app: agent
    spec:
      containers:
      - name: app
        image: my-agent:latest
        ports:
        - name: http
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 10
```

#### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: agent-service
spec:
  type: LoadBalancer
  selector:
    app: agent
  ports:
  - port: 80
    targetPort: http
```

#### ConfigMap & Secret

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
data:
  log-level: "info"
```

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-secrets
type: Opaque
stringData:
  openai-api-key: "your-api-key-here"
```

### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods
kubectl get svc

# View logs
kubectl logs -f deployment/agent-app

# Test the service
kubectl port-forward svc/agent-service 8080:80
curl -X POST http://localhost:8080/agent/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello!"}'
```

## Step 4: CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/agent-app \
            app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.event.release.tag_name }}
          kubectl rollout status deployment/agent-app
```

## Step 5: Cloud Platform Deployment

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name my-agent

# Build and push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker build -t my-agent .
docker tag my-agent:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/my-agent:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/my-agent:latest

# Create ECS task definition and service (use AWS Console or CLI)
```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/my-agent

# Deploy to Cloud Run
gcloud run deploy my-agent \
  --image gcr.io/PROJECT_ID/my-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets OPENAI_API_KEY=openai-key:latest
```

### Azure Container Instances

```bash
# Create container registry
az acr create --resource-group myResourceGroup --name myregistry --sku Basic

# Build and push
az acr build --registry myregistry --image my-agent:latest .

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name my-agent \
  --image myregistry.azurecr.io/my-agent:latest \
  --cpu 1 --memory 1 \
  --registry-login-server myregistry.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --dns-name-label my-agent \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables OPENAI_API_KEY=<your-key>
```

## Step 6: Monitoring & Observability

### Add Prometheus Metrics

```typescript
// src/metrics.ts
// Use an external metrics library like prom-client for Prometheus metrics
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Track agent invocations
export const invocationsCounter = new Counter({
  name: 'agent_invocations_total',
  help: 'Total agent invocations',
  labelNames: ['environment', 'version']
});

export const durationHistogram = new Histogram({
  name: 'agent_duration_seconds',
  help: 'Agent execution duration',
  labelNames: ['environment', 'version']
});

export const activeRequestsGauge = new Gauge({
  name: 'agent_active_requests',
  help: 'Active requests',
  labelNames: ['environment', 'version']
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.contentType);
  res.end(await metrics.metrics());
});
```

### LangSmith Integration

```typescript
// src/config.ts
export const config = {
  // ... other config
  langsmith: {
    apiKey: process.env.LANGSMITH_API_KEY,
    project: process.env.LANGSMITH_PROJECT || 'production',
    tracingEnabled: process.env.NODE_ENV === 'production',
  },
};

// src/agent.ts
import { LangSmithTracer } from '@langchain/core/tracers/langsmith';

const tracer = new LangSmithTracer({
  projectName: config.langsmith.project,
  apiKey: config.langsmith.apiKey,
});

// Use with agent
const result = await agent.invoke(
  { messages: [...] },
  { callbacks: [tracer] }
);
```

## Best Practices

### 1. Environment Variables

```typescript
// ✅ Good - use environment variables
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Bad - hardcode secrets
const apiKey = 'sk-...';
```

### 2. Graceful Shutdown

```typescript
// Handle shutdown signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Close server
  server.close(() => {
    console.log('Server closed');
  });

  // Close database connections
  await db.close();

  // Exit
  process.exit(0);
});
```

### 3. Resource Limits

```yaml
# Always set resource limits
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 4. Health Checks

```typescript
// Implement both liveness and readiness probes
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/ready', async (req, res) => {
  const checks = await runHealthChecks();
  res.status(checks.healthy ? 200 : 503).json(checks);
});
```

## Troubleshooting

### Common Issues

**Issue: Container crashes on startup**
```bash
# Check logs
kubectl logs deployment/agent-app
docker logs <container-id>

# Common causes:
# - Missing environment variables
# - Invalid configuration
# - Port already in use
```

**Issue: High memory usage**
```typescript
// Monitor memory
const used = process.memoryUsage();
console.log('Memory usage:', {
  rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
});

// Increase memory limits if needed
```

**Issue: Slow response times**
```typescript
// Add request timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

## Next Steps

- [Monitoring Guide](/guide/advanced/monitoring) - Advanced monitoring setup
- [Testing Strategies](/tutorials/testing) - Test your deployment
- [Advanced Patterns](/tutorials/advanced-patterns) - Optimize your agents
- [Middleware Guide](/guide/concepts/middleware) - Production middleware

