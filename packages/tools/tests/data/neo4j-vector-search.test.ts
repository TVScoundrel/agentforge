import { Integer, Node, type Session } from 'neo4j-driver';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { neo4jPool } from '../../src/data/neo4j/connection.js';
import { embeddingManager } from '../../src/data/neo4j/embeddings/embedding-manager.js';
import { createNeo4jVectorSearchTool } from '../../src/data/neo4j/tools/neo4j-vector-search.js';
import { createNeo4jVectorSearchWithEmbeddingTool } from '../../src/data/neo4j/tools/neo4j-vector-search-with-embedding.js';

const vector = [0.1, 0.2, 0.3];
const database = 'tenant-db';
const expectedResults = [
  {
    node: { identity: 1, labels: ['Document'], properties: { title: 'first', rank: 2 } },
    score: 0.9,
  },
  {
    node: { identity: 2, labels: ['Document'], properties: { title: 'second' } },
    score: 0.4,
  },
];

function expectVectorQuery(
  session: ReturnType<typeof arrangeSession>['session'],
  limit: number | undefined
) {
  expect(session.run).toHaveBeenCalledOnce();
  const [cypher, parameters] = session.run.mock.calls[0];
  expect(String(cypher).replace(/\s+/g, ' ').trim()).toBe(
    'CALL db.index.vector.queryNodes($indexName, $limit, $queryVector) YIELD node, score RETURN node, score ORDER BY score DESC'
  );
  expect(parameters).toEqual({ indexName: 'documents', limit, queryVector: vector });
}

function record(node: Node, score: number) {
  return {
    keys: ['node', 'score', 'ignored'],
    get: (key: PropertyKey) =>
      ({ node, score, ignored: true })[String(key) as 'node' | 'score' | 'ignored'],
  };
}

function arrangeSession() {
  const records = [
    record(
      new Node(Integer.fromNumber(1), ['Document'], {
        title: 'first',
        rank: Integer.fromNumber(2),
      }),
      0.9
    ),
    record(new Node(Integer.fromNumber(2), ['Document'], { title: 'second' }), 0.4),
  ];
  const session = {
    run: vi.fn().mockResolvedValue({ records }),
    close: vi.fn().mockResolvedValue(undefined),
  };
  vi.spyOn(neo4jPool, 'isInitialized').mockReturnValue(true);
  const getSession = vi
    .spyOn(neo4jPool, 'getSession')
    .mockReturnValue(session as unknown as Session);
  return { session, getSession };
}

afterEach(() => vi.restoreAllMocks());

describe('Neo4j Vector Search Tools', () => {
  it.each([
    [
      'direct',
      () => createNeo4jVectorSearchTool().invoke({ indexName: 'documents', queryVector: vector }),
    ],
    [
      'embedding-backed',
      () =>
        createNeo4jVectorSearchWithEmbeddingTool().invoke({
          indexName: 'documents',
          queryText: 'search text',
        }),
    ],
  ])('%s reports uninitialized Neo4j without acquiring a session', async (_name, invoke) => {
    vi.spyOn(neo4jPool, 'isInitialized').mockReturnValue(false);
    const getSession = vi.spyOn(neo4jPool, 'getSession');
    const generateEmbedding = vi.spyOn(embeddingManager, 'generateEmbedding');
    expect(await invoke()).toEqual({
      success: false,
      error: 'Neo4j connection not initialized. Please configure Neo4j connection first.',
    });
    expect(getSession).not.toHaveBeenCalled();
    expect(generateEmbedding).not.toHaveBeenCalled();
  });

  it('checks Embedding Manager before generating an embedding or acquiring a session', async () => {
    vi.spyOn(neo4jPool, 'isInitialized').mockReturnValue(true);
    vi.spyOn(embeddingManager, 'isInitialized').mockReturnValue(false);
    const generateEmbedding = vi.spyOn(embeddingManager, 'generateEmbedding');
    const getSession = vi.spyOn(neo4jPool, 'getSession');
    expect(
      await createNeo4jVectorSearchWithEmbeddingTool().invoke({
        indexName: 'documents',
        queryText: 'search text',
      })
    ).toEqual({
      success: false,
      error:
        'Embedding manager not initialized. Please configure embedding provider (set OPENAI_API_KEY and optionally EMBEDDING_MODEL).',
    });
    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });

  it.each([undefined, 4])(
    'preserves schema-parsed direct Vector Search with limit %s',
    async (limit) => {
      const { session, getSession } = arrangeSession();
      const tool = createNeo4jVectorSearchTool();
      const input = {
        indexName: 'documents',
        queryVector: vector,
        database,
        ...(limit === undefined ? {} : { limit }),
      };
      expect(await tool.invoke(tool.schema.parse(input))).toEqual({
        success: true,
        results: expectedResults,
        count: 2,
        query: { indexName: 'documents', vectorDimension: 3, limit: limit ?? 10 },
      });
      expect(getSession).toHaveBeenCalledWith(database);
      expectVectorQuery(session, limit ?? 10);
      expect(session.close).toHaveBeenCalledOnce();
    }
  );

  it.each([
    [undefined, undefined],
    [4, 'requested-model'],
  ])(
    'preserves schema-parsed embedding-backed Vector Search with limit %s and model %s',
    async (limit, model) => {
      const { session, getSession } = arrangeSession();
      const tool = createNeo4jVectorSearchWithEmbeddingTool();
      vi.spyOn(embeddingManager, 'isInitialized').mockReturnValue(true);
      const generateEmbedding = vi.spyOn(embeddingManager, 'generateEmbedding').mockResolvedValue({
        embedding: vector,
        model: 'model-used',
        dimensions: 3,
        usage: { totalTokens: 8 },
      });
      const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const input = {
        indexName: 'documents',
        queryText: 'search text',
        ...(model === undefined ? {} : { model }),
        database,
        ...(limit === undefined ? {} : { limit }),
      };
      expect(await tool.invoke(tool.schema.parse(input))).toEqual({
        success: true,
        results: expectedResults,
        count: 2,
        query: {
          text: 'search text',
          indexName: 'documents',
          embeddingModel: 'model-used',
          vectorDimension: 3,
          limit: limit ?? 10,
        },
        embedding: { model: 'model-used', dimensions: 3, usage: { totalTokens: 8 } },
      });
      expect(generateEmbedding).toHaveBeenCalledOnce();
      expect(generateEmbedding).toHaveBeenCalledWith('search text', model);
      expect(getSession).toHaveBeenCalledWith(database);
      expectVectorQuery(session, limit ?? 10);
      expect(session.close).toHaveBeenCalledOnce();
      expect(
        write.mock.calls.some(
          ([line]) =>
            String(line).includes('Vector search completed successfully') &&
            String(line).includes('"resultCount":2') &&
            String(line).includes('"embeddingModel":"model-used"')
        )
      ).toBe(true);
    }
  );

  it.each([
    [
      'missing index',
      new Error('index not found'),
      'index not found Make sure the vector index exists. Create one with: CREATE VECTOR INDEX <name> FOR (n:Label) ON (n.embedding)',
    ],
    ['generic error', new Error('query failed'), 'query failed'],
    ['thrown value', 'query failed', 'Failed to perform vector search'],
  ])('preserves direct %s guidance and failure shape', async (_case, failure, error) => {
    const { session } = arrangeSession();
    session.run.mockRejectedValue(failure);
    expect(
      await createNeo4jVectorSearchTool().invoke({ indexName: 'documents', queryVector: vector })
    ).toEqual({
      success: false,
      error,
      query: { indexName: 'documents', vectorDimension: 3 },
    });
    expect(session.close).toHaveBeenCalledOnce();
  });

  it.each([
    [
      'missing index',
      new Error('index not found'),
      'index not found Make sure the vector index exists. Create one with: CREATE VECTOR INDEX <name> FOR (n:Label) ON (n.embedding)',
    ],
    [
      'dimension',
      new Error('dimension mismatch'),
      'dimension mismatch Make sure the vector index dimensions match your embedding model dimensions.',
    ],
    [
      'configuration',
      new Error('API key missing'),
      'API key missing Make sure OPENAI_API_KEY is set in your environment variables.',
    ],
    ['generic error', new Error('query failed'), 'query failed'],
    ['thrown value', 'query failed', 'Failed to perform vector search with embedding'],
  ])('preserves embedding-backed %s guidance and failure shape', async (_case, failure, error) => {
    const { session } = arrangeSession();
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(embeddingManager, 'isInitialized').mockReturnValue(true);
    vi.spyOn(embeddingManager, 'generateEmbedding').mockResolvedValue({
      embedding: vector,
      model: 'model-used',
      dimensions: 3,
    });
    session.run.mockRejectedValue(failure);
    expect(
      await createNeo4jVectorSearchWithEmbeddingTool().invoke({
        indexName: 'documents',
        queryText: 'search text',
      })
    ).toEqual({
      success: false,
      error,
      query: { text: 'search text', indexName: 'documents' },
    });
    expect(session.close).toHaveBeenCalledOnce();
    expect(
      write.mock.calls.some(
        ([line]) =>
          String(line).includes('Vector search failed') &&
          String(line).includes('"queryTextLength":11')
      )
    ).toBe(true);
  });

  it('reports embedding generation configuration failure before acquiring a session', async () => {
    vi.spyOn(neo4jPool, 'isInitialized').mockReturnValue(true);
    vi.spyOn(embeddingManager, 'isInitialized').mockReturnValue(true);
    vi.spyOn(embeddingManager, 'generateEmbedding').mockRejectedValue(new Error('API key missing'));
    const getSession = vi.spyOn(neo4jPool, 'getSession');
    expect(
      await createNeo4jVectorSearchWithEmbeddingTool().invoke({
        indexName: 'documents',
        queryText: 'search text',
      })
    ).toEqual({
      success: false,
      error: 'API key missing Make sure OPENAI_API_KEY is set in your environment variables.',
      query: { text: 'search text', indexName: 'documents' },
    });
    expect(getSession).not.toHaveBeenCalled();
  });
});
