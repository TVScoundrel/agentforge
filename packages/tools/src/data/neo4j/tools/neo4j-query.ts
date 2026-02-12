/**
 * Neo4j Query Tool
 *
 * Execute arbitrary Cypher queries against Neo4j database.
 */

import { toolBuilder, ToolCategory, createLogger } from '@agentforge/core';
import { neo4jQuerySchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { formatResults } from '../utils/result-formatter.js';

const logger = createLogger('agentforge:tools:neo4j:query');

/**
 * Create Neo4j query tool
 */
export function createNeo4jQueryTool() {
  return toolBuilder()
    .name('neo4j-query')
    .description(
      'Execute a Cypher query against the Neo4j graph database. ' +
      'Supports parameterized queries for safety. Use this for complex queries, ' +
      'graph traversals, and custom operations.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'cypher', 'query'])
    .schema(neo4jQuerySchema)
    .implement(async (input) => {
      if (!neo4jPool.isInitialized()) {
        logger.warn('Neo4j query attempted but connection not initialized');
        return {
          success: false,
          error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
        };
      }

      const startTime = Date.now();

      logger.debug('Executing Neo4j query', {
        cypherPreview: input.cypher.substring(0, 100),
        parameterCount: Object.keys(input.parameters || {}).length,
        database: input.database,
      });

      try {
        const session = neo4jPool.getSession(input.database);

        try {
          const result = await session.run(input.cypher, input.parameters || {});
          const formattedResults = formatResults(result.records);
          const duration = Date.now() - startTime;

          logger.info('Neo4j query executed successfully', {
            recordCount: result.records.length,
            nodesCreated: result.summary.counters.updates().nodesCreated,
            nodesDeleted: result.summary.counters.updates().nodesDeleted,
            relationshipsCreated: result.summary.counters.updates().relationshipsCreated,
            relationshipsDeleted: result.summary.counters.updates().relationshipsDeleted,
            propertiesSet: result.summary.counters.updates().propertiesSet,
            duration,
          });

          return {
            success: true,
            data: formattedResults,
            recordCount: result.records.length,
            summary: {
              query: input.cypher,
              parameters: input.parameters,
              counters: {
                nodesCreated: result.summary.counters.updates().nodesCreated,
                nodesDeleted: result.summary.counters.updates().nodesDeleted,
                relationshipsCreated: result.summary.counters.updates().relationshipsCreated,
                relationshipsDeleted: result.summary.counters.updates().relationshipsDeleted,
                propertiesSet: result.summary.counters.updates().propertiesSet,
              },
            },
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Failed to execute query';

        logger.error('Neo4j query execution failed', {
          error: errorMessage,
          cypherPreview: input.cypher.substring(0, 100),
          duration,
        });

        return {
          success: false,
          error: errorMessage,
          query: input.cypher,
        };
      }
    })
    .build();
}

