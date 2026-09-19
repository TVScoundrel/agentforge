import type { Session } from 'neo4j-driver';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { neo4jPool } from '../../src/data/neo4j/connection.js';
import { embeddingManager } from '../../src/data/neo4j/embeddings/embedding-manager.js';
import { createNeo4jCreateNodeWithEmbeddingTool } from '../../src/data/neo4j/tools/neo4j-create-node-with-embedding.js';
import { createNeo4jFindNodesTool } from '../../src/data/neo4j/tools/neo4j-find-nodes.js';
import { createNeo4jGetSchemaTool } from '../../src/data/neo4j/tools/neo4j-get-schema.js';
import { createNeo4jQueryTool } from '../../src/data/neo4j/tools/neo4j-query.js';
import { createNeo4jTraverseTool } from '../../src/data/neo4j/tools/neo4j-traverse.js';
import { createNeo4jVectorSearchWithEmbeddingTool } from '../../src/data/neo4j/tools/neo4j-vector-search-with-embedding.js';
import { createNeo4jVectorSearchTool } from '../../src/data/neo4j/tools/neo4j-vector-search.js';

const database = 'tenant-database';

function createRecord(values: Record<string, unknown>) {
  return {
    keys: Object.keys(values),
    get: (key: PropertyKey) => values[String(key)],
  };
}

function createQueryResult() {
  return {
    records: [createRecord({ n: { name: 'test' }, nodeId: 1 })],
    summary: {
      counters: {
        updates: () => ({
          nodesCreated: 0,
          nodesDeleted: 0,
          relationshipsCreated: 0,
          relationshipsDeleted: 0,
          propertiesSet: 0,
        }),
      },
    },
  };
}

function createSession() {
  return {
    run: vi.fn().mockResolvedValue(createQueryResult()),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

function arrangeInitializedSession() {
  const session = createSession();
  vi.spyOn(neo4jPool, 'isInitialized').mockReturnValue(true);
  const getSession = vi
    .spyOn(neo4jPool, 'getSession')
    .mockReturnValue(session as unknown as Session);

  return { getSession, session };
}

const toolCases = [
  {
    name: 'query',
    invoke: () => createNeo4jQueryTool().invoke({ cypher: 'RETURN 1', database }),
  },
  {
    name: 'schema introspection',
    invoke: () => createNeo4jGetSchemaTool().invoke({ database }),
  },
  {
    name: 'find nodes',
    invoke: () => createNeo4jFindNodesTool().invoke({ label: 'Person', database }),
  },
  {
    name: 'traverse',
    invoke: () => createNeo4jTraverseTool().invoke({ startNodeId: 1, database }),
  },
  {
    name: 'vector search',
    invoke: () =>
      createNeo4jVectorSearchTool().invoke({
        indexName: 'content-index',
        queryVector: [0.1, 0.2],
        database,
      }),
  },
  {
    name: 'vector search with embedding',
    invoke: () =>
      createNeo4jVectorSearchWithEmbeddingTool().invoke({
        indexName: 'content-index',
        queryText: 'search text',
        database,
      }),
  },
  {
    name: 'create node with embedding',
    invoke: () =>
      createNeo4jCreateNodeWithEmbeddingTool().invoke({
        label: 'Document',
        properties: { content: 'document text' },
        textProperty: 'content',
        database,
      }),
  },
];

const closureOutcomeCases = toolCases.flatMap((toolCase) => [
  { ...toolCase, outcome: 'a successful operation', operationError: undefined },
  { ...toolCase, outcome: 'a failed operation', operationError: new Error('operation failed') },
]);

describe('Neo4j Tool session lifecycle', () => {
  beforeEach(() => {
    vi.spyOn(embeddingManager, 'isInitialized').mockReturnValue(true);
    vi.spyOn(embeddingManager, 'generateEmbedding').mockResolvedValue({
      embedding: [0.1, 0.2],
      model: 'test-model',
      dimensions: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(toolCases)(
    '$name returns the uninitialized result without acquiring a session',
    async ({ invoke }) => {
      vi.spyOn(neo4jPool, 'isInitialized').mockReturnValue(false);
      const getSession = vi.spyOn(neo4jPool, 'getSession');

      await expect(invoke()).resolves.toMatchObject({
        success: false,
        error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
      });
      expect(getSession).not.toHaveBeenCalled();
    }
  );

  it.each(toolCases)(
    '$name forwards the database and closes its one session after success',
    async ({ invoke }) => {
      const { getSession, session } = arrangeInitializedSession();

      await expect(invoke()).resolves.toMatchObject({ success: true });

      expect(getSession).toHaveBeenCalledOnce();
      expect(getSession).toHaveBeenCalledWith(database);
      expect(session.close).toHaveBeenCalledOnce();
    }
  );

  it.each(toolCases)('$name closes its session after an operation failure', async ({ invoke }) => {
    const { session } = arrangeInitializedSession();
    session.run.mockRejectedValue(new Error('operation failed'));

    await expect(invoke()).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('operation failed'),
    });
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('performs every schema introspection query through one session', async () => {
    const { getSession, session } = arrangeInitializedSession();

    await createNeo4jGetSchemaTool().invoke({ database });

    expect(getSession).toHaveBeenCalledOnce();
    expect(session.run).toHaveBeenCalledTimes(5);
    expect(session.close).toHaveBeenCalledOnce();
  });

  it.each(toolCases)(
    '$name does not complete until asynchronous session closure completes',
    async ({ invoke }) => {
      let finishClosing: (() => void) | undefined;
      const closePending = new Promise<void>((resolve) => {
        finishClosing = resolve;
      });
      const { session } = arrangeInitializedSession();
      session.close.mockReturnValue(closePending);

      let completed = false;
      const invocation = invoke().then((result) => {
        completed = true;
        return result;
      });

      await vi.waitFor(() => expect(session.close).toHaveBeenCalledOnce());
      expect(completed).toBe(false);

      finishClosing?.();
      await expect(invocation).resolves.toMatchObject({ success: true });
    }
  );

  it.each(closureOutcomeCases)(
    '$name returns the closure failure after $outcome',
    async ({ invoke, operationError }) => {
      const { session } = arrangeInitializedSession();
      if (operationError) {
        session.run.mockRejectedValue(operationError);
      }
      session.close.mockRejectedValue(new Error('close failed'));

      await expect(invoke()).resolves.toMatchObject({
        success: false,
        error: 'close failed',
      });
    }
  );
});
