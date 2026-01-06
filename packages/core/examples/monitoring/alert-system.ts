/**
 * Alert System Example
 *
 * Demonstrates:
 * - Multi-channel alerting (email, Slack, webhook)
 * - Rule-based alert triggering
 * - Alert throttling/suppression
 * - Severity levels
 * - Metric-based monitoring
 */

import { createAlertManager } from '../../src/monitoring/alerts.js';

// Simulated metrics
let errorCount = 0;
let requestCount = 0;
let responseTime = 0;

function simulateTraffic() {
  requestCount++;
  responseTime = 100 + Math.random() * 400;

  // Simulate occasional errors
  if (Math.random() < 0.15) {
    errorCount++;
  }
}

function getMetrics() {
  const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
  return {
    errorRate,
    errorCount,
    requestCount,
    p95ResponseTime: responseTime,
    avgResponseTime: responseTime * 0.8,
  };
}

async function main() {
  console.log('=== Alert System Example ===\n');

  // Example 1: Create alert manager with multiple channels
  console.log('1. Creating Alert Manager with Multiple Channels');
  const alertManager = createAlertManager({
    channels: {
      email: {
        type: 'email',
        config: {
          from: 'alerts@agentforge.ai',
          to: ['team@agentforge.ai', 'oncall@agentforge.ai'],
          smtp: {
            host: 'smtp.example.com',
            port: 587,
          },
        },
      },
      slack: {
        type: 'slack',
        config: {
          webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
          channel: '#alerts',
        },
      },
      webhook: {
        type: 'webhook',
        config: {
          url: 'https://api.example.com/alerts',
          headers: {
            'Authorization': 'Bearer secret-token',
            'Content-Type': 'application/json',
          },
        },
      },
      pagerduty: {
        type: 'pagerduty',
        config: {
          integrationKey: 'your-integration-key',
        },
      },
    },
    rules: [
      {
        name: 'high-error-rate',
        condition: (metrics) => metrics.errorRate > 0.1,
        severity: 'critical',
        channels: ['email', 'slack', 'pagerduty'],
        throttle: 300000, // 5 minutes
        message: 'Error rate exceeded 10%',
      },
      {
        name: 'elevated-error-rate',
        condition: (metrics) => metrics.errorRate > 0.05,
        severity: 'warning',
        channels: ['slack'],
        throttle: 600000, // 10 minutes
        message: 'Error rate exceeded 5%',
      },
      {
        name: 'slow-response',
        condition: (metrics) => metrics.p95ResponseTime > 5000,
        severity: 'warning',
        channels: ['slack'],
        throttle: 600000,
        message: 'P95 response time exceeded 5 seconds',
      },
      {
        name: 'very-slow-response',
        condition: (metrics) => metrics.p95ResponseTime > 10000,
        severity: 'error',
        channels: ['email', 'slack'],
        throttle: 300000,
        message: 'P95 response time exceeded 10 seconds',
      },
    ],
    onAlert: (alert) => {
      console.log(`\n🚨 ALERT TRIGGERED!`);
      console.log(`Name: ${alert.name}`);
      console.log(`Severity: ${alert.severity.toUpperCase()}`);
      console.log(`Message: ${alert.message}`);
      console.log(`Timestamp: ${new Date(alert.timestamp!).toISOString()}`);
      if (alert.data) {
        console.log(`Data:`, JSON.stringify(alert.data, null, 2));
      }
    },
  });

  console.log('✅ Alert manager created with 4 channels and 4 rules\n');

  // Example 2: Manual alert triggering
  console.log('2. Manual Alert Triggering');
  await alertManager.alert({
    name: 'deployment-started',
    severity: 'info',
    message: 'Deployment to production started',
    data: {
      version: 'v1.2.3',
      deployer: 'john@example.com',
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Example 3: Metric-based monitoring
  console.log('\n3. Metric-Based Monitoring');
  console.log('Starting metric monitoring (checking every 5 seconds)...\n');

  alertManager.start(getMetrics, 5000);

  // Simulate traffic and trigger alerts
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate traffic
    for (let j = 0; j < 10; j++) {
      simulateTraffic();
    }

    const metrics = getMetrics();
    console.log(`\n--- Iteration ${i + 1} ---`);
    console.log(`Requests: ${metrics.requestCount}`);
    console.log(`Errors: ${metrics.errorCount}`);
    console.log(`Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    console.log(`P95 Response Time: ${metrics.p95ResponseTime.toFixed(2)}ms`);

    // Manually check rules (automatic checking happens every 5 seconds)
    if (metrics.errorRate > 0.1) {
      console.log('⚠️  High error rate detected!');
    } else if (metrics.errorRate > 0.05) {
      console.log('⚠️  Elevated error rate detected');
    }
  }

  // Example 4: Alert throttling demonstration
  console.log('\n\n4. Alert Throttling Demonstration');
  console.log('Triggering the same alert multiple times...\n');

  for (let i = 0; i < 5; i++) {
    await alertManager.alert({
      name: 'high-error-rate',
      severity: 'critical',
      message: 'Error rate exceeded 10%',
      data: { errorRate: 0.15 },
    });

    console.log(`Attempt ${i + 1}: Alert sent`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n(Note: Only the first alert should be sent due to throttling)');

  // Example 5: Different severity levels
  console.log('\n\n5. Different Severity Levels');

  const severities: Array<'info' | 'warning' | 'error' | 'critical'> = ['info', 'warning', 'error', 'critical'];

  for (const severity of severities) {
    await alertManager.alert({
      name: `test-${severity}`,
      severity,
      message: `This is a ${severity} level alert`,
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Cleanup
  alertManager.stop();
  console.log('\n✅ Alert manager stopped');
}

main().catch(console.error);

