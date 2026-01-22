# Monitoring & Observability

Learn how to monitor agent performance, track metrics, debug issues, and gain visibility into agent behavior in production.

## Overview

Effective monitoring enables you to:
- **Track performance** - Measure latency, throughput, and success rates
- **Debug issues** - Identify and diagnose problems quickly
- **Optimize costs** - Monitor token usage and API costs
- **Ensure reliability** - Detect and respond to failures
- **Improve quality** - Analyze agent behavior and outputs

## Core Metrics

### 1. Performance Metrics

Track execution time and throughput:

```typescript
import { createReActAgent } from '@agentforge/patterns';

class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  
  record(metric: string, value: number) {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push(value);
  }
  
  getStats(metric: string) {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

const metrics = new MetricsCollector();

// Measure agent execution time
const startTime = Date.now();
const result = await agent.invoke(input);
const duration = Date.now() - startTime;

metrics.record('agent.duration', duration);
metrics.record('agent.success', 1);

console.log('Performance stats:', metrics.getStats('agent.duration'));
```

### 2. Token Usage Metrics

Track token consumption and costs:

```typescript
class TokenMetrics {
  private totalTokens = 0;
  private totalCost = 0;
  private requestCount = 0;
  
  record(usage: { promptTokens: number; completionTokens: number }, model: string) {
    const total = usage.promptTokens + usage.completionTokens;
    this.totalTokens += total;
    this.requestCount++;
    
    // Calculate cost
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };
    
    const cost = 
      (usage.promptTokens / 1000) * pricing[model].input +
      (usage.completionTokens / 1000) * pricing[model].output;
    
    this.totalCost += cost;
  }
  
  getStats() {
    return {
      totalTokens: this.totalTokens,
      totalCost: this.totalCost.toFixed(4),
      requestCount: this.requestCount,
      avgTokensPerRequest: Math.round(this.totalTokens / this.requestCount),
      avgCostPerRequest: (this.totalCost / this.requestCount).toFixed(4)
    };
  }
}

const tokenMetrics = new TokenMetrics();

const result = await agent.invoke(input, {
  callbacks: [{
    handleLLMEnd: (output) => {
      tokenMetrics.record(output.llmOutput?.tokenUsage, 'gpt-4');
    }
  }]
});

console.log('Token stats:', tokenMetrics.getStats());
```

### 3. Error Metrics

Track failures and error rates:

```typescript
class ErrorMetrics {
  private errors: Map<string, number> = new Map();
  private totalRequests = 0;
  
  recordSuccess() {
    this.totalRequests++;
  }
  
  recordError(errorType: string) {
    this.totalRequests++;
    this.errors.set(errorType, (this.errors.get(errorType) || 0) + 1);
  }
  
  getStats() {
    const totalErrors = Array.from(this.errors.values()).reduce((a, b) => a + b, 0);
    const errorRate = this.totalRequests > 0 ? (totalErrors / this.totalRequests) * 100 : 0;
    
    return {
      totalRequests: this.totalRequests,
      totalErrors,
      errorRate: errorRate.toFixed(2) + '%',
      errorsByType: Object.fromEntries(this.errors)
    };
  }
}

const errorMetrics = new ErrorMetrics();

try {
  const result = await agent.invoke(input);
  errorMetrics.recordSuccess();
} catch (error) {
  errorMetrics.recordError(error.name);
  throw error;
}
```

## Logging

### Built-in Structured Logging

AgentForge provides a built-in structured logger for observability:

```typescript
import { createLogger, LogLevel } from '@agentforge/core';

// Create logger with environment-based log level
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('agent', { level: logLevel });

// Log agent execution
const startTime = Date.now();

logger.info('Agent invocation started', {
  agentType: 'ReActAgent',
  input: input.messages[0].content
});

const result = await agent.invoke(input, {
  callbacks: [{
    handleLLMStart: (llm, prompts) => {
      logger.debug('LLM call started', {
        model: llm.modelName,
        promptLength: prompts[0].length
      });
    },
    handleLLMEnd: (output) => {
      logger.info('LLM call completed', {
        tokens: output.llmOutput?.tokenUsage,
        duration: output.llmOutput?.estimatedDuration
      });
    },
    handleToolStart: (tool, input) => {
      logger.debug('Tool execution started', {
        tool: tool.name,
        input
      });
    },
    handleToolEnd: (output) => {
      logger.debug('Tool execution completed', {
        outputLength: JSON.stringify(output).length
      });
    },
    handleLLMError: (error) => {
      logger.error('LLM error', {
        error: error.message,
        stack: error.stack
      });
    }
  }]
});

logger.info('Agent invocation completed', {
  success: true,
  duration: Date.now() - startTime
});
```

**Environment Configuration:**

```bash
# Development - show all logs including debug
LOG_LEVEL=debug

# Production - show info, warnings, and errors
LOG_LEVEL=info

# Production - errors only
LOG_LEVEL=error
```

### Log Levels

AgentForge supports four log levels (from most to least verbose):

```typescript
// DEBUG: Detailed execution flow, tool calls, internal state
logger.debug('Tool selected', { tool: toolName, reasoning });
logger.debug('State transition', { from: 'planning', to: 'execution' });

// INFO: Important events, completions, milestones
logger.info('Agent task completed', { duration, tokens });
logger.info('Checkpoint saved', { threadId, checkpoint });

// WARN: Degraded performance, retries, approaching limits
logger.warn('Token limit approaching', { usage: tokenUsage, limit: 4000 });
logger.warn('Retry attempt', { attempt: 2, maxAttempts: 3 });

// ERROR: System errors, failures, exceptions
logger.error('Agent execution failed', {
  error: error.message,
  stack: error.stack
});
```

**Log Level Priority:**
- `DEBUG` (0) - Shows all logs
- `INFO` (1) - Shows info, warn, and error
- `WARN` (2) - Shows warn and error
- `ERROR` (3) - Shows error only

### Alternative: Winston

For advanced logging needs (file rotation, remote logging), use Winston:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Tracing

### Distributed Tracing

Track requests across services:

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

// Setup tracing
const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new BatchSpanProcessor(new JaegerExporter())
);
provider.register();

const tracer = trace.getTracer('agentforge');

// Trace agent execution
async function tracedAgentInvoke(input: any) {
  const span = tracer.startSpan('agent.invoke');
  
  try {
    span.setAttribute('agent.type', 'ReActAgent');
    span.setAttribute('input.length', input.messages[0].content.length);
    
    const result = await agent.invoke(input, {
      callbacks: [{
        handleLLMStart: () => {
          const llmSpan = tracer.startSpan('llm.call', { parent: span });
          llmSpan.end();
        },
        handleToolStart: (tool) => {
          const toolSpan = tracer.startSpan('tool.execute', { parent: span });
          toolSpan.setAttribute('tool.name', tool.name);
          toolSpan.end();
        }
      }]
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### LangSmith Integration

Use LangSmith for comprehensive tracing:

```typescript
import { Client } from 'langsmith';

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY
});

const result = await agent.invoke(input, {
  callbacks: [{
    handleChainStart: (chain, inputs, runId) => {
      client.createRun({
        id: runId,
        name: chain.name,
        run_type: 'chain',
        inputs
      });
    },
    handleChainEnd: (outputs, runId) => {
      client.updateRun(runId, {
        outputs,
        end_time: Date.now()
      });
    }
  }]
});
```

## Metrics Exporters

### Prometheus Integration

Export metrics to Prometheus:

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Define metrics
const agentInvocations = new Counter({
  name: 'agent_invocations_total',
  help: 'Total number of agent invocations',
  labelNames: ['agent_type', 'status']
});

const agentDuration = new Histogram({
  name: 'agent_duration_seconds',
  help: 'Agent execution duration',
  labelNames: ['agent_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

const tokenUsage = new Counter({
  name: 'agent_tokens_total',
  help: 'Total tokens used',
  labelNames: ['agent_type', 'model']
});

const activeAgents = new Gauge({
  name: 'agent_active_count',
  help: 'Number of currently active agents'
});

// Instrument agent
async function monitoredAgentInvoke(input: any) {
  activeAgents.inc();
  const startTime = Date.now();

  try {
    const result = await agent.invoke(input, {
      callbacks: [{
        handleLLMEnd: (output) => {
          tokenUsage.inc({
            agent_type: 'ReActAgent',
            model: 'gpt-4'
          }, output.llmOutput?.tokenUsage?.totalTokens || 0);
        }
      }]
    });

    agentInvocations.inc({ agent_type: 'ReActAgent', status: 'success' });
    return result;
  } catch (error) {
    agentInvocations.inc({ agent_type: 'ReActAgent', status: 'error' });
    throw error;
  } finally {
    const duration = (Date.now() - startTime) / 1000;
    agentDuration.observe({ agent_type: 'ReActAgent' }, duration);
    activeAgents.dec();
  }
}

// Expose metrics endpoint
import express from 'express';
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(9090);
```

### DataDog Integration

Send metrics to DataDog:

```typescript
import { StatsD } from 'node-dogstatsd';

const dogstatsd = new StatsD();

async function datadogMonitoredInvoke(input: any) {
  const startTime = Date.now();

  try {
    const result = await agent.invoke(input, {
      callbacks: [{
        handleLLMEnd: (output) => {
          dogstatsd.increment('agent.llm.calls', 1, ['model:gpt-4']);
          dogstatsd.histogram('agent.llm.tokens',
            output.llmOutput?.tokenUsage?.totalTokens || 0,
            ['model:gpt-4']
          );
        },
        handleToolStart: (tool) => {
          dogstatsd.increment('agent.tool.calls', 1, [`tool:${tool.name}`]);
        }
      }]
    });

    dogstatsd.increment('agent.invocations', 1, ['status:success']);
    return result;
  } catch (error) {
    dogstatsd.increment('agent.invocations', 1, ['status:error']);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    dogstatsd.histogram('agent.duration', duration, ['agent:react']);
  }
}
```

## Dashboards

### Grafana Dashboard

Create a comprehensive monitoring dashboard:

```json
{
  "dashboard": {
    "title": "AgentForge Monitoring",
    "panels": [
      {
        "title": "Agent Invocations",
        "targets": [{
          "expr": "rate(agent_invocations_total[5m])"
        }]
      },
      {
        "title": "Success Rate",
        "targets": [{
          "expr": "rate(agent_invocations_total{status=\"success\"}[5m]) / rate(agent_invocations_total[5m])"
        }]
      },
      {
        "title": "P95 Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, agent_duration_seconds_bucket)"
        }]
      },
      {
        "title": "Token Usage",
        "targets": [{
          "expr": "rate(agent_tokens_total[5m])"
        }]
      },
      {
        "title": "Active Agents",
        "targets": [{
          "expr": "agent_active_count"
        }]
      }
    ]
  }
}
```

### Custom Dashboard

Build a real-time dashboard:

```typescript
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const server = require('http').createServer(app);
const io = new Server(server);

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

// Emit metrics to connected clients
setInterval(() => {
  io.emit('metrics', {
    timestamp: Date.now(),
    performance: metrics.getStats('agent.duration'),
    tokens: tokenMetrics.getStats(),
    errors: errorMetrics.getStats()
  });
}, 1000);

server.listen(3000);
```

```html
<!-- dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Agent Dashboard</title>
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>AgentForge Dashboard</h1>

  <div>
    <h2>Performance</h2>
    <canvas id="performanceChart"></canvas>
  </div>

  <div>
    <h2>Token Usage</h2>
    <canvas id="tokenChart"></canvas>
  </div>

  <script>
    const socket = io();

    socket.on('metrics', (data) => {
      updateCharts(data);
    });

    function updateCharts(data) {
      // Update performance chart
      // Update token chart
      // Update error chart
    }
  </script>
</body>
</html>
```

## Alerting

### Alert Rules

Define alert conditions:

```typescript
class AlertManager {
  private rules: Array<{
    name: string;
    condition: (metrics: any) => boolean;
    action: (metrics: any) => void;
  }> = [];

  addRule(name: string, condition: (metrics: any) => boolean, action: (metrics: any) => void) {
    this.rules.push({ name, condition, action });
  }

  check(metrics: any) {
    for (const rule of this.rules) {
      if (rule.condition(metrics)) {
        console.log(`🚨 Alert triggered: ${rule.name}`);
        rule.action(metrics);
      }
    }
  }
}

const alertManager = new AlertManager();

// High error rate alert
alertManager.addRule(
  'High Error Rate',
  (metrics) => parseFloat(metrics.errorRate) > 5,
  (metrics) => {
    sendSlackAlert(`Error rate is ${metrics.errorRate}`);
  }
);

// High latency alert
alertManager.addRule(
  'High Latency',
  (metrics) => metrics.p95 > 10000,
  (metrics) => {
    sendSlackAlert(`P95 latency is ${metrics.p95}ms`);
  }
);

// High token usage alert
alertManager.addRule(
  'High Token Usage',
  (metrics) => metrics.totalTokens > 100000,
  (metrics) => {
    sendSlackAlert(`Token usage: ${metrics.totalTokens}`);
  }
);

// Check alerts periodically
setInterval(() => {
  alertManager.check({
    errorRate: errorMetrics.getStats().errorRate,
    p95: metrics.getStats('agent.duration')?.p95,
    totalTokens: tokenMetrics.getStats().totalTokens
  });
}, 60000);
```

### Notification Channels

Send alerts to various channels:

```typescript
import { WebClient } from '@slack/web-api';
import nodemailer from 'nodemailer';

// Slack notifications
const slack = new WebClient(process.env.SLACK_TOKEN);

async function sendSlackAlert(message: string) {
  await slack.chat.postMessage({
    channel: '#alerts',
    text: `🚨 AgentForge Alert: ${message}`
  });
}

// Email notifications
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailAlert(subject: string, message: string) {
  await transporter.sendMail({
    from: 'alerts@agentforge.com',
    to: 'team@company.com',
    subject: `[AgentForge] ${subject}`,
    text: message
  });
}

// PagerDuty integration
import { event } from '@pagerduty/pdjs';

async function sendPagerDutyAlert(severity: string, message: string) {
  await event({
    data: {
      routing_key: process.env.PAGERDUTY_KEY,
      event_action: 'trigger',
      payload: {
        summary: message,
        severity,
        source: 'agentforge'
      }
    }
  });
}
```

## Debugging Tools

### Agent Execution Visualizer

Visualize agent execution flow:

```typescript
class ExecutionVisualizer {
  private steps: Array<{
    type: string;
    timestamp: number;
    data: any;
  }> = [];

  recordStep(type: string, data: any) {
    this.steps.push({
      type,
      timestamp: Date.now(),
      data
    });
  }

  generateMermaidDiagram(): string {
    let diagram = 'graph TD\n';

    this.steps.forEach((step, i) => {
      const nodeId = `step${i}`;
      const label = `${step.type}: ${JSON.stringify(step.data).substring(0, 30)}`;
      diagram += `  ${nodeId}[${label}]\n`;

      if (i > 0) {
        diagram += `  step${i-1} --> ${nodeId}\n`;
      }
    });

    return diagram;
  }

  generateTimeline(): string {
    const startTime = this.steps[0]?.timestamp || Date.now();

    return this.steps.map((step, i) => {
      const elapsed = step.timestamp - startTime;
      return `${elapsed}ms: ${step.type} - ${JSON.stringify(step.data)}`;
    }).join('\n');
  }
}

const visualizer = new ExecutionVisualizer();

const result = await agent.invoke(input, {
  callbacks: [{
    handleLLMStart: () => visualizer.recordStep('LLM Start', {}),
    handleLLMEnd: (output) => visualizer.recordStep('LLM End', { tokens: output.llmOutput?.tokenUsage }),
    handleToolStart: (tool, input) => visualizer.recordStep('Tool Start', { tool: tool.name, input }),
    handleToolEnd: (output) => visualizer.recordStep('Tool End', { output })
  }]
});

console.log('Execution Timeline:');
console.log(visualizer.generateTimeline());

console.log('\nExecution Diagram:');
console.log(visualizer.generateMermaidDiagram());
```

### Performance Profiler

Profile agent performance:

```typescript
class PerformanceProfiler {
  private profiles: Map<string, { count: number; totalTime: number; samples: number[] }> = new Map();

  async profile<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      return await fn();
    } finally {
      const duration = Date.now() - startTime;

      if (!this.profiles.has(name)) {
        this.profiles.set(name, { count: 0, totalTime: 0, samples: [] });
      }

      const profile = this.profiles.get(name)!;
      profile.count++;
      profile.totalTime += duration;
      profile.samples.push(duration);
    }
  }

  getReport() {
    const report: any = {};

    for (const [name, profile] of this.profiles.entries()) {
      const sorted = [...profile.samples].sort((a, b) => a - b);
      report[name] = {
        calls: profile.count,
        totalTime: profile.totalTime,
        avgTime: profile.totalTime / profile.count,
        minTime: sorted[0],
        maxTime: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)]
      };
    }

    return report;
  }
}

const profiler = new PerformanceProfiler();

// Profile different operations
await profiler.profile('agent.invoke', async () => {
  return await agent.invoke(input);
});

await profiler.profile('tool.webScraper', async () => {
  return await webScraper.invoke({ url: 'https://example.com' });
});

console.log('Performance Report:');
console.log(JSON.stringify(profiler.getReport(), null, 2));
```

## Best Practices

### 1. Monitor Key Metrics

Always track these essential metrics:
- Request rate and throughput
- Latency (p50, p95, p99)
- Error rate and types
- Token usage and costs
- Resource utilization

### 2. Set Up Alerts

Configure alerts for critical conditions:
- Error rate > 5%
- P95 latency > 10s
- Token usage > budget
- Memory usage > 80%

### 3. Use Structured Logging

Always use structured, searchable logs:
```typescript
logger.info('event', { key: 'value', timestamp: Date.now() });
```

### 4. Implement Distributed Tracing

Track requests across services for complex systems.

### 5. Create Dashboards

Build real-time dashboards for visibility.

## Next Steps

- [Deployment](/guide/advanced/deployment) - Production deployment
- [Resource Management](/guide/advanced/resources) - Optimize resources
- [Streaming](/guide/advanced/streaming) - Real-time monitoring
- [Core API Reference](/api/core) - Core monitoring utilities

## Further Reading

- [OpenTelemetry](https://opentelemetry.io/) - Observability framework
- [Prometheus](https://prometheus.io/) - Metrics and alerting
- [Grafana](https://grafana.com/) - Visualization and dashboards
- [LangSmith](https://docs.smith.langchain.com/) - LLM tracing


