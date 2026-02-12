/**
 * Neo4j Get Schema Tool
 * 
 * Introspect the Neo4j graph schema to understand structure.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { neo4jGetSchemaSchema } from '../types.js';
import { neo4jPool } from '../connection.js';

/**
 * Create Neo4j get schema tool
 */
export function createNeo4jGetSchemaTool() {
  return toolBuilder()
    .name('neo4j-get-schema')
    .description(
      'Get the schema of the Neo4j graph database including node labels, ' +
      'relationship types, property keys, constraints, and indexes. ' +
      'This helps understand the structure of the graph before querying.'
    )
    .category(ToolCategory.DATABASE)
    .tags(['neo4j', 'graph', 'database', 'schema', 'introspection'])
    .schema(neo4jGetSchemaSchema)
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
          // Get node labels
          const labelsResult = await session.run('CALL db.labels()');
          const nodeLabels = labelsResult.records.map((r) => r.get('label'));

          // Get relationship types
          const relTypesResult = await session.run('CALL db.relationshipTypes()');
          const relationshipTypes = relTypesResult.records.map((r) => r.get('relationshipType'));

          // Get property keys
          const propsResult = await session.run('CALL db.propertyKeys()');
          const propertyKeys = propsResult.records.map((r) => r.get('propertyKey'));

          // Get constraints
          const constraintsResult = await session.run('SHOW CONSTRAINTS');
          const constraints = constraintsResult.records.map((r) => ({
            name: r.get('name'),
            type: r.get('type'),
            entityType: r.get('entityType'),
            labelsOrTypes: r.get('labelsOrTypes'),
            properties: r.get('properties'),
          }));

          // Get indexes
          const indexesResult = await session.run('SHOW INDEXES');
          const indexes = indexesResult.records.map((r) => ({
            name: r.get('name'),
            type: r.get('type'),
            entityType: r.get('entityType'),
            labelsOrTypes: r.get('labelsOrTypes'),
            properties: r.get('properties'),
          }));

          return {
            success: true,
            schema: {
              nodeLabels,
              relationshipTypes,
              propertyKeys,
              constraints,
              indexes,
            },
            summary: {
              totalLabels: nodeLabels.length,
              totalRelationshipTypes: relationshipTypes.length,
              totalPropertyKeys: propertyKeys.length,
              totalConstraints: constraints.length,
              totalIndexes: indexes.length,
            },
          };
        } finally {
          await session.close();
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get schema',
        };
      }
    })
    .build();
}

