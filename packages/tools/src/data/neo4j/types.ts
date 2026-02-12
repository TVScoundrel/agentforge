/**
 * Neo4j Tools Types
 * 
 * Type definitions and schemas for Neo4j graph database tools.
 */

import { z } from 'zod';

/**
 * Neo4j connection configuration
 */
export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionTimeout?: number;
}

/**
 * Neo4j query schema
 */
export const neo4jQuerySchema = z.object({
  cypher: z.string().describe('Cypher query to execute'),
  parameters: z.record(z.any()).optional().describe('Query parameters for parameterized queries'),
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j get schema input schema
 */
export const neo4jGetSchemaSchema = z.object({
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j find nodes schema
 */
export const neo4jFindNodesSchema = z.object({
  label: z.string().describe('Node label to search for'),
  properties: z.record(z.any()).optional().describe('Properties to match (key-value pairs)'),
  limit: z.number().default(100).describe('Maximum number of nodes to return'),
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j traverse schema
 */
export const neo4jTraverseSchema = z.object({
  startNodeId: z.union([
    z.string().describe('Node ID as string'),
    z.number().describe('Node ID as number')
  ]).describe('ID of the starting node'),
  relationshipType: z.string().optional().describe('Type of relationship to follow (optional, follows all if not specified)'),
  direction: z.enum(['outgoing', 'incoming', 'both']).default('outgoing').describe('Direction to traverse'),
  maxDepth: z.number().default(1).describe('Maximum depth to traverse'),
  limit: z.number().default(100).describe('Maximum number of nodes to return'),
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j vector search schema
 */
export const neo4jVectorSearchSchema = z.object({
  indexName: z.string().describe('Name of the vector index to search'),
  queryVector: z.array(z.number().describe('Vector dimension value')).describe('Query vector for similarity search'),
  limit: z.number().default(10).describe('Maximum number of results to return'),
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j vector search with embedding schema
 */
export const neo4jVectorSearchWithEmbeddingSchema = z.object({
  indexName: z.string().describe('Name of the vector index to search'),
  queryText: z.string().describe('Text to generate embedding from for similarity search'),
  limit: z.number().default(10).describe('Maximum number of results to return'),
  model: z.string().optional().describe('Embedding model to use (defaults to configured model)'),
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j create node with embedding schema
 */
export const neo4jCreateNodeWithEmbeddingSchema = z.object({
  label: z.string().describe('Node label'),
  properties: z.record(z.string(), z.any().describe('Property value')).describe('Node properties (key-value pairs)'),
  textProperty: z.string().describe('Name of the property containing text to embed'),
  embeddingProperty: z.string().default('embedding').describe('Name of the property to store the embedding vector'),
  model: z.string().optional().describe('Embedding model to use (defaults to configured model)'),
  database: z.string().optional().describe('Database name (defaults to configured database)'),
});

/**
 * Neo4j node result
 */
export interface Neo4jNode {
  identity: string | number;
  labels: string[];
  properties: Record<string, any>;
}

/**
 * Neo4j relationship result
 */
export interface Neo4jRelationship {
  identity: string | number;
  type: string;
  start: string | number;
  end: string | number;
  properties: Record<string, any>;
}

/**
 * Neo4j path result
 */
export interface Neo4jPath {
  start: Neo4jNode;
  end: Neo4jNode;
  segments: Array<{
    start: Neo4jNode;
    relationship: Neo4jRelationship;
    end: Neo4jNode;
  }>;
  length: number;
}

/**
 * Neo4j schema information
 */
export interface Neo4jSchema {
  nodeLabels: string[];
  relationshipTypes: string[];
  propertyKeys: string[];
  constraints: Array<{
    label?: string;
    type: string;
    properties: string[];
  }>;
  indexes: Array<{
    label?: string;
    type: string;
    properties: string[];
  }>;
}

/**
 * Neo4j tools configuration
 */
export interface Neo4jToolsConfig {
  uri?: string;
  username?: string;
  password?: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionTimeout?: number;
}

