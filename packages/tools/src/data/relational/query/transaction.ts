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

/**
 * SQL transaction isolation level.
 *
 * Determines the visibility of changes made by concurrent transactions.
 * Supported by PostgreSQL and MySQL; SQLite always uses 'serializable'.
 */
export type TransactionIsolationLevel =
  | 'read uncommitted'
  | 'read committed'
  | 'repeatable read'
  | 'serializable';

/**
 * Options for configuring a database transaction.
 *
 * @property isolationLevel - SQL isolation level for the transaction
 * @property timeoutMs - Maximum duration in milliseconds before the transaction is rolled back
 */
export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeoutMs?: number;
}

interface ResolvedTransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeoutMs?: number;
}

const SAVEPOINT_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Active transaction handle with savepoint support.
 *
 * Extends {@link SqlExecutor} so queries can be executed within the transaction.
 * The transaction is automatically rolled back if an error occurs and is not
 * explicitly committed.
 *
 * @property id - Unique identifier for this transaction
 * @property vendor - Database vendor this transaction belongs to
 */
export interface TransactionContext extends SqlExecutor {
  id: string;
  vendor: DatabaseVendor;
  /** Whether the transaction is still active (not committed or rolled back). */
  isActive(): boolean;
  /** Commit all changes made within this transaction. */
  commit(): Promise<void>;
  /** Roll back all changes made within this transaction. */
  rollback(): Promise<void>;
  /** Create a savepoint within this transaction. Returns the savepoint name. */
  createSavepoint(name?: string): Promise<string>;
  /** Roll back to a previously created savepoint. */
  rollbackToSavepoint(name: string): Promise<void>;
  /** Release a savepoint, making its changes permanent within the transaction. */
  releaseSavepoint(name: string): Promise<void>;
  /** Execute an operation within a nested savepoint, with automatic rollback on failure. */
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

function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs?: number,
  onTimeout?: () => void
): Promise<T> {
  if (!timeoutMs) {
    return operation;
  }

  return new Promise<T>((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      onTimeout?.();
      reject(new Error(`Transaction timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation
      .then((result) => {
        if (timedOut) {
          return;
        }
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        if (timedOut) {
          return;
        }
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
  private cancelledReason: string | null = null;
  private savepointCounter = 0;
  private sqliteReadUncommittedOriginal: 0 | 1 | null = null;
  private shouldRestoreSqliteReadUncommitted = false;

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
    if (this.cancelledReason) {
      throw new Error(this.cancelledReason);
    }

    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    return this.executeQuery(query);
  }

  async begin(): Promise<void> {
    if (this.vendor === 'mysql') {
      // MySQL requires isolation level to be set before BEGIN
      // for it to reliably apply to the current transaction.
      await this.applyIsolationLevel();
      await this.executeQuery(sql.raw('BEGIN'));
      return;
    }

    await this.executeQuery(sql.raw('BEGIN'));
    await this.applyIsolationLevel();
  }

  cancel(reason: string): void {
    if (!this.cancelledReason) {
      this.cancelledReason = reason;
    }
  }

  async commit(): Promise<void> {
    if (!this.isActive()) {
      return;
    }

    await this.executeQuery(sql.raw('COMMIT'));
    await this.restoreSqliteIsolationIfNeeded();
    this.completed = true;
  }

  async rollback(): Promise<void> {
    if (!this.isActive()) {
      return;
    }

    await this.executeQuery(sql.raw('ROLLBACK'));
    await this.restoreSqliteIsolationIfNeeded();
    this.completed = true;
  }

  async createSavepoint(name?: string): Promise<string> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = this.normalizeSavepointName(name ?? `sp_${++this.savepointCounter}`);
    await this.executeQuery(sql.raw(`SAVEPOINT ${savepointName}`));
    return savepointName;
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = this.normalizeSavepointName(name);
    await this.executeQuery(sql.raw(`ROLLBACK TO SAVEPOINT ${savepointName}`));
  }

  async releaseSavepoint(name: string): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = this.normalizeSavepointName(name);
    await this.executeQuery(sql.raw(`RELEASE SAVEPOINT ${savepointName}`));
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
        this.sqliteReadUncommittedOriginal = await this.getSqliteReadUncommittedState();
        await this.executeQuery(sql.raw('PRAGMA read_uncommitted = 1'));
        this.shouldRestoreSqliteReadUncommitted = true;
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

  private normalizeSavepointName(name: string): string {
    if (!SAVEPOINT_NAME_PATTERN.test(name)) {
      throw new Error(
        'Invalid savepoint name. Use only letters, numbers, and underscores, and start with a letter or underscore.'
      );
    }

    return name;
  }

  private async restoreSqliteIsolationIfNeeded(): Promise<void> {
    if (!this.shouldRestoreSqliteReadUncommitted) {
      return;
    }

    try {
      const targetValue = this.sqliteReadUncommittedOriginal ?? 0;
      await this.executeQuery(sql.raw(`PRAGMA read_uncommitted = ${targetValue}`));
    } catch (error) {
      logger.warn('Failed to restore SQLite read_uncommitted pragma', {
        transactionId: this.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.shouldRestoreSqliteReadUncommitted = false;
    }
  }

  private async getSqliteReadUncommittedState(): Promise<0 | 1 | null> {
    try {
      const result = await this.executeQuery(sql.raw('PRAGMA read_uncommitted'));
      const rows = Array.isArray(result)
        ? result
        : ((result as { rows?: unknown[] }).rows ?? []);

      const first = rows[0];
      if (first && typeof first === 'object') {
        const value = (first as Record<string, unknown>).read_uncommitted;
        if (typeof value === 'number') {
          return value === 1 ? 1 : 0;
        }
      }
    } catch {
      // If introspection fails, we'll restore to default (0) in finalize path.
    }

    return null;
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
      const result = await withTimeout(
        operation(transaction),
        resolvedOptions.timeoutMs,
        () => {
          if (resolvedOptions.timeoutMs) {
            transaction.cancel(`Transaction timed out after ${resolvedOptions.timeoutMs}ms`);
          }
        }
      );

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
