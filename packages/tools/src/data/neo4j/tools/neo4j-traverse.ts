/**
 * Neo4j Traverse Tool
 *
 * Traverse the graph from a starting node following relationships.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { neo4jTraverseSchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { formatResults } from '../utils/result-formatter.js';
import { validateRelationshipType, validateDirection } from '../utils/cypher-sanitizer.js';

/**
 * Create Neo4j traverse tool
 */
export function createNeo4jTraverseTool() {
  return toolBuilder()
    .name('neo4j-traverse')
    .description(
      'Traverse the Neo4j graph from a starting node by following relationships. ' +
      'Supports filtering by relationship type, direction, and maximum depth. ' +
      'Returns connected nodes and their relationships.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'traverse', 'relationships'])
    .schema(neo4jTraverseSchema)
    .implement(async (input) => {
      if (!neo4jPool.isInitialized()) {
        return {
          success: false,
          error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
        };
      }

      try {
        // Validate direction (with default fallback)
        const safeDirection = validateDirection(input.direction || 'outgoing');

        // Validate relationship type if provided
        const safeRelType = input.relationshipType
          ? validateRelationshipType(input.relationshipType)
          : null;

        const session = neo4jPool.getSession(input.database);

        try {
          // Build relationship pattern based on direction with safe identifiers
          let relPattern = '';
          if (safeDirection === 'OUTGOING') {
            relPattern = safeRelType
              ? `-[r:${safeRelType}*1..${input.maxDepth}]->`
              : `-[r*1..${input.maxDepth}]->`;
          } else if (safeDirection === 'INCOMING') {
            relPattern = safeRelType
              ? `<-[r:${safeRelType}*1..${input.maxDepth}]-`
              : `<-[r*1..${input.maxDepth}]-`;
          } else {
            relPattern = safeRelType
              ? `-[r:${safeRelType}*1..${input.maxDepth}]-`
              : `-[r*1..${input.maxDepth}]-`;
          }

          // Build the Cypher query
          const cypher = `
            MATCH path = (start)${relPattern}(end)
            WHERE id(start) = $startNodeId
            RETURN start, end, relationships(path) as rels, length(path) as depth
            LIMIT $limit
          `;

          const parameters = {
            startNodeId: typeof input.startNodeId === 'string' 
              ? parseInt(input.startNodeId, 10) 
              : input.startNodeId,
            limit: input.limit,
          };

          const result = await session.run(cypher, parameters);
          const formattedResults = formatResults(result.records);

          return {
            success: true,
            paths: formattedResults.map((r) => ({
              start: r.start,
              end: r.end,
              relationships: r.rels,
              depth: r.depth,
            })),
            count: result.records.length,
            query: {
              startNodeId: input.startNodeId,
              relationshipType: input.relationshipType,
              direction: input.direction,
              maxDepth: input.maxDepth,
            },
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to traverse graph',
          query: {
            startNodeId: input.startNodeId,
            relationshipType: input.relationshipType,
            direction: input.direction,
          },
        };
      }
    })
    .build();
}

