/**
 * Example: Connection Pooling
 *
 * Demonstrates database and HTTP connection pooling with:
 * - Pool size management (min/max)
 * - Connection health checks
 * - Automatic eviction
 * - Graceful shutdown
 * - Pool statistics
 */

import { createDatabasePool, createHttpPool } from '../../src/resources/index.js';

async function main() {
  console.log('=== Connection Pooling Example ===\n');

  // Example 1: Database connection pool
  console.log('1. Database Connection Pool:');
  const dbPool = createDatabasePool({
    config: {
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      user: 'admin',
      password: 'secret',
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeout: 30000,
      idleTimeout: 60000,
      evictionInterval: 30000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      query: 'SELECT 1',
    },
    onConnect: (conn) => console.log('  ✓ Database connection created'),
    onDisconnect: (conn) => console.log('  ✗ Database connection destroyed'),
  });

  // Use the pool
  console.log('\n  Executing queries...');
  const result1 = await dbPool.query('SELECT * FROM users WHERE id = $1', [1]);
  console.log('  Query 1 completed');

  const result2 = await dbPool.query('SELECT * FROM posts WHERE user_id = $1', [1]);
  console.log('  Query 2 completed');

  // Get pool statistics
  const dbStats = dbPool.getStats();
  console.log('\n  Pool Statistics:');
  console.log(`    Total connections: ${dbStats.size}`);
  console.log(`    Available: ${dbStats.available}`);
  console.log(`    In use: ${dbStats.acquired}`);
  console.log(`    Created: ${dbStats.created}`);
  console.log(`    Destroyed: ${dbStats.destroyed}`);
  console.log(`    Health checks passed: ${dbStats.healthChecksPassed}`);
  console.log(`    Health checks failed: ${dbStats.healthChecksFailed}`);

  // Cleanup
  console.log('\n  Draining pool...');
  await dbPool.drain();
  await dbPool.clear();
  console.log('  Pool cleared');
  console.log();

  // Example 2: HTTP client pool
  console.log('2. HTTP Client Pool:');
  const httpPool = createHttpPool({
    config: {
      baseURL: 'https://api.example.com',
      timeout: 10000,
      headers: {
        'User-Agent': 'AgentForge/1.0',
      },
    },
    pool: {
      min: 1,
      max: 5,
      maxSockets: 50,
      keepAlive: true,
      keepAliveMsecs: 1000,
    },
    healthCheck: {
      enabled: true,
      interval: 60000,
      endpoint: '/health',
      method: 'GET',
    },
    onConnect: (client) => console.log('  ✓ HTTP client created'),
    onDisconnect: (client) => console.log('  ✗ HTTP client destroyed'),
  });

  // Use the pool
  console.log('\n  Making HTTP requests...');
  const response1 = await httpPool.request({
    url: '/users/1',
    method: 'GET',
  });
  console.log('  Request 1 completed:', response1.status);

  const response2 = await httpPool.request({
    url: '/posts',
    method: 'POST',
    data: { title: 'New Post', content: 'Hello World' },
  });
  console.log('  Request 2 completed:', response2.status);

  // Get pool statistics
  const httpStats = httpPool.getStats();
  console.log('\n  Pool Statistics:');
  console.log(`    Total clients: ${httpStats.size}`);
  console.log(`    Available: ${httpStats.available}`);
  console.log(`    In use: ${httpStats.acquired}`);
  console.log(`    Created: ${httpStats.created}`);

  // Cleanup
  console.log('\n  Draining pool...');
  await httpPool.drain();
  await httpPool.clear();
  console.log('  Pool cleared');
  console.log();

  // Example 3: Manual connection management
  console.log('3. Manual Connection Management:');
  const manualPool = createDatabasePool({
    config: {
      host: 'localhost',
      database: 'myapp',
      user: 'admin',
      password: 'secret',
    },
    pool: {
      min: 1,
      max: 5,
    },
  });

  console.log('  Acquiring connection...');
  const conn = await manualPool.acquire();
  console.log('  Connection acquired');

  try {
    // Use the connection
    await conn.query('BEGIN');
    await conn.query('INSERT INTO logs (message) VALUES ($1)', ['Test log']);
    await conn.query('COMMIT');
    console.log('  Transaction completed');
  } catch (error) {
    await conn.query('ROLLBACK');
    console.error('  Transaction failed:', error);
  } finally {
    // Always release the connection
    await manualPool.release(conn);
    console.log('  Connection released');
  }

  // Cleanup
  await manualPool.drain();
  await manualPool.clear();

  console.log('\n✨ All examples completed!');
}

main().catch(console.error);

