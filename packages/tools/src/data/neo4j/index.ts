/**
 * Neo4j Tools
 *
 * Tools for interacting with Neo4j graph database.
 * Supports knowledge graphs, GraphRAG, and graph analytics.
 */

export * from './types.js';
export * from './connection.js';
export * from './embeddings/index.js';
export { createNeo4jQueryTool } from './tools/neo4j-query.js';
export { createNeo4jGetSchemaTool } from './tools/neo4j-get-schema.js';
export { createNeo4jFindNodesTool } from './tools/neo4j-find-nodes.js';
export { createNeo4jTraverseTool } from './tools/neo4j-traverse.js';
export { createNeo4jVectorSearchTool } from './tools/neo4j-vector-search.js';
export { createNeo4jVectorSearchWithEmbeddingTool } from './tools/neo4j-vector-search-with-embedding.js';
export { createNeo4jCreateNodeWithEmbeddingTool } from './tools/neo4j-create-node-with-embedding.js';

import { createNeo4jQueryTool } from './tools/neo4j-query.js';
import { createNeo4jGetSchemaTool } from './tools/neo4j-get-schema.js';
import { createNeo4jFindNodesTool } from './tools/neo4j-find-nodes.js';
import { createNeo4jTraverseTool } from './tools/neo4j-traverse.js';
import { createNeo4jVectorSearchTool } from './tools/neo4j-vector-search.js';
import { createNeo4jVectorSearchWithEmbeddingTool } from './tools/neo4j-vector-search-with-embedding.js';
import { createNeo4jCreateNodeWithEmbeddingTool } from './tools/neo4j-create-node-with-embedding.js';
import type { Neo4jToolsConfig } from './types.js';
import { neo4jPool, initializeFromEnv } from './connection.js';
import { embeddingManager } from './embeddings/embedding-manager.js';

/**
 * Default Neo4j query tool instance
 */
export const neo4jQuery = createNeo4jQueryTool();

/**
 * Default Neo4j get schema tool instance
 */
export const neo4jGetSchema = createNeo4jGetSchemaTool();

/**
 * Default Neo4j find nodes tool instance
 */
export const neo4jFindNodes = createNeo4jFindNodesTool();

/**
 * Default Neo4j traverse tool instance
 */
export const neo4jTraverse = createNeo4jTraverseTool();

/**
 * Default Neo4j vector search tool instance
 */
export const neo4jVectorSearch = createNeo4jVectorSearchTool();

/**
 * Default Neo4j vector search with embedding tool instance
 */
export const neo4jVectorSearchWithEmbedding = createNeo4jVectorSearchWithEmbeddingTool();

/**
 * Default Neo4j create node with embedding tool instance
 */
export const neo4jCreateNodeWithEmbedding = createNeo4jCreateNodeWithEmbeddingTool();

/**
 * All Neo4j tools (including embedding-enabled tools)
 */
export const neo4jTools = [
  neo4jQuery,
  neo4jGetSchema,
  neo4jFindNodes,
  neo4jTraverse,
  neo4jVectorSearch,
  neo4jVectorSearchWithEmbedding,
  neo4jCreateNodeWithEmbedding,
];

/**
 * Core Neo4j tools (without embedding features)
 */
export const neo4jCoreTools = [
  neo4jQuery,
  neo4jGetSchema,
  neo4jFindNodes,
  neo4jTraverse,
  neo4jVectorSearch,
];

/**
 * Create Neo4j tools with custom configuration
 */
export function createNeo4jTools(config: Neo4jToolsConfig = {}, includeEmbeddingTools: boolean = true) {
  // Initialize connection if config provided
  if (config.uri && config.username && config.password) {
    neo4jPool.initialize({
      uri: config.uri,
      username: config.username,
      password: config.password,
      database: config.database,
      maxConnectionPoolSize: config.maxConnectionPoolSize,
      connectionTimeout: config.connectionTimeout,
    }).catch((error) => {
      console.error('Failed to initialize Neo4j connection:', error);
    });
  }

  const coreTools = [
    createNeo4jQueryTool(),
    createNeo4jGetSchemaTool(),
    createNeo4jFindNodesTool(),
    createNeo4jTraverseTool(),
    createNeo4jVectorSearchTool(),
  ];

  if (includeEmbeddingTools) {
    return [
      ...coreTools,
      createNeo4jVectorSearchWithEmbeddingTool(),
      createNeo4jCreateNodeWithEmbeddingTool(),
    ];
  }

  return coreTools;
}

/**
 * Initialize Neo4j tools from environment variables
 *
 * Required environment variables:
 * - NEO4J_URI: Neo4j connection URI (e.g., bolt://localhost:7687)
 * - NEO4J_USER: Neo4j username
 * - NEO4J_PASSWORD: Neo4j password
 *
 * Optional environment variables:
 * - NEO4J_DATABASE: Database name (defaults to 'neo4j')
 *
 * For embedding-enabled tools, also set:
 * - OPENAI_API_KEY: OpenAI API key for embedding generation
 * - EMBEDDING_MODEL: Embedding model to use (defaults to 'text-embedding-3-small')
 * - EMBEDDING_PROVIDER: Embedding provider (defaults to 'openai')
 */
export async function initializeNeo4jTools(): Promise<void> {
  await initializeFromEnv();

  // Try to initialize embeddings (optional - will only work if API key is set)
  try {
    embeddingManager.initializeFromEnv();
  } catch (error) {
    // Embedding initialization is optional - tools will work without it
    // Only the embedding-enabled tools will fail if embeddings aren't configured
  }
}

