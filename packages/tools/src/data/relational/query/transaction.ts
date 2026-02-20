/**
 * Transaction helpers for relational databases.
 * @module query/transaction
 */

import { createLogger } from '@agentforge/core';
import { sql, type SQL } from 'drizzle-orm';
import type { ConnectionManager } from '../connection/connection-manager.js';
import type { DatabaseVendor } from '../types.js';
import type { SqlExecutor } from './types.js';

const logger = createLogger('agentforge:tools:data:relational:transaction');

let transactionSequence = 0;

export type TransactionIsolationLevel =
  | 'read uncommitted'
  | 'read committed'
  | 'repeatable read'
  | 'serializable';

export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeoutMs?: number;
}

interface ResolvedTransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeoutMs?: number;
}

export interface TransactionContext extends SqlExecutor {
  id: string;
  vendor: DatabaseVendor;
  isActive(): boolean;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  createSavepoint(name?: string): Promise<string>;
  rollbackToSavepoint(name: string): Promise<void>;
  releaseSavepoint(name: string): Promise<void>;
  withSavepoint<T>(operation: (transaction: TransactionContext) => Promise<T>, name?: string): Promise<T>;
}

function toSqlIsolationLevel(level: TransactionIsolationLevel): string {
  switch (level) {
    case 'read uncommitted':
      return 'READ UNCOMMITTED';
    case 'read committed':
      return 'READ COMMITTED';
    case 'repeatable read':
      return 'REPEATABLE READ';
    case 'serializable':
      return 'SERIALIZABLE';
  }
}

function resolveOptions(options?: TransactionOptions): ResolvedTransactionOptions {
  if (!options) {
    return {};
  }

  if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    throw new Error('Transaction timeout must be a positive number');
  }

  return {
    isolationLevel: options.isolationLevel,
    timeoutMs: options.timeoutMs,
  };
}

function withTimeout<T>(operation: Promise<T>, timeoutMs?: number): Promise<T> {
  if (!timeoutMs) {
    return operation;
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Transaction timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

class ManagedTransaction implements TransactionContext {
  public readonly id: string;
  public readonly vendor: DatabaseVendor;
  private readonly options: ResolvedTransactionOptions;
  private readonly executeQuery: (query: SQL) => Promise<unknown>;
  private completed = false;
  private savepointCounter = 0;

  constructor(args: {
    id: string;
    vendor: DatabaseVendor;
    executeQuery: (query: SQL) => Promise<unknown>;
    options: ResolvedTransactionOptions;
  }) {
    this.id = args.id;
    this.vendor = args.vendor;
    this.executeQuery = args.executeQuery;
    this.options = args.options;
  }

  isActive(): boolean {
    return !this.completed;
  }

  async execute(query: SQL): Promise<unknown> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    return this.executeQuery(query);
  }

  async begin(): Promise<void> {
    await this.executeQuery(sql.raw('BEGIN'));
    await this.applyIsolationLevel();
  }

  async commit(): Promise<void> {
    if (!this.isActive()) {
      return;
    }

    await this.executeQuery(sql.raw('COMMIT'));
    this.completed = true;
  }

  async rollback(): Promise<void> {
    if (!this.isActive()) {
      return;
    }

    await this.executeQuery(sql.raw('ROLLBACK'));
    this.completed = true;
  }

  async createSavepoint(name?: string): Promise<string> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = name ?? `sp_${++this.savepointCounter}`;
    await this.executeQuery(sql.raw(`SAVEPOINT ${savepointName}`));
    return savepointName;
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    await this.executeQuery(sql.raw(`ROLLBACK TO SAVEPOINT ${name}`));
  }

  async releaseSavepoint(name: string): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    await this.executeQuery(sql.raw(`RELEASE SAVEPOINT ${name}`));
  }

  async withSavepoint<T>(
    operation: (transaction: TransactionContext) => Promise<T>,
    name?: string
  ): Promise<T> {
    const savepointName = await this.createSavepoint(name);

    try {
      const result = await operation(this);
      await this.releaseSavepoint(savepointName);
      return result;
    } catch (error) {
      await this.rollbackToSavepoint(savepointName);
      try {
        await this.releaseSavepoint(savepointName);
      } catch {
        // Ignore release errors after rollback-to-savepoint.
      }
      throw error;
    }
  }

  private async applyIsolationLevel(): Promise<void> {
    if (!this.options.isolationLevel) {
      return;
    }

    const isolationSql = toSqlIsolationLevel(this.options.isolationLevel);

    if (this.vendor === 'sqlite') {
      if (this.options.isolationLevel === 'read uncommitted') {
        await this.executeQuery(sql.raw('PRAGMA read_uncommitted = 1'));
      } else {
        // SQLite defaults to SERIALIZABLE-like behavior for transactions.
        logger.debug('Ignoring SQLite isolation level override', {
          transactionId: this.id,
          isolationLevel: this.options.isolationLevel,
        });
      }
      return;
    }

    await this.executeQuery(sql.raw(`SET TRANSACTION ISOLATION LEVEL ${isolationSql}`));
  }
}

/**
 * Execute a callback inside a database transaction.
 *
 * Automatically commits on success and rolls back on failure.
 */
export async function withTransaction<T>(
  manager: ConnectionManager,
  operation: (transaction: TransactionContext) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  const startTime = Date.now();
  const resolvedOptions = resolveOptions(options);
  const transactionId = `tx-${++transactionSequence}`;
  const vendor = manager.getVendor();

  logger.debug('Starting transaction', {
    transactionId,
    vendor,
    isolationLevel: resolvedOptions.isolationLevel,
    timeoutMs: resolvedOptions.timeoutMs,
  });

  return manager.executeInConnection(async (executeQuery) => {
    const transaction = new ManagedTransaction({
      id: transactionId,
      vendor,
      executeQuery,
      options: resolvedOptions,
    });

    await transaction.begin();

    try {
      const result = await withTimeout(operation(transaction), resolvedOptions.timeoutMs);

      if (transaction.isActive()) {
        await transaction.commit();
      }

      logger.debug('Transaction committed', {
        transactionId,
        vendor,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (transaction.isActive()) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          logger.error('Transaction rollback failed', {
            transactionId,
            vendor,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      logger.error('Transaction failed', {
        transactionId,
        vendor,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  });
}
