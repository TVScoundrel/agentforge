/**
 * Neo4j Find Nodes Tool
 *
 * Find nodes by label and properties.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { neo4jFindNodesSchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { formatResults } from '../utils/result-formatter.js';
import { validateLabel, buildPropertyFilter } from '../utils/cypher-sanitizer.js';

/**
 * Create Neo4j find nodes tool
 */
export function createNeo4jFindNodesTool() {
  return toolBuilder()
    .name('neo4j-find-nodes')
    .description(
      'Find nodes in the Neo4j graph by label and optional property filters. ' +
      'This is a simplified interface for common node lookup operations. ' +
      'Returns nodes matching the specified criteria.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'nodes', 'search'])
    .schema(neo4jFindNodesSchema)
    .implement(async (input) => {
      if (!neo4jPool.isInitialized()) {
        return {
          success: false,
          error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
        };
      }

      try {
        // Validate and escape the label to prevent injection
        const safeLabel = validateLabel(input.label);

        const session = neo4jPool.getSession(input.database);

        try {
          // Build the Cypher query with safe identifiers
          let cypher = `MATCH (n:${safeLabel})`;
          let parameters: Record<string, any> = {};

          // Add property filters if provided (using safe parameter binding)
          if (input.properties && Object.keys(input.properties).length > 0) {
            const { whereClause, parameters: filterParams } = buildPropertyFilter(input.properties, 'n');
            cypher += ` ${whereClause}`;
            parameters = { ...parameters, ...filterParams };
          }

          // Use parameter for limit to be extra safe
          cypher += ` RETURN n LIMIT $limit`;
          parameters.limit = input.limit;

          const result = await session.run(cypher, parameters);
          const formattedResults = formatResults(result.records);

          return {
            success: true,
            nodes: formattedResults.map((r) => r.n),
            count: result.records.length,
            query: {
              label: input.label,
              properties: input.properties,
              limit: input.limit,
            },
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to find nodes',
          query: {
            label: input.label,
            properties: input.properties,
          },
        };
      }
    })
    .build();
}

