/**
 * Neo4j Vector Search Tool
 * 
 * Perform semantic search using vector indexes for GraphRAG applications.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { neo4jVectorSearchSchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { formatResults } from '../utils/result-formatter.js';

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
        const session = neo4jPool.getSession(input.database);
        
        try {
          // Use db.index.vector.queryNodes for vector similarity search
          const cypher = `
            CALL db.index.vector.queryNodes($indexName, $limit, $queryVector)
            YIELD node, score
            RETURN node, score
            ORDER BY score DESC
          `;

          const parameters = {
            indexName: input.indexName,
            limit: input.limit,
            queryVector: input.queryVector,
          };

          const result = await session.run(cypher, parameters);
          const formattedResults = formatResults(result.records);

          return {
            success: true,
            results: formattedResults.map((r) => ({
              node: r.node,
              score: r.score,
            })),
            count: result.records.length,
            query: {
              indexName: input.indexName,
              vectorDimension: input.queryVector.length,
              limit: input.limit,
            },
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to perform vector search';
        
        // Provide helpful error messages for common issues
        let helpText = '';
        if (errorMessage.includes('index') || errorMessage.includes('not found')) {
          helpText = ' Make sure the vector index exists. Create one with: CREATE VECTOR INDEX <name> FOR (n:Label) ON (n.embedding)';
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

