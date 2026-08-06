import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  neo4jCreateNodeWithEmbeddingSchema,
  neo4jFindNodesSchema,
  neo4jQuerySchema,
} from '../../../src/data/neo4j/types.js';
import type { Neo4jProperties } from '../../../src/data/neo4j/types.js';
import { buildPropertyFilter } from '../../../src/data/neo4j/utils/cypher-sanitizer.js';
import {
  isRetryableError,
  withProviderErrorMetadata,
} from '../../../src/data/neo4j/embeddings/utils.js';

describe('Neo4j payload contracts', () => {
  it('accepts scalar, array, nested-object, and null-prototype payload values', () => {
    const properties = Object.create(null) as Neo4jProperties;
    properties.name = 'Ada';
    properties.tags = ['graph', 'json'];
    properties.profile = { active: true, score: 4 };

    expect(neo4jQuerySchema.parse({
      cypher: 'RETURN $properties',
      parameters: properties,
    }).parameters).toEqual(properties);

    expect(neo4jFindNodesSchema.parse({
      label: 'Person',
      properties,
    }).properties).toEqual(properties);

    expect(neo4jCreateNodeWithEmbeddingSchema.parse({
      label: 'Person',
      properties,
      textProperty: 'name',
    }).properties).toEqual(properties);
  });

  it('uses unknown-first schemas for Neo4j property payload values', () => {
    expect(neo4jQuerySchema.shape.parameters?.unwrap()).toBeInstanceOf(z.ZodRecord);
    expect(neo4jFindNodesSchema.shape.properties?.unwrap()).toBeInstanceOf(z.ZodRecord);
    expect(neo4jCreateNodeWithEmbeddingSchema.shape.properties.element).toBeInstanceOf(z.ZodLazy);
    expect(() => neo4jFindNodesSchema.parse({
      label: 'Person',
      properties: { createdAt: new Date() },
    })).toThrow();
    expect(() => neo4jFindNodesSchema.parse({
      label: 'Person',
      properties: { callback: () => 'unsupported' },
    })).toThrow();
  });

  it('binds supported values while sanitizing property identifiers', () => {
    const properties = Object.create(null) as Neo4jProperties;
    properties.name = 'Ada';
    properties['profile.active'] = true;
    properties.tags = ['admin', 'reviewer'];

    expect(buildPropertyFilter(properties, 'node')).toEqual({
      whereClause: 'WHERE node.name = $prop_0 AND node.`profile.active` = $prop_1 AND node.tags = $prop_2',
      parameters: {
        prop_0: 'Ada',
        prop_1: true,
        prop_2: ['admin', 'reviewer'],
      },
    });
  });

  it('does not treat malformed unknown errors as retryable', () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError('provider failed')).toBe(false);
    expect(isRetryableError({ response: { status: 503 } })).toBe(true);
  });

  it('preserves provider failure metadata without requiring an any-shaped error', () => {
    const upstreamError = Object.assign(new Error('upstream failed'), {
      code: 'ECONNRESET',
      response: { status: 503 },
    });

    const wrappedError = withProviderErrorMetadata(upstreamError, 'provider failed');

    expect(wrappedError.message).toBe('provider failed');
    expect(wrappedError.code).toBe('ECONNRESET');
    expect(wrappedError.response).toEqual({ status: 503 });
    expect(isRetryableError(wrappedError)).toBe(true);
  });
});
