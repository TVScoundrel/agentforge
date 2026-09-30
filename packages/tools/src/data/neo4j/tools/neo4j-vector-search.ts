/**
 * Neo4j Vector Search Tool
 *
 * Perform semantic search using vector indexes for GraphRAG applications.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { neo4jVectorSearchSchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { withNeo4jSession } from './session-owner.js';
import { executeVectorSearch } from './vector-search-execution.js';

/**
 * Create Neo4j vector search tool
 */
export function createNeo4jVectorSearchTool() {
  return toolBuilder()
    .name('neo4j-vector-search')
    .description(
      'Perform semantic similarity search using vector indexes in Neo4j. ' +
        'Essential for GraphRAG applications - finds nodes with similar embeddings. ' +
        'Requires a vector index to be created in advance.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'vector', 'search', 'semantic', 'graphrag'])
    .schema(neo4jVectorSearchSchema)
    .implement(async (input) => {
      if (!neo4jPool.isInitialized()) {
        return {
          success: false,
          error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
        };
      }

      try {
        return await withNeo4jSession(input.database, async (session) => {
          const { results, count } = await executeVectorSearch(
            session,
            input.indexName,
            input.limit,
            input.queryVector
          );

          return {
            success: true,
            results,
            count,
            query: {
              indexName: input.indexName,
              vectorDimension: input.queryVector.length,
              limit: input.limit,
            },
          };
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to perform vector search';

        // Provide helpful error messages for common issues
        let helpText = '';
        if (errorMessage.includes('index') || errorMessage.includes('not found')) {
          helpText =
            ' Make sure the vector index exists. Create one with: CREATE VECTOR INDEX <name> FOR (n:Label) ON (n.embedding)';
        }

        return {
          success: false,
          error: errorMessage + helpText,
          query: {
            indexName: input.indexName,
            vectorDimension: input.queryVector.length,
          },
        };
      }
    })
    .build();
}
