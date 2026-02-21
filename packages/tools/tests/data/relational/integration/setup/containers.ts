/**
 * Testcontainer setup utilities for integration tests.
 *
 * Provides PostgreSQL and MySQL containers via testcontainers.
 * Containers are started once per test suite and stopped after all tests complete.
 *
 * @module integration/setup/containers
 */

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MySqlContainer, type StartedMySqlContainer } from '@testcontainers/mysql';

export interface PostgreSQLContainerInfo {
  container: StartedPostgreSqlContainer;
  connectionString: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface MySQLContainerInfo {
  container: StartedMySqlContainer;
  connectionString: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Start a PostgreSQL testcontainer.
 * The connection string is formatted for the pg driver.
 */
export async function startPostgreSQLContainer(): Promise<PostgreSQLContainerInfo> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('agentforge_test')
    .withUsername('test_user')
    .withPassword('test_password')
    .start();

  const host = container.getHost();
  const port = container.getPort();
  const database = container.getDatabase();
  const user = container.getUsername();
  const password = container.getPassword();
  const connectionString = container.getConnectionUri();

  return { container, connectionString, host, port, database, user, password };
}

/**
 * Start a MySQL testcontainer.
 * The connection string is formatted for the mysql2 driver.
 */
export async function startMySQLContainer(): Promise<MySQLContainerInfo> {
  const container = await new MySqlContainer('mysql:8.0')
    .withDatabase('agentforge_test')
    .withUsername('test_user')
    .withRootPassword('root_password')
    .withUserPassword('test_password')
    .start();

  const host = container.getHost();
  const port = container.getPort();
  const database = container.getDatabase();
  const user = container.getUsername();
  const password = container.getUserPassword();
  const connectionString = `mysql://${user}:${password}@${host}:${port}/${database}`;

  return { container, connectionString, host, port, database, user, password };
}

/**
 * Stop a PostgreSQL testcontainer.
 */
export async function stopPostgreSQLContainer(info: PostgreSQLContainerInfo): Promise<void> {
  await info.container.stop();
}

/**
 * Stop a MySQL testcontainer.
 */
export async function stopMySQLContainer(info: MySQLContainerInfo): Promise<void> {
  await info.container.stop();
}
