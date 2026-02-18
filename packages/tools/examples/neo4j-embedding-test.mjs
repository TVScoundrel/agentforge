/* eslint-env node */
/**
 * Neo4j Embedding Tools Test
 * 
 * Test the new embedding-enabled Neo4j tools
 * 
 * Prerequisites:
 * - Neo4j running at bolt://localhost:7687
 * - OPENAI_API_KEY environment variable set
 * 
 * Run with:
 * NEO4J_URI=bolt://localhost:7687 NEO4J_USER=neo4j NEO4J_PASSWORD=deadl1ne OPENAI_API_KEY=your-key node examples/neo4j-embedding-test.mjs
 */

import {
  initializeNeo4jTools,
  neo4jQuery,
  neo4jCreateNodeWithEmbedding,
  neo4jVectorSearchWithEmbedding,
  neo4jPool,
} from '../dist/index.js';

const { console, setTimeout } = globalThis;

console.log('🚀 Testing Neo4j Embedding Tools\n');

try {
  // Initialize Neo4j and embeddings
  console.log('📡 Initializing Neo4j and embedding provider...');
  await initializeNeo4jTools();
  console.log('✅ Initialized successfully!\n');

  // Test 1: Create vector index
  console.log('Test 1: Create Vector Index');
  try {
    await neo4jQuery.execute({
      cypher: 'DROP INDEX document_embeddings IF EXISTS',
    });
    
    const indexResult = await neo4jQuery.execute({
      cypher: `
        CREATE VECTOR INDEX document_embeddings IF NOT EXISTS
        FOR (n:Document)
        ON (n.embedding)
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 1536,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `,
    });
    console.log('Success:', indexResult.success);
    console.log('');
  } catch (error) {
    console.log('Note: Index might already exist or Neo4j version might not support vector indexes');
    console.log('');
  }

  // Test 2: Create nodes with embeddings
  console.log('Test 2: Create Nodes with Automatic Embeddings');
  
  const doc1 = await neo4jCreateNodeWithEmbedding.execute({
    label: 'Document',
    properties: {
      title: 'Introduction to Neo4j',
      content: 'Neo4j is a powerful graph database that stores data as nodes and relationships.',
      category: 'database',
    },
    textProperty: 'content',
    embeddingProperty: 'embedding',
  });
  
  console.log('Document 1 created:', doc1.success);
  if (doc1.success) {
    console.log('  Node ID:', doc1.nodeId);
    console.log('  Embedding model:', doc1.embedding.model);
    console.log('  Embedding dimensions:', doc1.embedding.dimensions);
    console.log('  Tokens used:', doc1.embedding.usage?.totalTokens);
  }
  console.log('');

  const doc2 = await neo4jCreateNodeWithEmbedding.execute({
    label: 'Document',
    properties: {
      title: 'GraphRAG Explained',
      content: 'GraphRAG combines graph databases with retrieval-augmented generation for better AI context.',
      category: 'ai',
    },
    textProperty: 'content',
    embeddingProperty: 'embedding',
  });
  
  console.log('Document 2 created:', doc2.success);
  if (doc2.success) {
    console.log('  Node ID:', doc2.nodeId);
    console.log('  Embedding dimensions:', doc2.embedding.dimensions);
  }
  console.log('');

  const doc3 = await neo4jCreateNodeWithEmbedding.execute({
    label: 'Document',
    properties: {
      title: 'Cooking Pasta',
      content: 'To cook perfect pasta, use plenty of salted boiling water and cook until al dente.',
      category: 'cooking',
    },
    textProperty: 'content',
    embeddingProperty: 'embedding',
  });
  
  console.log('Document 3 created:', doc3.success);
  console.log('');

  // Wait a moment for index to update
  console.log('⏳ Waiting for vector index to update...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('');

  // Test 3: Vector search with automatic embedding
  console.log('Test 3: Vector Search with Automatic Embedding');
  
  const searchResult = await neo4jVectorSearchWithEmbedding.execute({
    indexName: 'document_embeddings',
    queryText: 'How do graph databases work?',
    limit: 3,
  });
  
  console.log('Search success:', searchResult.success);
  if (searchResult.success) {
    console.log('Query text:', searchResult.query.text);
    console.log('Embedding model:', searchResult.embedding.model);
    console.log('Results found:', searchResult.count);
    console.log('');
    console.log('Top results:');
    searchResult.results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.node.properties.title}`);
      console.log(`     Score: ${result.score.toFixed(4)}`);
      console.log(`     Content: ${result.node.properties.content.substring(0, 60)}...`);
    });
  } else {
    console.log('Error:', searchResult.error);
  }
  console.log('');

  // Test 4: Cleanup
  console.log('Test 4: Cleanup');
  const cleanup = await neo4jQuery.execute({
    cypher: 'MATCH (d:Document) DELETE d',
  });
  console.log('Success:', cleanup.success);
  console.log('Deleted:', cleanup.summary?.nodesDeleted, 'nodes');
  console.log('');

  console.log('✅ All embedding tests completed!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  if (error.message.includes('API key')) {
    console.error('\n💡 Make sure to set OPENAI_API_KEY environment variable');
  }
} finally {
  // Close connection
  console.log('\n👋 Disconnecting from Neo4j');
  await neo4jPool.close();
}
