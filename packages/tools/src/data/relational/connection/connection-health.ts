import { sql, type SQL } from 'drizzle-orm';
import type { DatabaseVendor } from '../types.js';
import type { ConnectionPoolMetrics, LoggerLike } from './connection-manager-runtime-types.js';

export function isSqliteNonQueryError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const isSqliteOrTypeError =
    error.constructor?.name === 'SqliteError' ||
    error.name === 'SqliteError' ||
    error instanceof TypeError;
  const hasNonQueryMessage = error.message.includes('does not return data');
  return isSqliteOrTypeError && hasNonQueryMessage;
}

export async function checkConnectionHealth(
  args: {
    vendor: DatabaseVendor;
    db: unknown;
    client: unknown;
    execute(query: SQL): Promise<unknown>;
  },
  logger: LoggerLike
): Promise<boolean> {
  if (!args.db || !args.client) {
    logger.debug('Health check failed: connection not initialized', { vendor: args.vendor });
    return false;
  }

  try {
    await args.execute(sql`SELECT 1`);
    logger.debug('Health check passed', { vendor: args.vendor });
    return true;
  } catch (error) {
    logger.debug('Health check failed', {
      vendor: args.vendor,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export function getConnectionPoolMetrics(
  vendor: DatabaseVendor,
  client: unknown
): ConnectionPoolMetrics {
  if (!client) {
    return { totalCount: 0, activeCount: 0, idleCount: 0, waitingCount: 0 };
  }

  if (vendor === 'postgresql') {
    const pgClient = client as {
      totalCount?: number;
      idleCount?: number;
      waitingCount?: number;
    };
    const totalCount = pgClient.totalCount || 0;
    const idleCount = pgClient.idleCount || 0;
    const waitingCount = pgClient.waitingCount || 0;
    const activeCount = Math.max(totalCount - idleCount, 0);

    return {
      totalCount,
      activeCount,
      idleCount,
      waitingCount,
    };
  }

  if (vendor === 'mysql') {
    return {
      totalCount: 0,
      activeCount: 0,
      idleCount: 0,
      waitingCount: 0,
    };
  }

  const sqliteClient = client as { open?: boolean };
  const totalCount = sqliteClient.open ? 1 : 0;

  return {
    totalCount,
    activeCount: totalCount,
    idleCount: 0,
    waitingCount: 0,
  };
}
