/**
 * Example: Tool Lifecycle Management
 *
 * Demonstrates managed tools with:
 * - Resource initialization and cleanup
 * - Connection pooling
 * - Health checks
 * - Automatic resource management
 */

import { createManagedTool } from '../../src/tools/lifecycle.js';

// Simulated database pool
class DatabasePool {
  private connections: any[] = [];
  private maxConnections = 5;

  async connect() {
    console.log('  📡 Creating database connection...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    const connection = {
      id: Math.random().toString(36).substring(7),
      query: async (sql: string) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { rows: [{ result: `Result for: ${sql}` }] };
      },
      release: () => {
        console.log(`  🔓 Released connection ${connection.id}`);
      },
    };
    this.connections.push(connection);
    return connection;
  }

  async end() {
    console.log('  🔌 Closing all database connections...');
    this.connections = [];
  }

  getStats() {
    return {
      activeConnections: this.connections.length,
      maxConnections: this.maxConnections,
    };
  }
}

async function main() {
  console.log('=== Tool Lifecycle Management Example ===\n');

  // Example 1: Database tool with connection pooling
  console.log('1. Database tool with connection pooling:');

  const dbTool = createManagedTool({
    name: 'database-query',
    description: 'Query the database',

    // Initialize resources
    async initialize() {
      console.log('🚀 Initializing database tool...');
      this.context = await new DatabasePool();
      console.log('✅ Database pool created\n');
    },

    // Execute with resources
    async execute(input: { query: string }) {
      const pool = this.context as DatabasePool;
      const connection = await pool.connect();
      try {
        console.log(`  🔍 Executing query: ${input.query}`);
        const result = await connection.query(input.query);
        return result;
      } finally {
        connection.release();
      }
    },

    // Cleanup resources
    async cleanup() {
      console.log('🧹 Cleaning up database tool...');
      const pool = this.context as DatabasePool;
      await pool.end();
      console.log('✅ Database pool closed\n');
    },

    // Health check
    async healthCheck() {
      const pool = this.context as DatabasePool;
      try {
        const connection = await pool.connect();
        await connection.query('SELECT 1');
        connection.release();
        return { healthy: true, metadata: pool.getStats() };
      } catch (error) {
        return { healthy: false, error: (error as Error).message };
      }
    },

    // Enable periodic health checks every 5 seconds
    healthCheckInterval: 5000,
  });

  // Initialize the tool
  await dbTool.initialize();

  // Execute queries
  console.log('Executing queries:');
  const result1 = await dbTool.invoke({ query: 'SELECT * FROM users' });
  console.log('Result 1:', result1);
  console.log();

  const result2 = await dbTool.invoke({ query: 'SELECT * FROM posts' });
  console.log('Result 2:', result2);
  console.log();

  // Check health
  console.log('2. Health check:');
  const health = await dbTool.healthCheck();
  console.log('Health status:', health);
  console.log();

  // Get statistics
  console.log('3. Tool statistics:');
  const stats = dbTool.getStats();
  console.log('Initialized:', stats.initialized);
  console.log('Total executions:', stats.totalExecutions);
  console.log('Successful:', stats.successfulExecutions);
  console.log('Failed:', stats.failedExecutions);
  console.log('Last execution time:', stats.lastExecutionTime, 'ms');
  console.log();

  // Example 2: API client tool
  console.log('4. API client tool:');

  const apiTool = createManagedTool({
    name: 'api-client',
    description: 'Call external API',

    async initialize() {
      console.log('🚀 Initializing API client...');
      this.context = {
        baseURL: 'https://api.example.com',
        headers: { 'Authorization': 'Bearer token' },
      };
      console.log('✅ API client ready\n');
    },

    async execute(input: { endpoint: string }) {
      console.log(`  📞 Calling API: ${this.context.baseURL}${input.endpoint}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { data: `Response from ${input.endpoint}` };
    },

    async cleanup() {
      console.log('🧹 Cleaning up API client...');
      this.context = null;
      console.log('✅ API client closed\n');
    },
  });

  await apiTool.initialize();
  const apiResult = await apiTool.invoke({ endpoint: '/users/123' });
  console.log('API result:', apiResult);
  console.log();

  // Cleanup all tools
  console.log('5. Cleanup:');
  await dbTool.cleanup();
  await apiTool.cleanup();

  console.log('✨ All tools cleaned up successfully!');
}

main().catch(console.error);

