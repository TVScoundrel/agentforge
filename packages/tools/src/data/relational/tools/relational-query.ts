/**
 * Relational Query Tool - Execute raw SQL queries with parameter binding
 * @module tools/relational-query
 */

import { z } from 'zod';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ConnectionManager } from '../connection/connection-manager.js';
import { executeQuery } from '../query/query-executor.js';
import type { DatabaseVendor } from '../types.js';

/**
 * Zod schema for relational-query tool input
 */
const relationalQuerySchema = z.object({
  sql: z.string().describe('SQL query string to execute'),
  params: z.union([
    z.array(z.unknown()).describe('Positional parameters (e.g., [value1, value2])'),
    z.record(z.string(), z.unknown()).describe('Named parameters (e.g., { name: "John", age: 30 })'),
  ]).optional().describe('Query parameters for parameter binding (prevents SQL injection)'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().optional().describe('Database connection string (optional if using existing connection)'),
  timeout: z.number().optional().describe('Query timeout in milliseconds (optional)'),
  maxRows: z.number().optional().describe('Maximum number of rows to return (optional)'),
});

/**
 * Relational Query Tool
 * 
 * Executes raw SQL queries against relational databases (PostgreSQL, MySQL, SQLite)
 * with proper parameter binding to prevent SQL injection.
 * 
 * Features:
 * - Supports SELECT, INSERT, UPDATE, DELETE, and other SQL statements
 * - Parameter binding prevents SQL injection
 * - Supports positional ($1, ?) and named (:name) parameters
 * - Result formatting to JSON
 * - Error handling with sanitized messages
 * - Query timeout configuration
 * 
 * @example
 * ```typescript
 * // SELECT with positional parameters
 * const result = await relationalQuery.invoke({
 *   sql: 'SELECT * FROM users WHERE id = $1',
 *   params: [42],
 *   vendor: 'postgresql',
 *   connectionString: 'postgresql://user:pass@localhost:5432/mydb'
 * });
 * 
 * // INSERT with named parameters
 * const result = await relationalQuery.invoke({
 *   sql: 'INSERT INTO users (name, email) VALUES (:name, :email)',
 *   params: { name: 'John Doe', email: 'john@example.com' },
 *   vendor: 'postgresql',
 *   connectionString: 'postgresql://user:pass@localhost:5432/mydb'
 * });
 * ```
 */
export const relationalQuery = toolBuilder()
  .name('relational-query')
  .displayName('Relational Query')
  .description('Execute raw SQL queries against relational databases (PostgreSQL, MySQL, SQLite) with parameter binding to prevent SQL injection')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'query', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalQuerySchema)
  .examples([
    {
      description: 'SELECT query with positional parameters',
      input: {
        sql: 'SELECT * FROM users WHERE id = $1',
        params: [42],
        vendor: 'postgresql' as DatabaseVendor,
        connectionString: 'postgresql://user:pass@localhost:5432/mydb'
      }
    },
    {
      description: 'INSERT query with named parameters',
      input: {
        sql: 'INSERT INTO users (name, email) VALUES (:name, :email)',
        params: { name: 'John Doe', email: 'john@example.com' },
        vendor: 'postgresql' as DatabaseVendor,
        connectionString: 'postgresql://user:pass@localhost:5432/mydb'
      }
    },
    {
      description: 'UPDATE query with timeout',
      input: {
        sql: 'UPDATE users SET status = ? WHERE id = ?',
        params: ['active', 42],
        vendor: 'mysql' as DatabaseVendor,
        connectionString: 'mysql://user:pass@localhost:3306/mydb',
        timeout: 5000
      }
    }
  ])
  .usageNotes('Always use parameter binding (params) instead of string concatenation to prevent SQL injection. Supports positional ($1, ?) and named (:name) parameters.')
  .limitations([
    'Requires database-specific driver as peer dependency (pg, mysql2, or better-sqlite3)',
    'Connection string must be valid for the specified vendor',
    'Query timeout is enforced but may vary by database vendor',
    'Large result sets may impact performance - use maxRows to limit results'
  ])
  .implement(async (input) => {
    // Create connection manager
    const manager = new ConnectionManager({
      vendor: input.vendor,
      connection: input.connectionString || ''
    });

    try {
      // Initialize connection
      await manager.initialize();

      // Execute query
      const result = await executeQuery(manager, {
        sql: input.sql,
        params: input.params,
        vendor: input.vendor,
        options: {
          timeout: input.timeout,
          maxRows: input.maxRows
        }
      });

      // Return formatted result
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        executionTime: result.executionTime
      };
    } catch (error) {
      // Return error with sanitized message
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rows: [],
        rowCount: 0
      };
    } finally {
      // Always close connection
      await manager.close();
    }
  })
  .build();

