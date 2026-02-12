/**
 * Neo4j Create Node with Embedding Tool
 *
 * Create a node with automatic embedding generation from text content.
 * This tool simplifies GraphRAG setup by handling embedding generation automatically.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { neo4jCreateNodeWithEmbeddingSchema } from '../types.js';
import { neo4jPool } from '../connection.js';
import { formatResults } from '../utils/result-formatter.js';
import { embeddingManager } from '../embeddings/embedding-manager.js';
import { validateLabel, validatePropertyKey } from '../utils/cypher-sanitizer.js';

/**
 * Create Neo4j create node with embedding tool
 */
export function createNeo4jCreateNodeWithEmbeddingTool() {
  return toolBuilder()
    .name('neo4j-create-node-with-embedding')
    .description(
      'Create a Neo4j node with automatic embedding generation from text content. ' +
      'This tool extracts text from a specified property, generates an embedding vector, ' +
      'and stores both the original properties and the embedding in the node. ' +
      'Perfect for building GraphRAG knowledge bases. ' +
      'Requires embedding provider (OpenAI) to be configured.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'create', 'node', 'embedding', 'graphrag', 'ai'])
    .schema(neo4jCreateNodeWithEmbeddingSchema)
    .implement(async (input) => {
      // Check Neo4j connection
      if (!neo4jPool.isInitialized()) {
        return {
          success: false,
          error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
        };
      }

      // Check embedding manager
      if (!embeddingManager.isInitialized()) {
        return {
          success: false,
          error: 'Embedding manager not initialized. Please configure embedding provider (set OPENAI_API_KEY and optionally EMBEDDING_MODEL).',
        };
      }

      try {
        // Extract text from properties
        const textToEmbed = input.properties[input.textProperty];
        
        if (!textToEmbed || typeof textToEmbed !== 'string') {
          return {
            success: false,
            error: `Property '${input.textProperty}' not found or is not a string in the provided properties.`,
          };
        }

        // Generate embedding from text
        const embeddingResult = await embeddingManager.generateEmbedding(textToEmbed, input.model);

        // Validate label and property names to prevent injection
        const safeLabel = validateLabel(input.label);
        const safeEmbeddingProp = validatePropertyKey(input.embeddingProperty || 'embedding');

        // Create node with properties and embedding
        const session = neo4jPool.getSession(input.database);

        try {
          // Build properties object with embedding
          const allProperties: Record<string, any> = {
            ...input.properties,
          };
          allProperties[input.embeddingProperty || 'embedding'] = embeddingResult.embedding;

          // Create the node with safe label
          const cypher = `
            CREATE (n:${safeLabel})
            SET n = $properties
            RETURN n, id(n) as nodeId
          `;

          const parameters = {
            properties: allProperties,
          };

          const result = await session.run(cypher, parameters);
          const formattedResults = formatResults(result.records);

          if (formattedResults.length === 0) {
            return {
              success: false,
              error: 'Failed to create node',
            };
          }

          const createdNode = formattedResults[0];

          return {
            success: true,
            node: createdNode.n,
            nodeId: createdNode.nodeId,
            embedding: {
              model: embeddingResult.model,
              dimensions: embeddingResult.dimensions,
              property: safeEmbeddingProp,
              usage: embeddingResult.usage,
            },
            message: `Created node with label '${input.label}' and ${embeddingResult.dimensions}-dimensional embedding`,
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create node with embedding';
        
        // Provide helpful error messages for common issues
        let helpText = '';
        if (errorMessage.includes('API key') || errorMessage.includes('not initialized')) {
          helpText = ' Make sure OPENAI_API_KEY is set in your environment variables.';
        } else if (errorMessage.includes('Syntax error') || errorMessage.includes('Invalid')) {
          helpText = ' Check that the label and property names are valid.';
        }

        return {
          success: false,
          error: errorMessage + helpText,
        };
      }
    })
    .build();
}

