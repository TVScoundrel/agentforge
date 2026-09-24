import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CohereEmbeddingProvider } from '../../../../../src/data/neo4j/embeddings/providers/cohere.js';
import { characterizeHostedEmbeddingProvider } from './hosted-provider.contract.js';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

function cohereResponse(embeddings: number[][], usage?: number) {
  return {
    data: {
      embeddings: { float: embeddings },
      ...(usage === undefined
        ? {}
        : {
            meta: {
              billed_units: { input_tokens: usage },
            },
          }),
    },
  };
}

function cohereErrorMessage(status: number | undefined, message: string): string {
  if (status === 401) {
    return `Cohere API authentication failed. Please check your COHERE_API_KEY. ${message}`;
  }
  if (status === 429) return `Cohere API rate limit exceeded. ${message}`;
  if (status === 400) return `Cohere API request invalid: ${message}`;
  return `Cohere API error (${status}): ${message}`;
}

function createAxiosError(status: number, message: string) {
  return Object.assign(new Error(`Request failed with status ${status}`), {
    code: 'ERR_UPSTREAM',
    response: {
      status,
      data: { message },
    },
  });
}

describe('CohereEmbeddingProvider', () => {
  characterizeHostedEmbeddingProvider({
    name: 'cohere',
    defaultModel: 'embed-english-v3.0',
    createProvider: (apiKey, model) => new CohereEmbeddingProvider(apiKey, model),
    response: cohereResponse,
    errorMessage: cohereErrorMessage,
  });

  describe('Cohere request and response behavior', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('uses the Cohere endpoint, authentication, request body, and response shape', async () => {
      mockedAxios.post.mockResolvedValueOnce(cohereResponse([[0.25, -0.5]], 9));
      const provider = new CohereEmbeddingProvider('test-api-key');

      await expect(provider.generateBatchEmbeddings(['characterize me'])).resolves.toEqual({
        embeddings: [[0.25, -0.5]],
        model: 'embed-english-v3.0',
        dimensions: 2,
        usage: {
          promptTokens: 9,
          totalTokens: 9,
        },
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.cohere.ai/v1/embed',
        {
          texts: ['characterize me'],
          model: 'embed-english-v3.0',
          input_type: 'search_document',
          embedding_types: ['float'],
        },
        {
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('puts a per-call model override in the Cohere request', async () => {
      mockedAxios.post.mockResolvedValueOnce(cohereResponse([[0.4]]));
      const provider = new CohereEmbeddingProvider('test-api-key');

      await provider.generateEmbedding('override me', 'embed-multilingual-v3.0');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.cohere.ai/v1/embed',
        expect.objectContaining({
          texts: ['override me'],
          model: 'embed-multilingual-v3.0',
        }),
        expect.any(Object)
      );
    });

    it.each([
      {
        label: 'invalid-request',
        status: 400,
        upstreamMessage: 'Input is invalid',
      },
      {
        label: 'authentication',
        status: 401,
        upstreamMessage: 'Invalid credentials',
      },
      {
        label: 'rate-limit',
        status: 429,
        upstreamMessage: 'Too many requests',
      },
      {
        label: 'other HTTP',
        status: 418,
        upstreamMessage: 'Unexpected response',
      },
    ])(
      'preserves $label error wording and provider metadata',
      async ({ status, upstreamMessage }) => {
        if (status === 429) vi.useFakeTimers();
        const upstreamError = createAxiosError(status, upstreamMessage);
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockedAxios.post.mockRejectedValue(upstreamError);
        const provider = new CohereEmbeddingProvider('test-api-key');

        const rejection = expect(provider.generateEmbedding('error input')).rejects.toMatchObject({
          message: cohereErrorMessage(status, upstreamMessage),
          code: 'ERR_UPSTREAM',
          response: upstreamError.response,
        });
        if (status === 429) await vi.runAllTimersAsync();

        await rejection;
        expect(mockedAxios.post).toHaveBeenCalledTimes(status === 429 ? 4 : 1);
      }
    );
  });
});
