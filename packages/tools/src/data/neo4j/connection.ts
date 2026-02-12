/**
 * Neo4j Connection Pool Management
 *
 * Manages Neo4j driver connections with pooling and health checks.
 */

import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import { createLogger } from '@agentforge/core';
import type { Neo4jConfig } from './types.js';

const logger = createLogger('agentforge:tools:neo4j:pool');

/**
 * Neo4j connection pool singleton
 */
class Neo4jConnectionPool {
  private driver: Driver | null = null;
  private config: Neo4jConfig | null = null;

  /**
   * Initialize the connection pool
   */
  async initialize(config: Neo4jConfig): Promise<void> {
    const startTime = Date.now();

    logger.debug('Initializing Neo4j connection pool', {
      uri: config.uri,
      username: config.username,
      database: config.database || 'neo4j',
      maxConnectionPoolSize: config.maxConnectionPoolSize || 50,
      connectionTimeout: config.connectionTimeout || 30000,
    });

    if (this.driver) {
      logger.debug('Closing existing connection before reinitializing');
      await this.close();
    }

    this.config = config;
    this.driver = neo4j.driver(
      config.uri,
      auth.basic(config.username, config.password),
      {
        maxConnectionPoolSize: config.maxConnectionPoolSize || 50,
        connectionTimeout: config.connectionTimeout || 30000,
      }
    );

    // Verify connectivity
    await this.verifyConnectivity();

    logger.info('Neo4j connection pool initialized', {
      uri: config.uri,
      database: config.database || 'neo4j',
      duration: Date.now() - startTime,
    });
  }

  /**
   * Verify connectivity to Neo4j
   */
  async verifyConnectivity(): Promise<void> {
    if (!this.driver) {
      const error = 'Neo4j driver not initialized';
      logger.error(error);
      throw new Error(error);
    }

    logger.debug('Verifying Neo4j connectivity');

    try {
      await this.driver.verifyConnectivity();
      logger.debug('Neo4j connectivity verified');
    } catch (error) {
      const errorMessage = `Failed to connect to Neo4j: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error('Neo4j connectivity verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uri: this.config?.uri,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Get a session for executing queries
   */
  getSession(database?: string): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call initialize() first.');
    }

    return this.driver.session({
      database: database || this.config?.database || 'neo4j',
    });
  }

  /**
   * Execute a query with automatic session management
   */
  async executeQuery<T = any>(
    cypher: string,
    parameters?: Record<string, any>,
    database?: string
  ): Promise<T[]> {
    const session = this.getSession(database);
    try {
      const result = await session.run(cypher, parameters);
      return result.records.map((record) => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a read query
   */
  async executeReadQuery<T = any>(
    cypher: string,
    parameters?: Record<string, any>,
    database?: string
  ): Promise<T[]> {
    const session = this.getSession(database);
    try {
      const result = await session.executeRead((tx) => tx.run(cypher, parameters));
      return result.records.map((record) => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a write query
   */
  async executeWriteQuery<T = any>(
    cypher: string,
    parameters?: Record<string, any>,
    database?: string
  ): Promise<T[]> {
    const session = this.getSession(database);
    try {
      const result = await session.executeWrite((tx) => tx.run(cypher, parameters));
      return result.records.map((record) => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Check if driver is initialized
   */
  isInitialized(): boolean {
    return this.driver !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): Neo4jConfig | null {
    return this.config;
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.driver) {
      logger.debug('Closing Neo4j connection pool');
      await this.driver.close();
      this.driver = null;
      this.config = null;
      logger.info('Neo4j connection pool closed');
    }
  }
}

/**
 * Global connection pool instance
 */
export const neo4jPool = new Neo4jConnectionPool();

/**
 * Initialize Neo4j connection from environment variables
 */
export async function initializeFromEnv(): Promise<void> {
  // Warn about missing environment variables
  if (!process.env.NEO4J_URI) {
    logger.warn('NEO4J_URI environment variable not set, using default', {
      default: 'bolt://localhost:7687',
    });
  }

  if (!process.env.NEO4J_USER) {
    logger.warn('NEO4J_USER environment variable not set, using default', {
      default: 'neo4j',
    });
  }

  if (!process.env.NEO4J_PASSWORD) {
    logger.warn('NEO4J_PASSWORD environment variable not set, using default', {
      default: 'password',
    });
  }

  if (!process.env.NEO4J_DATABASE) {
    logger.debug('NEO4J_DATABASE environment variable not set, using default', {
      default: 'neo4j',
    });
  }

  const config: Neo4jConfig = {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
    database: process.env.NEO4J_DATABASE,
  };

  await neo4jPool.initialize(config);
}

