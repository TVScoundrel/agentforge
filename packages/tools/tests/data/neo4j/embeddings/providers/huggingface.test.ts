import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HuggingFaceEmbeddingProvider } from '../../../../../src/data/neo4j/embeddings/providers/huggingface.js';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

const errorCases = [
  {
    label: 'authentication',
    status: 401,
    upstreamMessage: 'Invalid credentials',
    expectedMessage:
      'HuggingFace API authentication failed. Please check your HUGGINGFACE_API_KEY. Invalid credentials',
  },
  {
    label: 'rate-limit',
    status: 429,
    upstreamMessage: 'Too many requests',
    expectedMessage: 'HuggingFace API rate limit exceeded. Too many requests',
  },
  {
    label: 'invalid-request',
    status: 400,
    upstreamMessage: 'Input is invalid',
    expectedMessage: 'HuggingFace API request invalid: Input is invalid',
  },
  {
    label: 'model-loading',
    status: 503,
    upstreamMessage: 'Model is loading',
    expectedMessage: 'HuggingFace model is loading. Please retry in a moment. Model is loading',
  },
  {
    label: 'general HTTP',
    status: 418,
    upstreamMessage: 'Unexpected response',
    expectedMessage: 'HuggingFace API error (418): Unexpected response',
  },
] as const;

function createAxiosError(status: number, message: string) {
  return Object.assign(new Error(`Request failed with status ${status}`), {
    code: 'ERR_UPSTREAM',
    response: {
      status,
      data: { error: message },
    },
  });
}

describe('HuggingFaceEmbeddingProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a single embedding with the default model request contract', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: [0.25, -0.5, 0.75] });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    await expect(provider.generateEmbedding('characterize me')).resolves.toEqual({
      embedding: [0.25, -0.5, 0.75],
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimensions: 3,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        inputs: 'characterize me',
        options: { wait_for_model: true },
      },
      {
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('reports an explicit model for a single embedding', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: [0.1, 0.2] });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    const result = await provider.generateEmbedding('custom model', 'organization/custom-model');

    expect(result).toEqual({
      embedding: [0.1, 0.2],
      model: 'organization/custom-model',
      dimensions: 2,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/organization/custom-model',
      {
        inputs: 'custom model',
        options: { wait_for_model: true },
      },
      {
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('generates batch embeddings with the default model request contract', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    await expect(provider.generateBatchEmbeddings(['first', 'second'])).resolves.toEqual({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimensions: 2,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        inputs: ['first', 'second'],
        options: { wait_for_model: true },
      },
      {
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('reports an explicit model for batch embeddings', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: [[0.6], [0.7]] });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    const result = await provider.generateBatchEmbeddings(
      ['first', 'second'],
      'organization/custom-model'
    );

    expect(result).toEqual({
      embeddings: [[0.6], [0.7]],
      model: 'organization/custom-model',
      dimensions: 1,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/organization/custom-model',
      {
        inputs: ['first', 'second'],
        options: { wait_for_model: true },
      },
      {
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('returns a successful zero-dimensional result for an empty batch response', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: [] });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    await expect(provider.generateBatchEmbeddings([])).resolves.toEqual({
      embeddings: [],
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimensions: 0,
    });
  });

  it('retries single generation after three transient rate-limit failures', async () => {
    vi.useFakeTimers();
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.post
      .mockRejectedValueOnce(createAxiosError(429, 'First rate limit'))
      .mockRejectedValueOnce(createAxiosError(429, 'Second rate limit'))
      .mockRejectedValueOnce(createAxiosError(429, 'Third rate limit'))
      .mockResolvedValueOnce({ data: [0.4, 0.8] });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    const generation = expect(provider.generateEmbedding('retry me')).resolves.toEqual({
      embedding: [0.4, 0.8],
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimensions: 2,
    });
    await vi.runAllTimersAsync();

    await generation;
  });

  it('retries batch generation after three transient model-loading failures', async () => {
    vi.useFakeTimers();
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.post
      .mockRejectedValueOnce(createAxiosError(503, 'First loading response'))
      .mockRejectedValueOnce(createAxiosError(503, 'Second loading response'))
      .mockRejectedValueOnce(createAxiosError(503, 'Third loading response'))
      .mockResolvedValueOnce({ data: [[0.2], [0.6]] });
    const provider = new HuggingFaceEmbeddingProvider('test-api-key');

    const generation = expect(
      provider.generateBatchEmbeddings(['first', 'second'])
    ).resolves.toEqual({
      embeddings: [[0.2], [0.6]],
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimensions: 1,
    });
    await vi.runAllTimersAsync();

    await generation;
  });

  describe.each([
    {
      method: 'generateEmbedding',
      invoke: (provider: HuggingFaceEmbeddingProvider) => provider.generateEmbedding('error input'),
    },
    {
      method: 'generateBatchEmbeddings',
      invoke: (provider: HuggingFaceEmbeddingProvider) =>
        provider.generateBatchEmbeddings(['error input']),
    },
  ])('$method()', ({ invoke }) => {
    it.each(errorCases)(
      'translates $label errors and preserves provider metadata',
      async ({ status, upstreamMessage, expectedMessage }) => {
        vi.useFakeTimers();
        const upstreamError = createAxiosError(status, upstreamMessage);
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockedAxios.post.mockRejectedValue(upstreamError);
        const provider = new HuggingFaceEmbeddingProvider('test-api-key');

        const rejection = expect(invoke(provider)).rejects.toMatchObject({
          message: expectedMessage,
          code: 'ERR_UPSTREAM',
          response: upstreamError.response,
        });
        await vi.runAllTimersAsync();

        await rejection;
      }
    );
  });
});
