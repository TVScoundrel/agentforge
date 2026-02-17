/**
 * Query executor for relational databases using Drizzle ORM
 * @module query/query-executor
 */

import { sql, type SQL } from 'drizzle-orm';
import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../connection/connection-manager.js';
import type { QueryInput, QueryExecutionResult, QueryParams } from './types.js';

const logger = createLogger('agentforge:tools:data:relational:query');

/**
 * Build a parameterized SQL query using Drizzle's sql template
 * 
 * This function constructs a safe, parameterized SQL query from a raw SQL string
 * and parameters. It handles both positional (array) and named (object) parameters.
 * 
 * @param sqlString - Raw SQL query string with placeholders
 * @param params - Query parameters (positional array or named object)
 * @returns Drizzle SQL object with proper parameter binding
 */
function buildParameterizedQuery(sqlString: string, params?: QueryParams): SQL {
  if (!params) {
    // No parameters - use sql.raw() for static queries
    return sql.raw(sqlString);
  }

  if (Array.isArray(params)) {
    // Positional parameters: replace $1, $2, etc. with actual values
    // We need to parse the SQL string and inject parameters using sql template
    const sqlChunks: SQL[] = [];
    let currentPos = 0;
    let paramIndex = 0;

    // Match $1, $2, etc. placeholders (PostgreSQL style)
    // Also match ? placeholders (MySQL/SQLite style)
    const placeholderRegex = /\$(\d+)|\?/g;
    let match;

    while ((match = placeholderRegex.exec(sqlString)) !== null) {
      // Add the SQL text before the placeholder
      if (match.index > currentPos) {
        sqlChunks.push(sql.raw(sqlString.substring(currentPos, match.index)));
      }

      // Add the parameter value
      const paramValue = match[1] 
        ? params[parseInt(match[1], 10) - 1]  // $1 -> params[0]
        : params[paramIndex];                  // ? -> params[paramIndex]

      sqlChunks.push(sql`${paramValue}`);
      
      if (!match[1]) {
        // Only increment for ? placeholders
        paramIndex++;
      }

      currentPos = match.index + match[0].length;
    }

    // Add any remaining SQL text
    if (currentPos < sqlString.length) {
      sqlChunks.push(sql.raw(sqlString.substring(currentPos)));
    }

    return sqlChunks.length > 0 ? sql.join(sqlChunks, sql.raw('')) : sql.raw(sqlString);
  } else {
    // Named parameters: replace :name, :age, etc. with actual values
    const sqlChunks: SQL[] = [];
    let currentPos = 0;

    // Match :paramName placeholders
    const namedParamRegex = /:(\w+)/g;
    let match;

    while ((match = namedParamRegex.exec(sqlString)) !== null) {
      // Add the SQL text before the placeholder
      if (match.index > currentPos) {
        sqlChunks.push(sql.raw(sqlString.substring(currentPos, match.index)));
      }

      // Add the parameter value
      const paramName = match[1];
      const paramValue = params[paramName];

      if (paramValue === undefined) {
        throw new Error(`Missing parameter: ${paramName}`);
      }

      sqlChunks.push(sql`${paramValue}`);
      currentPos = match.index + match[0].length;
    }

    // Add any remaining SQL text
    if (currentPos < sqlString.length) {
      sqlChunks.push(sql.raw(sqlString.substring(currentPos)));
    }

    return sqlChunks.length > 0 ? sql.join(sqlChunks, sql.raw('')) : sql.raw(sqlString);
  }
}

/**
 * Execute a parameterized SQL query
 * 
 * This function executes a SQL query with proper parameter binding to prevent
 * SQL injection. It supports SELECT, INSERT, UPDATE, DELETE, and other SQL statements.
 * 
 * @param manager - ConnectionManager instance with initialized database connection
 * @param input - Query input with SQL string, parameters, and options
 * @returns Query execution result with rows, row count, and execution time
 * @throws {Error} If database is not initialized or query execution fails
 */
export async function executeQuery(
  manager: ConnectionManager,
  input: QueryInput
): Promise<QueryExecutionResult> {
  const startTime = Date.now();

  logger.debug('Executing query', {
    vendor: input.vendor,
    sqlPreview: input.sql.substring(0, 100),
    hasParams: !!input.params,
    paramCount: input.params 
      ? (Array.isArray(input.params) ? input.params.length : Object.keys(input.params).length)
      : 0
  });

  try {
    // Build parameterized query
    const parameterizedQuery = buildParameterizedQuery(input.sql, input.params);

    // Execute query through ConnectionManager's db instance
    // @ts-expect-error - Accessing private db property for query execution
    const result = await manager['db'].execute(parameterizedQuery);

    const executionTime = Date.now() - startTime;

    // Format result based on database response
    const rows = Array.isArray(result) ? result : (result as unknown as { rows?: unknown[] }).rows || [];
    const rowCount = (result as unknown as { rowCount?: number; affectedRows?: number }).rowCount ||
                     (result as unknown as { rowCount?: number; affectedRows?: number }).affectedRows ||
                     rows.length;

    logger.debug('Query executed successfully', {
      vendor: input.vendor,
      rowCount,
      executionTime
    });

    return {
      rows,
      rowCount,
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error('Query execution failed', {
      vendor: input.vendor,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    });

    // Sanitize error message to avoid leaking sensitive information
    const sanitizedMessage = error instanceof Error 
      ? `Query execution failed: ${error.message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')}`
      : 'Query execution failed with unknown error';

    throw new Error(sanitizedMessage, { cause: error });
  }
}

