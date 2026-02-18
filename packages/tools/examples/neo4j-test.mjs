/* eslint-env node */
/**
 * Neo4j Tools Test Script
 * 
 * Simple test to verify Neo4j connection and basic operations.
 */

import {
  initializeNeo4jTools,
  neo4jQuery,
  neo4jGetSchema,
  neo4jFindNodes,
  neo4jPool,
} from '../dist/index.js';

const { console, process } = globalThis;

async function main() {
  console.log('🚀 Testing Neo4j Tools\n');

  try {
    // Set environment variables
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'deadl1ne';

    // Initialize connection
    console.log('📡 Connecting to Neo4j...');
    await initializeNeo4jTools();
    console.log('✅ Connected successfully!\n');

    // Test 1: Simple query
    console.log('Test 1: Simple Query');
    const result1 = await neo4jQuery.execute({
      cypher: 'RETURN "Hello Neo4j!" as message, 42 as number',
    });
    console.log('Success:', result1.success);
    console.log('Data:', result1.data);
    console.log();

    // Test 2: Get schema
    console.log('Test 2: Get Schema');
    const result2 = await neo4jGetSchema.execute({});
    console.log('Success:', result2.success);
    if (result2.success) {
      console.log('Node Labels:', result2.schema.nodeLabels.slice(0, 5));
      console.log('Relationship Types:', result2.schema.relationshipTypes.slice(0, 5));
      console.log('Total Labels:', result2.summary.totalLabels);
      console.log('Total Relationship Types:', result2.summary.totalRelationshipTypes);
    }
    console.log();

    // Test 3: Create and query test data
    console.log('Test 3: Create Test Data');
    const result3 = await neo4jQuery.execute({
      cypher: `
        CREATE (p:TestPerson {name: 'Alice', age: 30})
        RETURN id(p) as id, p.name as name
      `,
    });
    console.log('Success:', result3.success);
    console.log('Created:', result3.summary?.counters);
    console.log('Data:', result3.data);
    console.log();

    // Test 4: Find nodes
    console.log('Test 4: Find Nodes');
    const result4 = await neo4jFindNodes.execute({
      label: 'TestPerson',
      properties: { name: 'Alice' },
      limit: 10,
    });
    console.log('Success:', result4.success);
    console.log('Found:', result4.count, 'nodes');
    if (result4.nodes && result4.nodes.length > 0) {
      console.log('First node:', result4.nodes[0].properties);
    }
    console.log();

    // Test 5: Cleanup
    console.log('Test 5: Cleanup');
    const result5 = await neo4jQuery.execute({
      cypher: 'MATCH (p:TestPerson) DELETE p',
    });
    console.log('Success:', result5.success);
    console.log('Deleted:', result5.summary?.counters.nodesDeleted, 'nodes');
    console.log();

    // Close connection
    await neo4jPool.close();
    console.log('✅ All tests passed!');
    console.log('👋 Disconnected from Neo4j');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
