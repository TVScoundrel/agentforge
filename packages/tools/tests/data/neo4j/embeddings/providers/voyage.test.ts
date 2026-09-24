import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VoyageEmbeddingProvider } from '../../../../../src/data/neo4j/embeddings/providers/voyage.js';
import { characterizeHostedEmbeddingProvider } from './hosted-provider.contract.js';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

function voyageResponse(embeddings: number[][], usage?: number) {
  return {
    data: {
      data: embeddings.map((embedding) => ({ embedding })),
      ...(usage === undefined ? {} : { usage: { total_tokens: usage } }),
    },
  };
}

function voyageErrorMessage(status: number | undefined, message: string): string {
  if (status === 401) {
    return `Voyage AI API authentication failed. Please check your VOYAGE_API_KEY. ${message}`;
  }
  if (status === 429) return `Voyage AI API rate limit exceeded. ${message}`;
  if (status === 400) return `Voyage AI API request invalid: ${message}`;
  return `Voyage AI API error (${status}): ${message}`;
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

describe('VoyageEmbeddingProvider', () => {
  characterizeHostedEmbeddingProvider({
    name: 'voyage',
    defaultModel: 'voyage-2',
    createProvider: (apiKey, model) => new VoyageEmbeddingProvider(apiKey, model),
    response: voyageResponse,
    errorMessage: voyageErrorMessage,
  });

  describe('Voyage request and response behavior', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('uses the Voyage endpoint, authentication, request body, and response shape', async () => {
      mockedAxios.post.mockResolvedValueOnce(voyageResponse([[0.25, -0.5]], 9));
      const provider = new VoyageEmbeddingProvider('test-api-key');

      await expect(provider.generateBatchEmbeddings(['characterize me'])).resolves.toEqual({
        embeddings: [[0.25, -0.5]],
        model: 'voyage-2',
        dimensions: 2,
        usage: {
          promptTokens: 9,
          totalTokens: 9,
        },
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.voyageai.com/v1/embeddings',
        {
          input: ['characterize me'],
          model: 'voyage-2',
          input_type: 'document',
        },
        {
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('puts a per-call model override in the Voyage request', async () => {
      mockedAxios.post.mockResolvedValueOnce(voyageResponse([[0.4]]));
      const provider = new VoyageEmbeddingProvider('test-api-key');

      await provider.generateEmbedding('override me', 'voyage-large-2');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.voyageai.com/v1/embeddings',
        expect.objectContaining({
          input: ['override me'],
          model: 'voyage-large-2',
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
        const provider = new VoyageEmbeddingProvider('test-api-key');

        const rejection = expect(provider.generateEmbedding('error input')).rejects.toMatchObject({
          message: voyageErrorMessage(status, upstreamMessage),
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
