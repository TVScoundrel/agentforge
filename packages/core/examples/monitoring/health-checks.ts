/**
 * Health Check System Example
 *
 * Demonstrates:
 * - Liveness and readiness probes
 * - Dependency health checks
 * - Periodic health monitoring
 * - Health status reporting
 * - Integration with Express endpoints
 */

import { createHealthChecker } from '../../src/monitoring';

// Simulated dependencies
const database = {
  async ping() {
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Database connection failed');
    }
    return true;
  },
};

const redis = {
  async ping() {
    if (Math.random() < 0.05) {
      throw new Error('Redis connection failed');
    }
    return true;
  },
};

const llmService = {
  async healthCheck() {
    if (Math.random() < 0.15) {
      throw new Error('LLM service unavailable');
    }
    return { status: 'ok', latency: Math.random() * 100 };
  },
};

async function main() {
  console.log('=== Health Check System Example ===\n');

  // Create health checker with multiple dependency checks
  const healthChecker = createHealthChecker({
    checks: {
      database: async () => {
        try {
          await database.ping();
          return {
            healthy: true,
            status: 'healthy',
            message: 'Database connection is healthy',
          };
        } catch (error) {
          return {
            healthy: false,
            status: 'unhealthy',
            error: (error as Error).message,
          };
        }
      },
      redis: async () => {
        try {
          await redis.ping();
          return {
            healthy: true,
            status: 'healthy',
            message: 'Redis connection is healthy',
          };
        } catch (error) {
          return {
            healthy: false,
            status: 'unhealthy',
            error: (error as Error).message,
          };
        }
      },
      llm: async () => {
        try {
          const result = await llmService.healthCheck();
          return {
            healthy: true,
            status: 'healthy',
            message: 'LLM service is healthy',
            metadata: { latency: result.latency },
          };
        } catch (error) {
          return {
            healthy: false,
            status: 'unhealthy',
            error: (error as Error).message,
          };
        }
      },
    },
    timeout: 5000,
    interval: 10000, // Check every 10 seconds
    onHealthChange: (health) => {
      console.log('\n🔔 Health status changed!');
      console.log(`Overall status: ${health.status}`);
      console.log(`Healthy: ${health.healthy}`);
    },
    onCheckFail: (name, error) => {
      console.log(`\n⚠️  Health check failed: ${name}`);
      console.log(`Error: ${error.message}`);
    },
  });

  // Example 1: Liveness probe
  console.log('1. Liveness Probe (is the app running?)');
  const liveness = await healthChecker.getLiveness();
  console.log('Liveness:', liveness);

  // Example 2: Initial health check
  console.log('\n2. Initial Health Check');
  const initialHealth = await healthChecker.getHealth();
  console.log('Health Report:', JSON.stringify(initialHealth, null, 2));

  // Example 3: Start periodic health checks
  console.log('\n3. Starting Periodic Health Checks (every 10 seconds)');
  healthChecker.start();

  // Example 4: Simulate health checks over time
  console.log('\n4. Monitoring Health Over Time...\n');

  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const health = await healthChecker.getHealth();
    console.log(`\n--- Check ${i + 1} ---`);
    console.log(`Overall: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Status: ${health.status}`);
    console.log(`Uptime: ${Math.floor(health.uptime / 1000)}s`);

    // Show individual check results
    for (const [name, result] of Object.entries(health.checks)) {
      const icon = result.healthy ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`  ${icon} ${name}: ${result.healthy ? 'healthy' : result.error} ${duration}`);
    }
  }

  // Example 5: Readiness probe
  console.log('\n5. Readiness Probe (is the app ready to serve traffic?)');
  const readiness = await healthChecker.getReadiness();
  console.log(`Ready: ${readiness.healthy ? 'Yes ✅' : 'No ❌'}`);
  console.log(`Status: ${readiness.status}`);

  // Example 6: Express endpoint integration (simulated)
  console.log('\n6. Express Endpoint Integration (simulated)');
  console.log('GET /health');
  const healthEndpoint = await healthChecker.getHealth();
  const statusCode = healthEndpoint.healthy ? 200 : 503;
  console.log(`Response: ${statusCode}`, JSON.stringify(healthEndpoint, null, 2));

  console.log('\nGET /health/live');
  const liveEndpoint = await healthChecker.getLiveness();
  console.log('Response: 200', JSON.stringify(liveEndpoint, null, 2));

  console.log('\nGET /health/ready');
  const readyEndpoint = await healthChecker.getReadiness();
  const readyStatusCode = readyEndpoint.healthy ? 200 : 503;
  console.log(`Response: ${readyStatusCode}`, JSON.stringify(readyEndpoint, null, 2));

  // Cleanup
  healthChecker.stop();
  console.log('\n✅ Health checker stopped');
}

main().catch(console.error);

