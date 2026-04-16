import type {
  ConnectionConfig,
  PoolConfig,
  PostgreSQLConnectionConfig,
  MySQLConnectionConfig,
} from './types.js';
import { createLogger } from '@agentforge/core';

const logger = createLogger('agentforge:tools:data:relational:connection:vendor-init');

export interface InitializedVendorConnection {
  client: unknown;
  db: unknown;
}

interface PostgreSQLPoolConnectionConfig extends Omit<PostgreSQLConnectionConfig, 'pool'> {
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

interface MySQLPoolConnectionConfig extends Omit<MySQLConnectionConfig, 'pool'> {
  connectionLimit?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
}

type PostgreSQLVendorConnection = Extract<ConnectionConfig, { vendor: 'postgresql' }>['connection'];
type MySQLVendorConnection = Extract<ConnectionConfig, { vendor: 'mysql' }>['connection'];
type SQLiteVendorConnection = Extract<ConnectionConfig, { vendor: 'sqlite' }>['connection'];

export const SAFE_INITIALIZATION_PATTERNS = [
  'Pool max connections must be',
  'Pool acquire timeout must be',
  'Pool idle timeout must be',
  'SQLite connection requires a url property',
  'Unsupported database vendor',
] as const;

export function validatePoolConfig(poolConfig: PoolConfig): void {
  if (poolConfig.max !== undefined && poolConfig.max < 1) {
    throw new Error('Pool max connections must be >= 1');
  }

  if (poolConfig.acquireTimeoutMillis !== undefined && poolConfig.acquireTimeoutMillis < 0) {
    throw new Error('Pool acquire timeout must be >= 0');
  }

  if (poolConfig.idleTimeoutMillis !== undefined && poolConfig.idleTimeoutMillis < 0) {
    throw new Error('Pool idle timeout must be >= 0');
  }
}

function pickConfiguredPoolFields(
  fields: Record<string, number | undefined>
): Record<string, number> {
  const configuredEntries = Object.entries(fields).filter(
    (entry): entry is [string, number] => entry[1] !== undefined
  );
  return Object.fromEntries(configuredEntries);
}

function normalizePostgreSQLConfig(
  connection: PostgreSQLVendorConnection
): {
  connectionConfig: PostgreSQLPoolConnectionConfig;
  poolConfig?: PoolConfig;
} {
  const { pool: poolConfig, ...baseConfig } =
    typeof connection === 'string' ? { connectionString: connection } : connection;

  if (poolConfig) {
    validatePoolConfig(poolConfig);
  }

  return {
    poolConfig,
    connectionConfig: {
      ...baseConfig,
      ...(poolConfig?.max !== undefined && { max: poolConfig.max }),
      ...(poolConfig?.idleTimeoutMillis !== undefined && {
        idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      }),
      ...(poolConfig?.acquireTimeoutMillis !== undefined && {
        connectionTimeoutMillis: poolConfig.acquireTimeoutMillis,
      }),
    },
  };
}

function normalizeMySQLConfig(
  connection: MySQLVendorConnection
): string | MySQLPoolConnectionConfig {
  if (typeof connection === 'string') {
    logger.debug('Creating MySQL connection pool from connection string', {
      vendor: 'mysql',
    });
    return connection;
  }

  const { pool: poolConfig, ...baseConfig } = connection;

  if (poolConfig) {
    validatePoolConfig(poolConfig);
  }

  return {
    ...baseConfig,
    ...(poolConfig?.max !== undefined && { connectionLimit: poolConfig.max }),
    ...(poolConfig?.acquireTimeoutMillis !== undefined && {
      acquireTimeout: poolConfig.acquireTimeoutMillis,
    }),
    ...(poolConfig?.idleTimeoutMillis !== undefined && {
      idleTimeout: poolConfig.idleTimeoutMillis,
    }),
  };
}

function resolveSqliteUrl(connection: SQLiteVendorConnection): {
  url: string;
  poolConfig?: PoolConfig;
} {
  if (typeof connection === 'string') {
    return { url: connection };
  }

  const { url, pool } = connection;

  if (!url) {
    throw new Error('SQLite connection requires a url property');
  }

  if (pool) {
    validatePoolConfig(pool);
  }

  return { url, poolConfig: pool };
}

export async function initializeVendorConnection(
  config: ConnectionConfig
): Promise<InitializedVendorConnection> {
  switch (config.vendor) {
    case 'postgresql':
      return initializePostgreSQLConnection(config.connection);
    case 'mysql':
      return initializeMySQLConnection(config.connection);
    case 'sqlite':
      return initializeSQLiteConnection(config.connection);
    default:
      throw new Error(`Unsupported database vendor: ${(config as { vendor: string }).vendor}`);
  }
}

export async function initializePostgreSQLConnection(
  connection: PostgreSQLVendorConnection
): Promise<InitializedVendorConnection> {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');
  const { connectionConfig } = normalizePostgreSQLConfig(connection);

  logger.debug('Creating PostgreSQL connection pool', {
    vendor: 'postgresql',
    poolConfig: pickConfiguredPoolFields({
      max: connectionConfig.max,
      idleTimeoutMillis: connectionConfig.idleTimeoutMillis,
      connectionTimeoutMillis: connectionConfig.connectionTimeoutMillis,
    }),
  });

  const client = new Pool(connectionConfig);
  const db = drizzle({ client });
  return { client, db };
}

export async function initializeMySQLConnection(
  connection: MySQLVendorConnection
): Promise<InitializedVendorConnection> {
  const { drizzle } = await import('drizzle-orm/mysql2');
  const mysql = await import('mysql2/promise');
  const connectionConfig = normalizeMySQLConfig(connection);

  if (typeof connectionConfig !== 'string') {
    logger.debug('Creating MySQL connection pool', {
      vendor: 'mysql',
      poolConfig: pickConfiguredPoolFields({
        connectionLimit: connectionConfig.connectionLimit,
        acquireTimeout: connectionConfig.acquireTimeout,
        idleTimeout: connectionConfig.idleTimeout,
      }),
    });
  }

  let client;
  if (typeof connectionConfig === 'string') {
    client = mysql.createPool(connectionConfig);
  } else {
    client = mysql.createPool(connectionConfig);
  }
  const db = drizzle({ client });
  return { client, db };
}

export async function initializeSQLiteConnection(
  connection: SQLiteVendorConnection
): Promise<InitializedVendorConnection> {
  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const DatabaseModule = await import('better-sqlite3');
  const Database = DatabaseModule.default;
  const { url, poolConfig } = resolveSqliteUrl(connection);

  if (poolConfig) {
    logger.debug('SQLite pool configuration provided but not applied (SQLite uses single connection)', {
      vendor: 'sqlite',
      poolConfig: pickConfiguredPoolFields({
        max: poolConfig.max,
        idleTimeoutMillis: poolConfig.idleTimeoutMillis,
        acquireTimeoutMillis: poolConfig.acquireTimeoutMillis,
      }),
    });
  }

  logger.debug('Creating SQLite connection', {
    vendor: 'sqlite',
    url: url === ':memory:' ? ':memory:' : 'file',
  });

  const client = new Database(url);
  client.pragma('foreign_keys = ON');
  const db = drizzle({ client });
  return { client, db };
}
