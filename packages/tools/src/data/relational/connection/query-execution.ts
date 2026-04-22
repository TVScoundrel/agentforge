import type { SQL } from 'drizzle-orm';
import type { JsonValue } from '@agentforge/core';

import type { DatabaseVendor } from '../types.js';

export interface SqliteQueryAdapter {
  all(query: SQL): unknown;
  run(query: SQL): { changes?: number; lastInsertRowid?: number };
}

export interface QueryExecutionLogger {
  debug(message: string, metadata?: JsonValue): void;
}

export interface QueryExecutionContext {
  vendor: DatabaseVendor;
  db: unknown;
  isSqliteNonQueryError(error: unknown): boolean;
}

export async function executeQuery(
  context: QueryExecutionContext,
  query: SQL,
  logger: QueryExecutionLogger
): Promise<unknown> {
  logger.debug('Executing SQL query', {
    vendor: context.vendor,
  });

  if (context.vendor === 'sqlite') {
    return executeSqliteQuery(
      context.db as SqliteQueryAdapter,
      query,
      context.isSqliteNonQueryError
    );
  }

  if (context.vendor === 'mysql') {
    return normalizeMySqlResult(
      await (context.db as { execute(query: SQL): Promise<unknown> }).execute(query)
    );
  }

  return (context.db as { execute(query: SQL): Promise<unknown> }).execute(query);
}

export async function executeSqliteQuery(
  db: SqliteQueryAdapter,
  query: SQL,
  isSqliteNonQueryError: (error: unknown) => boolean
): Promise<unknown> {
  try {
    return db.all(query);
  } catch (error: unknown) {
    if (isSqliteNonQueryError(error)) {
      const runResult = db.run(query);
      return { ...runResult, affectedRows: runResult.changes ?? 0 };
    }

    throw error;
  }
}

export function normalizeMySqlResult(raw: unknown): unknown {
  if (Array.isArray(raw) && raw.length === 2) {
    return raw[0];
  }

  return raw;
}
