import { createConnectionPool, type ConnectionPool, type HealthCheckConfig, type PoolConfig } from '../../../src/resources/index.js';

export interface MockConnection {
  id: number;
}

export interface MockPoolContext {
  pool: ConnectionPool<MockConnection>;
  created: MockConnection[];
  destroyed: MockConnection[];
}

async function waitForMinimumConnections(
  pool: ConnectionPool<MockConnection>,
  min: number
): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt++) {
    if (pool.getStats().size >= min) {
      return;
    }

    await Promise.resolve();
  }
}

export async function createMockPool(options: {
  pool?: PoolConfig;
  healthCheck?: HealthCheckConfig;
  validator?: (connection: MockConnection) => Promise<boolean>;
} = {}): Promise<MockPoolContext> {
  let nextId = 1;
  const created: MockConnection[] = [];
  const destroyed: MockConnection[] = [];

  const pool = createConnectionPool<MockConnection>({
    factory: async () => {
      const connection = { id: nextId++ };
      created.push(connection);
      return connection;
    },
    destroyer: async (connection) => {
      destroyed.push(connection);
    },
    validator: options.validator,
    pool: options.pool,
    healthCheck: options.healthCheck,
  });

  const min = options.pool?.min || 0;
  if (min > 0) {
    await waitForMinimumConnections(pool, min);
  }

  return { pool, created, destroyed };
}
