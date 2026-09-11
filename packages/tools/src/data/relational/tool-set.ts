import { createLogger, createTool, type Tool, type ToolMetadata } from '@agentforge/core';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { z } from 'zod';

import { ConnectionManager } from './connection/connection-manager.js';
import type { ConnectionConfig } from './connection/types.js';
import {
  DELETE_CONNECTION_FAILURE,
  INSERT_CONNECTION_FAILURE,
  QUERY_CONNECTION_FAILURE,
  SELECT_CONNECTION_FAILURE,
  UPDATE_CONNECTION_FAILURE,
} from './connection-failure-messages.js';
import { SchemaCache, SchemaInspector } from './schema/schema-inspector.js';
import { withTransaction } from './query/transaction-runner.js';
import type { TransactionContext, TransactionOptions } from './query/transaction-types.js';
import type { RelationalReadExecution } from './tools/read-execution.js';
import { MissingPeerDependencyError } from './utils/peer-dependency-checker.js';
import { invokeRelationalDelete } from './tools/relational-delete/index.js';
import { relationalDeleteSchema } from './tools/relational-delete/schemas.js';
import type {
  DeleteResponse,
  RelationalDeleteOperationInput,
} from './tools/relational-delete/types.js';
import {
  invokeRelationalGetSchema,
  relationalGetSchemaInputSchema,
  type GetSchemaResponse,
  type RelationalGetSchemaOperationInput,
} from './tools/relational-get-schema.js';
import { invokeRelationalInsert } from './tools/relational-insert/index.js';
import { relationalInsertSchema } from './tools/relational-insert/schemas.js';
import type {
  InsertResponse,
  RelationalInsertOperationInput,
} from './tools/relational-insert/types.js';
import {
  invokeRelationalQuery,
  relationalQuerySchema,
  type QueryResponse,
  type RelationalQueryOperationInput,
} from './tools/relational-query.js';
import { invokeRelationalSelect } from './tools/relational-select/index.js';
import { relationalSelectSchema } from './tools/relational-select/schemas.js';
import type {
  RelationalSelectOperationInput,
  SelectResponse,
} from './tools/relational-select/types.js';
import { invokeRelationalUpdate } from './tools/relational-update/index.js';
import { relationalUpdateSchema } from './tools/relational-update/schemas.js';
import type {
  RelationalUpdateOperationInput,
  UpdateResponse,
} from './tools/relational-update/types.js';
import {
  relationalDelete,
  relationalGetSchema,
  relationalInsert,
  relationalQuery,
  relationalSelect,
  relationalUpdate,
} from './tools/index.js';

const DEFAULT_SCHEMA_CACHE_TTL_MS = 60_000;
const TOOL_SET_SCHEMA_CACHE_KEY = 'relational-tool-set';
const PREFIX_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ROLLBACK_ONLY_MESSAGE = 'Transaction is rollback-only; no database work was executed.';
const logger = createLogger('agentforge:tools:data:relational:tool-set');

export interface RelationalToolSetOptions {
  /** Kebab-case prefix prepended to every configured Tool name. */
  prefix?: string;
  /** Lifetime of cached schema results. Use 0 to disable caching. */
  schemaCacheTtlMs?: number;
}

export class RelationalToolSetConfigurationError extends Error {
  override readonly name = 'RelationalToolSetConfigurationError';
}

export class RelationalToolSetDisposedError extends Error {
  override readonly name = 'RelationalToolSetDisposedError';

  constructor() {
    super('The Relational Tool Set is disposing or has been disposed.');
  }
}

export type RelationalTransactionErrorCode =
  | 'NESTED_TRANSACTION'
  | 'ROLLBACK_ONLY'
  | 'SCOPE_EXPIRED'
  | 'START_FAILED';

export class RelationalTransactionError extends Error {
  override readonly name = 'RelationalTransactionError';

  constructor(
    message: string,
    readonly code: RelationalTransactionErrorCode
  ) {
    super(message);
  }
}

type QueryTool = Tool<RelationalQueryOperationInput, QueryResponse>;
type SelectTool = Tool<RelationalSelectOperationInput, SelectResponse>;
type InsertTool = Tool<RelationalInsertOperationInput, InsertResponse>;
type UpdateTool = Tool<RelationalUpdateOperationInput, UpdateResponse>;
type DeleteTool = Tool<RelationalDeleteOperationInput, DeleteResponse>;
export type RelationalToolSetGetSchemaInput = Omit<
  RelationalGetSchemaOperationInput,
  'database' | 'cacheTtlMs'
>;
type GetSchemaTool = Tool<RelationalToolSetGetSchemaInput, GetSchemaResponse>;
type ConfiguredTool = QueryTool | SelectTool | InsertTool | UpdateTool | DeleteTool | GetSchemaTool;

export interface RelationalTransactionToolSet extends Iterable<ConfiguredTool> {
  readonly query: QueryTool;
  readonly select: SelectTool;
  readonly insert: InsertTool;
  readonly update: UpdateTool;
  readonly delete: DeleteTool;
  readonly getSchema: GetSchemaTool;
}

export interface RelationalToolSet extends RelationalTransactionToolSet {
  transaction<T>(
    operation: (tools: RelationalTransactionToolSet) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  refreshSchema(): void;
  dispose(): Promise<void>;
}

type FailureFactory<T> = (message: string) => T;
type ExecuteConfiguredOperation = <T>(
  operation: (execution: RelationalReadExecution) => Promise<T>,
  failure: FailureFactory<T>,
  connectionFailureMessage: string
) => Promise<T>;

function isFailedOrPartialResult(result: unknown): boolean {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const response = result as {
    success?: boolean;
    batch?: { failedItems?: number; partialSuccess?: boolean };
  };
  return (
    response.success === false ||
    response.batch?.partialSuccess === true ||
    (response.batch?.failedItems ?? 0) > 0
  );
}

class TransactionToolScope {
  private active = true;
  private rollbackOnly = false;
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly execution: RelationalReadExecution) {}

  run<T>(
    operation: (execution: RelationalReadExecution) => Promise<T>,
    failure: FailureFactory<T>
  ) {
    const invocation = this.tail.then(async () => {
      if (!this.active) {
        throw new RelationalTransactionError(
          'Transaction-scoped Tools can no longer be used because their callback has settled.',
          'SCOPE_EXPIRED'
        );
      }
      if (this.rollbackOnly) {
        return failure(ROLLBACK_ONLY_MESSAGE);
      }

      const result = await operation(this.execution);
      if (isFailedOrPartialResult(result)) {
        this.rollbackOnly = true;
      }
      return result;
    });
    this.tail = invocation.then(
      () => undefined,
      () => undefined
    );
    return invocation;
  }

  async settle(): Promise<void> {
    await this.tail;
    this.active = false;
  }

  isRollbackOnly(): boolean {
    return this.rollbackOnly;
  }
}

function createConfiguredTools(
  options: RelationalToolSetOptions,
  execution: ExecuteConfiguredOperation
): RelationalTransactionToolSet {
  const query = createTool(
    configuredMetadata(relationalQuery, options.prefix),
    relationalQuerySchema.omit({ vendor: true, connectionString: true }),
    (input) =>
      execution<QueryResponse>(
        (context) => invokeRelationalQuery(context, input),
        (error): QueryResponse => ({ success: false, error, rows: [], rowCount: 0 }),
        QUERY_CONNECTION_FAILURE
      )
  );
  const select = createTool(
    configuredMetadata(relationalSelect, options.prefix),
    relationalSelectSchema.omit({ vendor: true, connectionString: true }),
    (input) =>
      execution<SelectResponse>(
        (context) => invokeRelationalSelect(context, input),
        (error): SelectResponse => ({ success: false, error, rows: [], rowCount: 0 }),
        SELECT_CONNECTION_FAILURE
      )
  );
  const insert = createTool(
    configuredMetadata(relationalInsert, options.prefix),
    relationalInsertSchema.omit({ vendor: true, connectionString: true }),
    (input) =>
      execution<InsertResponse>(
        (context) => invokeRelationalInsert(context, input),
        (error): InsertResponse => ({
          success: false,
          error,
          rowCount: 0,
          insertedIds: [],
          rows: [],
        }),
        INSERT_CONNECTION_FAILURE
      )
  );
  const update = createTool(
    configuredMetadata(relationalUpdate, options.prefix),
    relationalUpdateOperationSchema,
    (input) =>
      execution<UpdateResponse>(
        (context) => invokeRelationalUpdate(context, input),
        (error): UpdateResponse => ({ success: false, error, rowCount: 0 }),
        UPDATE_CONNECTION_FAILURE
      )
  );
  const deleteTool = createTool(
    configuredMetadata(relationalDelete, options.prefix),
    relationalDeleteOperationSchema,
    (input) =>
      execution<DeleteResponse>(
        (context) => invokeRelationalDelete(context, input),
        (error): DeleteResponse => ({ success: false, error, rowCount: 0, softDeleted: false }),
        DELETE_CONNECTION_FAILURE
      )
  );
  const getSchema = createTool(
    configuredMetadata(relationalGetSchema, options.prefix),
    relationalGetSchemaInputSchema.omit({
      vendor: true,
      connectionString: true,
      database: true,
      cacheTtlMs: true,
    }),
    (input) =>
      execution<GetSchemaResponse>(
        (context) =>
          invokeRelationalGetSchema(context, {
            ...input,
            cacheTtlMs: options.schemaCacheTtlMs ?? DEFAULT_SCHEMA_CACHE_TTL_MS,
          }),
        (error): GetSchemaResponse => ({ success: false, error, schema: null }),
        'Failed to inspect schema. See logs for details.'
      )
  );
  const tools = [query, select, insert, update, deleteTool, getSchema] as const;

  return Object.freeze({
    query,
    select,
    insert,
    update,
    delete: deleteTool,
    getSchema,
    [Symbol.iterator]: () => tools[Symbol.iterator](),
  });
}

function validateConfiguration(config: ConnectionConfig, options: RelationalToolSetOptions): void {
  if (!config || !['postgresql', 'mysql', 'sqlite'].includes(config.vendor)) {
    throw new RelationalToolSetConfigurationError(
      'Database vendor must be postgresql, mysql, or sqlite.'
    );
  }
  if (
    (typeof config.connection === 'string' && config.connection.trim().length === 0) ||
    (typeof config.connection !== 'string' &&
      (!config.connection || Array.isArray(config.connection)))
  ) {
    throw new RelationalToolSetConfigurationError(
      'Database connection must be a non-empty string or configuration object.'
    );
  }
  if (
    config.vendor === 'sqlite' &&
    typeof config.connection !== 'string' &&
    (typeof config.connection.url !== 'string' || config.connection.url.trim().length === 0)
  ) {
    throw new RelationalToolSetConfigurationError(
      'SQLite object configuration requires a non-empty url.'
    );
  }
  if (options.prefix !== undefined && !PREFIX_PATTERN.test(options.prefix)) {
    throw new RelationalToolSetConfigurationError(
      'Tool name prefix must be non-empty kebab-case starting with a letter.'
    );
  }
  if (
    options.schemaCacheTtlMs !== undefined &&
    (!Number.isInteger(options.schemaCacheTtlMs) || options.schemaCacheTtlMs < 0)
  ) {
    throw new RelationalToolSetConfigurationError(
      'Schema cache TTL must be a non-negative integer.'
    );
  }

  const longestName = configuredName('relational-get-schema', options.prefix);
  if (longestName.length > 50) {
    throw new RelationalToolSetConfigurationError(
      'Tool name prefix is too long; configured Tool names must not exceed 50 characters.'
    );
  }
}

function cloneImmutableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(cloneImmutableValue));
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (value instanceof ArrayBuffer) {
    return value.slice(0);
  }
  if (Buffer.isBuffer(value)) {
    return Buffer.from(value);
  }
  if (ArrayBuffer.isView(value)) {
    return structuredClone(value);
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, cloneImmutableValue(nestedValue)])
      )
    );
  }
  if (value && typeof value === 'object') {
    throw new RelationalToolSetConfigurationError(
      'Database configuration contains an unsupported mutable object.'
    );
  }
  return value;
}

function snapshotConfiguration(config: ConnectionConfig): ConnectionConfig {
  const connection = cloneImmutableValue(config.connection) as ConnectionConfig['connection'];
  return Object.freeze({ vendor: config.vendor, connection }) as ConnectionConfig;
}

function configuredName(name: string, prefix?: string): string {
  return prefix ? `${prefix}-${name}` : name;
}

function configuredMetadata(tool: { metadata: ToolMetadata }, prefix?: string): ToolMetadata {
  return {
    ...tool.metadata,
    name: configuredName(tool.metadata.name, prefix),
    examples: undefined,
  };
}

function preserveOperationValidation<T extends Record<string, unknown>>(
  legacySchema: z.ZodTypeAny,
  input: T,
  context: z.RefinementCtx
): void {
  const result = legacySchema.safeParse({
    ...input,
    vendor: 'sqlite',
    connectionString: 'configured',
  });
  if (!result.success) {
    for (const issue of result.error.issues) {
      context.addIssue(issue);
    }
  }
}

const relationalUpdateOperationSchema = relationalUpdateSchema
  .innerType()
  .omit({ vendor: true, connectionString: true })
  .superRefine((input, context) => {
    preserveOperationValidation(relationalUpdateSchema, input, context);
  }) as z.ZodSchema<RelationalUpdateOperationInput>;

const relationalDeleteOperationSchema = relationalDeleteSchema
  .innerType()
  .omit({ vendor: true, connectionString: true })
  .superRefine((input, context) => {
    preserveOperationValidation(relationalDeleteSchema, input, context);
  }) as z.ZodSchema<RelationalDeleteOperationInput>;

class RelationalToolSetImplementation implements RelationalToolSet {
  readonly query: QueryTool;
  readonly select: SelectTool;
  readonly insert: InsertTool;
  readonly update: UpdateTool;
  readonly delete: DeleteTool;
  readonly getSchema: GetSchemaTool;

  private readonly tools: readonly ConfiguredTool[];
  private readonly schemaCache = new SchemaCache();
  private readonly prefix?: string;
  private readonly transactionContext = new AsyncLocalStorage<{ active: boolean }>();
  private sqliteTransactionTail: Promise<void> = Promise.resolve();
  private manager?: ConnectionManager;
  private initialization?: Promise<ConnectionManager>;
  private activeWork = 0;
  private state: 'open' | 'closing' | 'closed' = 'open';
  private drain?: Promise<void>;
  private resolveDrain?: () => void;
  private disposal?: Promise<void>;

  constructor(
    private readonly config: ConnectionConfig,
    options: RelationalToolSetOptions,
    private readonly sharedSchemaCacheKey?: string
  ) {
    this.prefix = options.prefix;
    const configuredTools = createConfiguredTools(options, (operation, failure, failureMessage) =>
      this.run(operation, () => failure(failureMessage))
    );
    this.query = configuredTools.query;
    this.select = configuredTools.select;
    this.insert = configuredTools.insert;
    this.update = configuredTools.update;
    this.delete = configuredTools.delete;
    this.getSchema = configuredTools.getSchema;

    this.tools = Object.freeze([
      this.query,
      this.select,
      this.insert,
      this.update,
      this.delete,
      this.getSchema,
    ]) as readonly ConfiguredTool[];
  }

  [Symbol.iterator](): Iterator<ConfiguredTool> {
    return this.tools[Symbol.iterator]();
  }

  async transaction<T>(
    operation: (tools: RelationalTransactionToolSet) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    if (this.transactionContext.getStore()?.active) {
      throw new RelationalTransactionError(
        'Nested Relational Tool Set transactions are not supported.',
        'NESTED_TRANSACTION'
      );
    }

    return this.runTransaction((manager) => {
      const transactionState = { active: true };
      return this.transactionContext.run(transactionState, async () => {
        try {
          return await withTransaction(
            manager,
            async (transaction) => {
              const scope = new TransactionToolScope(this.transactionExecutionFor(transaction));
              const scopedTools = createConfiguredTools(
                { prefix: this.prefix },
                (scopedOperation, failure) => scope.run(scopedOperation, failure)
              );

              try {
                const result = await operation(scopedTools);
                await scope.settle();
                if (scope.isRollbackOnly()) {
                  throw new RelationalTransactionError(
                    'The transaction was rolled back because a scoped Tool failed.',
                    'ROLLBACK_ONLY'
                  );
                }
                return result;
              } finally {
                await scope.settle();
              }
            },
            options
          );
        } finally {
          transactionState.active = false;
        }
      });
    });
  }

  refreshSchema(): void {
    if (this.state !== 'open') {
      throw new RelationalToolSetDisposedError();
    }
    if (this.sharedSchemaCacheKey) {
      SchemaInspector.clearCache(this.sharedSchemaCacheKey);
    } else {
      this.schemaCache.delete(TOOL_SET_SCHEMA_CACHE_KEY);
    }
  }

  dispose(): Promise<void> {
    if (!this.disposal) {
      this.state = 'closing';
      this.disposal = this.finishDisposal();
    }
    return this.disposal;
  }

  private async run<T>(
    operation: (execution: RelationalReadExecution) => Promise<T>,
    connectionFailure: () => T
  ): Promise<T> {
    if (this.state !== 'open') {
      throw new RelationalToolSetDisposedError();
    }
    this.activeWork += 1;
    try {
      let manager: ConnectionManager;
      try {
        manager = await this.ensureConnection();
      } catch (error) {
        if (error instanceof MissingPeerDependencyError) {
          throw error;
        }
        return connectionFailure();
      }
      return await operation(this.schemaExecutionFor(manager));
    } finally {
      this.activeWork -= 1;
      if (this.activeWork === 0) {
        this.resolveDrain?.();
      }
    }
  }

  private async runTransaction<T>(operation: (manager: ConnectionManager) => Promise<T>) {
    if (this.state !== 'open') {
      throw new RelationalToolSetDisposedError();
    }
    this.activeWork += 1;
    try {
      let manager: ConnectionManager;
      try {
        manager = await this.ensureConnection();
      } catch (error) {
        if (error instanceof MissingPeerDependencyError) {
          throw error;
        }
        throw new RelationalTransactionError(
          'Failed to start the managed database transaction.',
          'START_FAILED'
        );
      }
      if (this.config.vendor !== 'sqlite') {
        return await operation(manager);
      }

      const transaction = this.sqliteTransactionTail.then(() => operation(manager));
      this.sqliteTransactionTail = transaction.then(
        () => undefined,
        () => undefined
      );
      return await transaction;
    } finally {
      this.activeWork -= 1;
      if (this.activeWork === 0) {
        this.resolveDrain?.();
      }
    }
  }

  private ensureConnection(): Promise<ConnectionManager> {
    if (this.manager?.isConnected()) {
      return Promise.resolve(this.manager);
    }
    if (!this.initialization) {
      const manager = new ConnectionManager(this.config);
      this.manager = manager;
      this.initialization = manager
        .connect()
        .then(() => manager)
        .catch(async (error: unknown) => {
          this.manager = undefined;
          this.initialization = undefined;
          if (!(error instanceof MissingPeerDependencyError)) {
            logger.error('Relational Tool Set connection initialization failed', {
              vendor: this.config.vendor,
              errorType: error instanceof Error ? error.name : typeof error,
            });
          }
          try {
            await manager.dispose();
          } catch {
            // Preserve the connection failure as the outcome shared by all waiters.
          }
          throw error;
        });
    }
    return this.initialization;
  }

  private schemaExecutionFor(manager: ConnectionManager) {
    const execution = { executor: manager, vendor: this.config.vendor };
    return this.sharedSchemaCacheKey
      ? { ...execution, schemaCacheKey: this.sharedSchemaCacheKey }
      : {
          ...execution,
          schemaCache: this.schemaCache,
          schemaCacheKey: TOOL_SET_SCHEMA_CACHE_KEY,
        };
  }

  private transactionExecutionFor(transaction: TransactionContext): RelationalReadExecution {
    return {
      executor: transaction,
      transaction,
      vendor: this.config.vendor,
    };
  }

  private async finishDisposal(): Promise<void> {
    if (this.activeWork > 0) {
      this.drain = new Promise<void>((resolve) => {
        this.resolveDrain = resolve;
      });
      await this.drain;
    }
    this.schemaCache.clear();
    try {
      await this.manager?.dispose();
    } finally {
      this.state = 'closed';
      this.resolveDrain = undefined;
    }
  }
}

/**
 * Configure all six Relational Tools around one lazily connected database session or pool.
 * Construction performs validation only and never connects to the database.
 */
export function createRelationalToolSet(
  config: ConnectionConfig,
  options: RelationalToolSetOptions = {}
): RelationalToolSet {
  validateConfiguration(config, options);
  return new RelationalToolSetImplementation(snapshotConfiguration(config), { ...options });
}

/** @internal Preserve the legacy read Tool validation and schema-cache contracts. */
export function createLegacyRelationalReadToolSet(
  config: ConnectionConfig,
  options: RelationalToolSetOptions = {},
  schemaCacheKey?: string
): RelationalToolSet {
  return new RelationalToolSetImplementation(
    snapshotConfiguration(config),
    { ...options },
    schemaCacheKey
  );
}

/** @internal Preserve the legacy mutation Tool validation and error contracts. */
export function createLegacyRelationalMutationToolSet(config: ConnectionConfig): RelationalToolSet {
  return new RelationalToolSetImplementation(snapshotConfiguration(config), {});
}
