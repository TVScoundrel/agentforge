/**
 * Neo4j Tools Tests
 *
 * Integration tests for Neo4j graph database tools.
 *
 * These tests require a running Neo4j instance.
 * Set RUN_INTEGRATION_TESTS=true to enable.
 *
 * Example:
 *   RUN_INTEGRATION_TESTS=true NEO4J_URI=bolt://localhost:7687 NEO4J_USER=neo4j NEO4J_PASSWORD=password pnpm test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  neo4jPool,
  neo4jQuery,
  neo4jGetSchema,
  neo4jFindNodes,
  neo4jTraverse,
  neo4jVectorSearch,
  initializeNeo4jTools,
} from '../../src/data/neo4j/index.js';

const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!shouldRunIntegrationTests)('Neo4j Tools (Integration)', () => {
  beforeAll(async () => {
    // Use environment variables for connection
    // Defaults provided for local development
    if (!process.env.NEO4J_URI) {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
    }
    if (!process.env.NEO4J_USER) {
      process.env.NEO4J_USER = 'neo4j';
    }
    if (!process.env.NEO4J_PASSWORD) {
      process.env.NEO4J_PASSWORD = 'password';
    }

    try {
      await initializeNeo4jTools();
    } catch (error) {
      console.error('Failed to initialize Neo4j connection. Make sure Neo4j is running.');
      console.error('Set RUN_INTEGRATION_TESTS=true and provide connection details via environment variables.');
      throw error;
    }
  });

  afterAll(async () => {
    if (neo4jPool.isInitialized()) {
      await neo4jPool.close();
    }
  });

  describe('Connection', () => {
    it('should initialize connection successfully', () => {
      expect(neo4jPool.isInitialized()).toBe(true);
    });

    it('should verify connectivity', async () => {
      await expect(neo4jPool.verifyConnectivity()).resolves.not.toThrow();
    });
  });

  describe('neo4j-query', () => {
    it('should execute a simple query', async () => {
      const result = await neo4jQuery.execute({
        cypher: 'RETURN 1 as number, "hello" as text',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ number: 1, text: 'hello' });
    });

    it('should execute parameterized query', async () => {
      const result = await neo4jQuery.execute({
        cypher: 'RETURN $name as name, $age as age',
        parameters: { name: 'John', age: 30 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ name: 'John', age: 30 });
    });

    it('should create and delete test nodes', async () => {
      // Create a test node
      const createResult = await neo4jQuery.execute({
        cypher: 'CREATE (n:TestNode {name: $name, timestamp: timestamp()}) RETURN n',
        parameters: { name: 'Test' },
      });

      expect(createResult.success).toBe(true);
      expect(createResult.summary?.counters.nodesCreated).toBe(1);

      // Delete test nodes
      const deleteResult = await neo4jQuery.execute({
        cypher: 'MATCH (n:TestNode) DELETE n',
      });

      expect(deleteResult.success).toBe(true);
    });

    it('should handle query errors gracefully', async () => {
      const result = await neo4jQuery.execute({
        cypher: 'INVALID CYPHER QUERY',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('neo4j-get-schema', () => {
    it('should retrieve graph schema', async () => {
      const result = await neo4jGetSchema.execute({});

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
      expect(result.schema.nodeLabels).toBeInstanceOf(Array);
      expect(result.schema.relationshipTypes).toBeInstanceOf(Array);
      expect(result.schema.propertyKeys).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
    });
  });

  describe('neo4j-find-nodes', () => {
    beforeAll(async () => {
      // Create test data
      await neo4jQuery.execute({
        cypher: `
          CREATE (p1:Person {name: 'Alice', age: 30})
          CREATE (p2:Person {name: 'Bob', age: 25})
          CREATE (p3:Person {name: 'Charlie', age: 35})
        `,
      });
    });

    afterAll(async () => {
      // Clean up test data
      await neo4jQuery.execute({
        cypher: 'MATCH (p:Person) WHERE p.name IN ["Alice", "Bob", "Charlie"] DELETE p',
      });
    });

    it('should find nodes by label', async () => {
      const result = await neo4jFindNodes.execute({
        label: 'Person',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.nodes).toBeInstanceOf(Array);
      expect(result.count).toBeGreaterThan(0);
    });

    it('should find nodes by label and properties', async () => {
      const result = await neo4jFindNodes.execute({
        label: 'Person',
        properties: { name: 'Alice' },
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].properties.name).toBe('Alice');
    });
  });

  describe('neo4j-traverse', () => {
    let aliceId: number;
    let bobId: number;

    beforeAll(async () => {
      // Create test graph
      const result = await neo4jQuery.execute({
        cypher: `
          CREATE (alice:Person {name: 'Alice'})
          CREATE (bob:Person {name: 'Bob'})
          CREATE (charlie:Person {name: 'Charlie'})
          CREATE (alice)-[:KNOWS]->(bob)
          CREATE (bob)-[:KNOWS]->(charlie)
          RETURN id(alice) as aliceId, id(bob) as bobId
        `,
      });

      aliceId = result.data[0].aliceId;
      bobId = result.data[0].bobId;
    });

    afterAll(async () => {
      // Clean up test data
      await neo4jQuery.execute({
        cypher: 'MATCH (p:Person) WHERE p.name IN ["Alice", "Bob", "Charlie"] DETACH DELETE p',
      });
    });

    it('should traverse outgoing relationships', async () => {
      const result = await neo4jTraverse.execute({
        startNodeId: aliceId,
        relationshipType: 'KNOWS',
        direction: 'outgoing',
        maxDepth: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.paths).toBeInstanceOf(Array);
      expect(result.count).toBeGreaterThan(0);
    });

    it('should traverse with max depth', async () => {
      const result = await neo4jTraverse.execute({
        startNodeId: aliceId,
        relationshipType: 'KNOWS',
        direction: 'outgoing',
        maxDepth: 2,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.paths).toBeInstanceOf(Array);
      // Should find both Bob and Charlie
      expect(result.count).toBeGreaterThanOrEqual(2);
    });

    it('should traverse incoming relationships', async () => {
      const result = await neo4jTraverse.execute({
        startNodeId: bobId,
        relationshipType: 'KNOWS',
        direction: 'incoming',
        maxDepth: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.paths).toBeInstanceOf(Array);
    });
  });

  describe('neo4j-vector-search', () => {
    it('should handle missing vector index gracefully', async () => {
      const result = await neo4jVectorSearch.execute({
        indexName: 'nonexistent_index',
        queryVector: [0.1, 0.2, 0.3],
        limit: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('index');
    });

    // Note: To test vector search properly, you would need to:
    // 1. Create a vector index: CREATE VECTOR INDEX my_index FOR (n:Document) ON (n.embedding)
    // 2. Add nodes with embeddings: CREATE (n:Document {text: "...", embedding: [...]})
    // 3. Then run the search
  });
});

