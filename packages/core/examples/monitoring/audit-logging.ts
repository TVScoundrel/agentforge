/**
 * Audit Logging Example
 *
 * Demonstrates:
 * - Action logging for compliance
 * - User and resource tracking
 * - Query capabilities
 * - Log retention and cleanup
 * - Export to JSON/CSV
 */

import { createAuditLogger } from '../../src/monitoring';

// Simulated user actions
const users = ['user-123', 'user-456', 'user-789'];
const actions = ['agent.invoke', 'agent.stream', 'tool.execute', 'data.access', 'config.update'];
const resources = ['research-agent', 'chat-agent', 'web-search', 'database', 'settings'];

async function simulateUserAction() {
  const userId = users[Math.floor(Math.random() * users.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const resource = resources[Math.floor(Math.random() * resources.length)];

  return {
    userId,
    action,
    resource,
    input: { query: 'sample query', params: { limit: 10 } },
    output: { result: 'success', items: 5 },
    metadata: {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      duration: Math.random() * 1000,
    },
  };
}

async function main() {
  console.log('=== Audit Logging Example ===\n');

  // Example 1: Create audit logger with retention
  console.log('1. Creating Audit Logger with Retention Policy');
  const auditLogger = createAuditLogger({
    storage: {
      type: 'memory', // In production, use 'database' or 'file'
      config: {},
    },
    retention: {
      days: 90,
      autoCleanup: true,
    },
    fields: {
      userId: true,
      action: true,
      resource: true,
      timestamp: true,
      ip: true,
      userAgent: true,
      input: true,
      output: true,
    },
    onLog: (entry) => {
      console.log(`📝 Logged: ${entry.action} by ${entry.userId} on ${entry.resource}`);
    },
  });

  console.log('✅ Audit logger created with 90-day retention\n');

  // Example 2: Log various actions
  console.log('2. Logging User Actions');

  await auditLogger.log({
    userId: 'user-123',
    action: 'agent.invoke',
    resource: 'research-agent',
    input: { query: 'What is machine learning?' },
    output: { result: 'Machine learning is...' },
    metadata: {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    },
  });

  await auditLogger.log({
    userId: 'user-456',
    action: 'tool.execute',
    resource: 'web-search',
    input: { query: 'latest AI news' },
    output: { results: 10 },
    metadata: {
      ip: '192.168.1.101',
      userAgent: 'Chrome/120.0',
    },
  });

  await auditLogger.log({
    userId: 'user-123',
    action: 'config.update',
    resource: 'settings',
    input: { setting: 'theme', value: 'dark' },
    output: { success: true },
    metadata: {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    },
  });

  // Example 3: Log failed actions
  console.log('\n3. Logging Failed Actions');

  await auditLogger.log({
    userId: 'user-789',
    action: 'data.access',
    resource: 'database',
    input: { table: 'sensitive_data' },
    success: false,
    error: 'Access denied: insufficient permissions',
    metadata: {
      ip: '192.168.1.102',
      userAgent: 'Safari/17.0',
    },
  });

  // Example 4: Generate more logs for querying
  console.log('\n4. Generating Sample Logs...');

  for (let i = 0; i < 20; i++) {
    const action = await simulateUserAction();
    await auditLogger.log(action);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('✅ Generated 20 sample logs\n');

  // Example 5: Query logs by user
  console.log('5. Querying Logs by User');

  const userLogs = await auditLogger.query({
    userId: 'user-123',
  });

  console.log(`Found ${userLogs.length} logs for user-123:`);
  userLogs.slice(0, 3).forEach((log) => {
    console.log(`  - ${log.action} on ${log.resource} at ${new Date(log.timestamp!).toISOString()}`);
  });

  // Example 6: Query logs by action
  console.log('\n6. Querying Logs by Action');

  const actionLogs = await auditLogger.query({
    action: 'agent.invoke',
  });

  console.log(`Found ${actionLogs.length} 'agent.invoke' actions:`);
  actionLogs.slice(0, 3).forEach((log) => {
    console.log(`  - User ${log.userId} on ${log.resource}`);
  });

  // Example 7: Query logs by date range
  console.log('\n7. Querying Logs by Date Range');

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentLogs = await auditLogger.query({
    startDate: oneHourAgo,
    endDate: now,
  });

  console.log(`Found ${recentLogs.length} logs in the last hour`);

  // Example 8: Query with pagination
  console.log('\n8. Querying with Pagination');

  const page1 = await auditLogger.query({
    limit: 5,
    offset: 0,
  });

  const page2 = await auditLogger.query({
    limit: 5,
    offset: 5,
  });

  console.log(`Page 1: ${page1.length} logs`);
  console.log(`Page 2: ${page2.length} logs`);

  // Example 9: Complex query
  console.log('\n9. Complex Query (user + action + date range)');

  const complexQuery = await auditLogger.query({
    userId: 'user-123',
    action: 'agent.invoke',
    startDate: oneHourAgo,
    limit: 10,
  });

  console.log(`Found ${complexQuery.length} matching logs`);

  // Example 10: Export logs
  console.log('\n10. Exporting Logs');

  console.log('\nExporting to JSON:');
  await auditLogger.export('./audit-logs.json', {
    format: 'json',
    startDate: oneHourAgo,
    endDate: now,
  });

  console.log('\nExporting to CSV:');
  await auditLogger.export('./audit-logs.csv', {
    format: 'csv',
    startDate: oneHourAgo,
    endDate: now,
  });

  // Cleanup
  auditLogger.stop();
  console.log('\n✅ Audit logger stopped');
}

main().catch(console.error);

