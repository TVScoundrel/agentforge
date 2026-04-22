import type { SQL } from 'drizzle-orm';

import type { DatabaseVendor } from '../types.js';
import {
  executeSqliteQuery,
  normalizeMySqlResult,
  type SqliteQueryAdapter,
} from './query-execution.js';

export interface SessionExecutionContext {
  vendor: DatabaseVendor;
  client: unknown;
  db: unknown;
  isSqliteNonQueryError(error: unknown): boolean;
}

export async function executeInDedicatedConnection<T>(
  context: SessionExecutionContext,
  callback: (execute: (query: SQL) => Promise<unknown>) => Promise<T>
): Promise<T> {
  if (context.vendor === 'sqlite') {
    return callback((query) =>
      executeSqliteQuery(
        context.db as SqliteQueryAdapter,
        query,
        context.isSqliteNonQueryError
      )
    );
  }

  if (context.vendor === 'postgresql') {
    const poolClient = await (context.client as {
      connect(): Promise<{ release(): void }>;
    }).connect();

    try {
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const sessionDb = drizzle({ client: poolClient } as never);
      return await callback((query) => sessionDb.execute(query));
    } finally {
      poolClient.release();
    }
  }

  if (context.vendor === 'mysql') {
    const mysqlConnection = await (context.client as {
      getConnection(): Promise<{ release(): void }>;
    }).getConnection();

    try {
      const { drizzle } = await import('drizzle-orm/mysql2');
      const sessionDb = drizzle({ client: mysqlConnection } as never);
      return await callback(async (query) =>
        normalizeMySqlResult(await sessionDb.execute(query))
      );
    } finally {
      mysqlConnection.release();
    }
  }

  throw new Error(`Unsupported database vendor: ${context.vendor}`);
}
