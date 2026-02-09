# Production Monitoring Examples

This directory contains examples demonstrating production monitoring and observability features in AgentForge, including health checks, performance profiling, alerting, and audit logging.

## Examples

### 1. Health Checks (`health-checks.ts`)

Demonstrates comprehensive health monitoring:

- **Liveness probes** - Check if the application is running
- **Readiness probes** - Check if the app is ready to serve traffic
- **Dependency checks** - Monitor database, Redis, LLM services
- **Periodic monitoring** - Automatic health checks at intervals
- **Health reporting** - Detailed health status reports
- **Express integration** - Health check endpoints for Kubernetes

**Run:**
```bash
npx tsx examples/monitoring/health-checks.ts
```

**Key Features:**
- Multiple dependency health checks
- Configurable timeout and intervals
- Health change notifications
- Liveness and readiness endpoints
- Uptime tracking

### 2. Performance Profiling (`performance-profiling.ts`)

Demonstrates execution and memory profiling:

- **Execution time tracking** - Profile function execution times
- **Memory profiling** - Track memory usage during execution
- **Statistical analysis** - P50, P95, P99 percentiles
- **Sampling support** - Profile a percentage of requests
- **Promise wrapping** - Profile async operations
- **Bottleneck detection** - Identify performance bottlenecks

**Run:**
```bash
npx tsx examples/monitoring/performance-profiling.ts
```

**Key Features:**
- Function profiling with decorators
- Memory usage tracking
- Statistical analysis
- Sample-based profiling
- Profile report export

### 3. Alert System (`alert-system.ts`)

Demonstrates multi-channel alerting:

- **Multiple channels** - Email, Slack, webhook, PagerDuty
- **Rule-based alerts** - Trigger alerts based on metrics
- **Alert throttling** - Prevent alert spam
- **Severity levels** - Info, warning, error, critical
- **Metric monitoring** - Automatic metric-based alerting
- **Manual alerts** - Trigger custom alerts

**Run:**
```bash
npx tsx examples/monitoring/alert-system.ts
```

**Key Features:**
- Multi-channel alert delivery
- Configurable alert rules
- Alert throttling/suppression
- Severity-based routing
- Metric-based monitoring

### 4. Audit Logging (`audit-logging.ts`)

Demonstrates compliance and action tracking:

- **Action logging** - Track all user actions
- **User tracking** - Associate actions with users
- **Query capabilities** - Search and filter logs
- **Log retention** - Automatic cleanup of old logs
- **Export functionality** - Export to JSON/CSV
- **Compliance** - Meet regulatory requirements

**Run:**
```bash
npx tsx examples/monitoring/audit-logging.ts
```

**Key Features:**
- Comprehensive action logging
- Flexible querying
- Date range filtering
- Pagination support
- Export to multiple formats

## Common Patterns

### Pattern 1: Health Check Endpoints

```typescript
import { createHealthChecker } from '@agentforge/core';
import express from 'express';

const healthChecker = createHealthChecker({
  checks: {
    database: async () => {
      await db.ping();
      return { healthy: true };
    },
    redis: async () => {
      await redis.ping();
      return { healthy: true };
    },
  },
  timeout: 5000,
  interval: 30000,
});

healthChecker.start();

const app = express();

// Kubernetes liveness probe
app.get('/health/live', async (req, res) => {
  const liveness = await healthChecker.getLiveness();
  res.status(200).json(liveness);
});

// Kubernetes readiness probe
app.get('/health/ready', async (req, res) => {
  const readiness = await healthChecker.getReadiness();
  res.status(readiness.healthy ? 200 : 503).json(readiness);
});
```

### Pattern 2: Performance Profiling

```typescript
import { createProfiler } from '@agentforge/core';

const profiler = createProfiler({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // Profile 10% of requests
  includeMemory: true,
});

// Profile a function
const processRequest = profiler.profile('processRequest', async (req) => {
  // Your logic here
  return result;
});

// Get profiling report
setInterval(() => {
  const report = profiler.getReport();
  console.log('Performance Report:', report);
}, 60000);
```

### Pattern 3: Alert Configuration

```typescript
import { createAlertManager } from '@agentforge/core';

const alertManager = createAlertManager({
  channels: {
    slack: {
      type: 'slack',
      config: { webhookUrl: process.env.SLACK_WEBHOOK },
    },
    pagerduty: {
      type: 'pagerduty',
      config: { integrationKey: process.env.PAGERDUTY_KEY },
    },
  },
  rules: [
    {
      name: 'high-error-rate',
      condition: (metrics) => metrics.errorRate > 0.05,
      severity: 'critical',
      channels: ['slack', 'pagerduty'],
      throttle: 300000, // 5 minutes
    },
  ],
});

alertManager.start(() => getMetrics(), 60000);
```

### Pattern 4: Audit Logging

```typescript
import { createAuditLogger } from '@agentforge/core';

const auditLogger = createAuditLogger({
  storage: { type: 'database', config: { /* DB config */ } },
  retention: { days: 90, autoCleanup: true },
});

// Log user actions
app.use(async (req, res, next) => {
  await auditLogger.log({
    userId: req.user.id,
    action: `${req.method} ${req.path}`,
    resource: req.path,
    metadata: {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  next();
});

// Query logs
const logs = await auditLogger.query({
  userId: 'user-123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
});
```

## Next Steps

- Explore the [deployment examples](../deployment/) for infrastructure setup
- Check the [resource examples](../resources/) for optimization features
- See the [API documentation](../../src/monitoring/) for detailed reference

## Related Documentation

- [Phase 5.4 Design Document](../../../docs/phase-5-design.md#phase-54-production-monitoring--observability)
- [Monitoring Overview](../../src/monitoring/README.md)
- [Production Best Practices](../../../docs/production-guide.md)

