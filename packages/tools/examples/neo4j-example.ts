/**
 * Neo4j Tools Example
 * 
 * Demonstrates how to use Neo4j tools for knowledge graphs and GraphRAG.
 */

import {
  initializeNeo4jTools,
  neo4jQuery,
  neo4jGetSchema,
  neo4jFindNodes,
  neo4jTraverse,
  neo4jPool,
} from '../src/data/neo4j/index.js';

async function main() {
  console.log('🚀 Neo4j Tools Example\n');

  // Initialize connection from environment variables
  console.log('📡 Connecting to Neo4j...');
  await initializeNeo4jTools();
  console.log('✅ Connected successfully!\n');

  // Example 1: Simple query
  console.log('📊 Example 1: Simple Query');
  const simpleResult = await neo4jQuery.execute({
    cypher: 'RETURN "Hello from Neo4j!" as message, timestamp() as time',
  });
  console.log('Result:', JSON.stringify(simpleResult, null, 2));
  console.log();

  // Example 2: Get schema
  console.log('🔍 Example 2: Get Graph Schema');
  const schemaResult = await neo4jGetSchema.execute({});
  if (schemaResult.success) {
    console.log('Node Labels:', schemaResult.schema.nodeLabels);
    console.log('Relationship Types:', schemaResult.schema.relationshipTypes);
    console.log('Summary:', schemaResult.summary);
  }
  console.log();

  // Example 3: Create a small knowledge graph
  console.log('🌐 Example 3: Create Knowledge Graph');
  const createResult = await neo4jQuery.execute({
    cypher: `
      CREATE (ai:Topic {name: 'Artificial Intelligence', category: 'Technology'})
      CREATE (ml:Topic {name: 'Machine Learning', category: 'Technology'})
      CREATE (dl:Topic {name: 'Deep Learning', category: 'Technology'})
      CREATE (nlp:Topic {name: 'Natural Language Processing', category: 'Technology'})
      CREATE (ai)-[:INCLUDES]->(ml)
      CREATE (ml)-[:INCLUDES]->(dl)
      CREATE (ml)-[:INCLUDES]->(nlp)
      RETURN id(ai) as aiId, id(ml) as mlId
    `,
  });
  console.log('Created nodes:', createResult.summary?.counters);
  const aiId = createResult.data?.[0]?.aiId;
  const mlId = createResult.data?.[0]?.mlId;
  console.log();

  // Example 4: Find nodes
  console.log('🔎 Example 4: Find Nodes by Label');
  const findResult = await neo4jFindNodes.execute({
    label: 'Topic',
    properties: { category: 'Technology' },
    limit: 10,
  });
  if (findResult.success) {
    console.log(`Found ${findResult.count} nodes:`);
    findResult.nodes.forEach((node: any) => {
      console.log(`  - ${node.properties.name}`);
    });
  }
  console.log();

  // Example 5: Traverse graph
  if (aiId) {
    console.log('🚶 Example 5: Traverse Graph');
    const traverseResult = await neo4jTraverse.execute({
      startNodeId: aiId,
      relationshipType: 'INCLUDES',
      direction: 'outgoing',
      maxDepth: 2,
      limit: 10,
    });
    if (traverseResult.success) {
      console.log(`Found ${traverseResult.count} paths:`);
      traverseResult.paths.forEach((path: any, index: number) => {
        console.log(`  Path ${index + 1}: ${path.start.properties.name} -> ${path.end.properties.name} (depth: ${path.depth})`);
      });
    }
  }
  console.log();

  // Example 6: Complex query with parameters
  console.log('💡 Example 6: Parameterized Query');
  const complexResult = await neo4jQuery.execute({
    cypher: `
      MATCH (t:Topic)
      WHERE t.category = $category
      RETURN t.name as topic, size((t)-[:INCLUDES]->()) as subtopics
      ORDER BY subtopics DESC
    `,
    parameters: { category: 'Technology' },
  });
  if (complexResult.success) {
    console.log('Topics with subtopics:');
    complexResult.data.forEach((row: any) => {
      console.log(`  - ${row.topic}: ${row.subtopics} subtopics`);
    });
  }
  console.log();

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await neo4jQuery.execute({
    cypher: 'MATCH (t:Topic) DETACH DELETE t',
  });
  console.log('✅ Cleanup complete\n');

  // Close connection
  await neo4jPool.close();
  console.log('👋 Disconnected from Neo4j');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

