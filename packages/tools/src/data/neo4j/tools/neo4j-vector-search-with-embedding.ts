/**
 * Neo4j Vector Search with Embedding Tool
 *
 * Perform semantic search by automatically generating embeddings from text.
 * This tool combines embedding generation with vector search for easier GraphRAG.
 */

import { toolBuilder, ToolCategory, createLogger } from '@agentforge/core';
import { neo4jVectorSearchWithEmbeddingSchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { formatResults } from '../utils/result-formatter.js';
import { embeddingManager } from '../embeddings/embedding-manager.js';

const logger = createLogger('agentforge:tools:neo4j:vector-search');

/**
 * Create Neo4j vector search with embedding tool
 */
export function createNeo4jVectorSearchWithEmbeddingTool() {
  return toolBuilder()
    .name('neo4j-vector-search-with-embedding')
    .description(
      'Perform semantic similarity search in Neo4j by automatically generating embeddings from text. ' +
      'This tool takes text input, generates an embedding vector, and searches for similar nodes. ' +
      'Essential for GraphRAG applications - no need to manually generate embeddings. ' +
      'Requires a vector index and embedding provider (OpenAI) to be configured.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'vector', 'search', 'semantic', 'graphrag', 'embedding', 'ai'])
    .schema(neo4jVectorSearchWithEmbeddingSchema)
    .implement(async (input) => {
      // Check Neo4j connection
      if (!neo4jPool.isInitialized()) {
        logger.warn('Vector search attempted but Neo4j connection not initialized');
        return {
          success: false,
          error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
        };
      }

      // Check embedding manager
      if (!embeddingManager.isInitialized()) {
        logger.warn('Vector search attempted but embedding manager not initialized');
        return {
          success: false,
          error: 'Embedding manager not initialized. Please configure embedding provider (set OPENAI_API_KEY and optionally EMBEDDING_MODEL).',
        };
      }

      const startTime = Date.now();

      logger.debug('Performing vector search with embedding', {
        queryTextLength: input.queryText.length,
        indexName: input.indexName,
        limit: input.limit,
        model: input.model,
      });

      try {
        // Generate embedding from text
        const embeddingResult = await embeddingManager.generateEmbedding(input.queryText, input.model);

        // Perform vector search
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
            queryVector: embeddingResult.embedding,
          };

          const result = await session.run(cypher, parameters);
          const formattedResults = formatResults(result.records);
          const duration = Date.now() - startTime;

          logger.info('Vector search completed successfully', {
            resultCount: result.records.length,
            indexName: input.indexName,
            embeddingModel: embeddingResult.model,
            embeddingDimensions: embeddingResult.dimensions,
            duration,
          });

          return {
            success: true,
            results: formattedResults.map((r) => ({
              node: r.node,
              score: r.score,
            })),
            count: result.records.length,
            query: {
              text: input.queryText,
              indexName: input.indexName,
              embeddingModel: embeddingResult.model,
              vectorDimension: embeddingResult.dimensions,
              limit: input.limit,
            },
            embedding: {
              model: embeddingResult.model,
              dimensions: embeddingResult.dimensions,
              usage: embeddingResult.usage,
            },
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Failed to perform vector search with embedding';

        // Provide helpful error messages for common issues
        let helpText = '';
        if (errorMessage.includes('index') || errorMessage.includes('not found')) {
          helpText = ' Make sure the vector index exists. Create one with: CREATE VECTOR INDEX <name> FOR (n:Label) ON (n.embedding)';
        } else if (errorMessage.includes('API key') || errorMessage.includes('not initialized')) {
          helpText = ' Make sure OPENAI_API_KEY is set in your environment variables.';
        } else if (errorMessage.includes('dimension')) {
          helpText = ' Make sure the vector index dimensions match your embedding model dimensions.';
        }

        logger.error('Vector search failed', {
          error: errorMessage,
          indexName: input.indexName,
          queryTextLength: input.queryText.length,
          duration,
        });

        return {
          success: false,
          error: errorMessage + helpText,
          query: {
            text: input.queryText,
            indexName: input.indexName,
          },
        };
      }
    })
    .build();
}

