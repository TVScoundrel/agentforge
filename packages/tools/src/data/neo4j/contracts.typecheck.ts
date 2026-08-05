import type { Neo4jProperties } from './types.js';

const validProperties = {
  name: 'Ada',
  active: true,
  score: 4,
  tags: ['graph', 'json'],
  profile: { role: 'admin' },
} satisfies Neo4jProperties;

void validProperties;

// @ts-expect-error Functions are not JSON-safe Neo4j property values.
const functionProperty = { callback: () => 'not a property' } satisfies Neo4jProperties;

// @ts-expect-error Date instances are not JSON-safe Neo4j property values.
const dateProperty = { createdAt: new Date() } satisfies Neo4jProperties;

void functionProperty;
void dateProperty;
