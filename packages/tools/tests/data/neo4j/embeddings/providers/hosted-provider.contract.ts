import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IEmbeddingProvider } from '../../../../../src/data/neo4j/embeddings/types.js';

const mockedAxios = vi.mocked(axios);

type ProviderName = 'cohere' | 'voyage';

interface HostedProviderContract {
  name: ProviderName;
  defaultModel: string;
  createProvider: (apiKey?: string, model?: string) => IEmbeddingProvider;
  response: (embeddings: number[][], usage?: number) => unknown;
  errorMessage: (status: number | undefined, upstreamMessage: string) => string;
}

function createAxiosError(status: number | undefined, message: string, code = 'ERR_UPSTREAM') {
  return Object.assign(new Error(message), {
    code,
    response:
      status === undefined
        ? undefined
        : {
            status,
            data: { message },
          },
  });
}

export function characterizeHostedEmbeddingProvider(config: HostedProviderContract): void {
  describe('shared hosted Embedding Provider contract', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('reports its identity, default model, and credential availability', () => {
      const configured = config.createProvider('test-api-key');

      expect(configured.name).toBe(config.name);
      expect(configured.defaultModel).toBe(config.defaultModel);
      expect(configured.isAvailable()).toBe(true);
      expect(config.createProvider().isAvailable()).toBe(false);
      expect(config.createProvider('').isAvailable()).toBe(false);
    });

    it('ignores the constructor model argument and uses the default model', async () => {
      mockedAxios.post.mockResolvedValueOnce(config.response([[0.1, 0.2]]));
      const provider = config.createProvider('test-api-key', 'constructor-model');

      await expect(provider.generateBatchEmbeddings(['first'])).resolves.toMatchObject({
        model: config.defaultModel,
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: config.defaultModel }),
        expect.any(Object)
      );
    });

    it('converts single generation to a batch and selects its first vector', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        config.response(
          [
            [0.25, -0.5],
            [0.75, 1],
          ],
          7
        )
      );
      const provider = config.createProvider('test-api-key');

      await expect(provider.generateEmbedding('characterize me')).resolves.toEqual({
        embedding: [0.25, -0.5],
        model: config.defaultModel,
        dimensions: 2,
        usage: {
          promptTokens: 7,
          totalTokens: 7,
        },
      });
    });

    it('returns every batch vector and honors a per-call model override', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        config.response([
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6],
        ])
      );
      const provider = config.createProvider('test-api-key');

      await expect(
        provider.generateBatchEmbeddings(['first', 'second'], 'per-call-model')
      ).resolves.toEqual({
        embeddings: [
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6],
        ],
        model: 'per-call-model',
        dimensions: 3,
        usage: undefined,
      });
    });

    it('returns a successful zero-dimensional result for empty embeddings', async () => {
      mockedAxios.post.mockResolvedValueOnce(config.response([]));
      const provider = config.createProvider('test-api-key');

      await expect(provider.generateBatchEmbeddings([])).resolves.toEqual({
        embeddings: [],
        model: config.defaultModel,
        dimensions: 0,
        usage: undefined,
      });
    });

    it('returns the current empty single-embedding result', async () => {
      mockedAxios.post.mockResolvedValueOnce(config.response([]));
      const provider = config.createProvider('test-api-key');

      await expect(provider.generateEmbedding('empty response')).resolves.toEqual({
        embedding: undefined,
        model: config.defaultModel,
        dimensions: 0,
        usage: undefined,
      });
    });

    it.each([
      {
        label: 'present',
        usage: 11,
        expected: { promptTokens: 11, totalTokens: 11 },
      },
      {
        label: 'absent',
        usage: undefined,
        expected: undefined,
      },
      {
        label: 'zero-valued',
        usage: 0,
        expected: { promptTokens: 0, totalTokens: 0 },
      },
    ])('preserves $label usage metadata', async ({ usage, expected }) => {
      mockedAxios.post.mockResolvedValueOnce(config.response([[0.2]], usage));
      const provider = config.createProvider('test-api-key');

      const result = await provider.generateBatchEmbeddings(['usage']);

      expect(result.usage).toEqual(expected);
    });

    it('retries server failures three times before succeeding', async () => {
      vi.useFakeTimers();
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post
        .mockRejectedValueOnce(createAxiosError(503, 'first failure'))
        .mockRejectedValueOnce(createAxiosError(503, 'second failure'))
        .mockRejectedValueOnce(createAxiosError(503, 'third failure'))
        .mockResolvedValueOnce(config.response([[0.8]]));
      const provider = config.createProvider('test-api-key');

      const generation = provider.generateBatchEmbeddings(['retry me']);
      await vi.advanceTimersByTimeAsync(0);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(999);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1999);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(3999);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);

      await expect(generation).resolves.toMatchObject({ embeddings: [[0.8]] });
      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('retries a network failure once before succeeding', async () => {
      vi.useFakeTimers();
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post
        .mockRejectedValueOnce(createAxiosError(undefined, 'socket reset', 'ECONNRESET'))
        .mockResolvedValueOnce(config.response([[0.6]]));
      const provider = config.createProvider('test-api-key');

      const generation = provider.generateEmbedding('retry me');
      await vi.runAllTimersAsync();

      await expect(generation).resolves.toMatchObject({ embedding: [0.6] });
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('preserves the final network error after retries are exhausted', async () => {
      vi.useFakeTimers();
      const upstreamError = createAxiosError(undefined, 'socket reset', 'ECONNRESET');
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(upstreamError);
      const provider = config.createProvider('test-api-key');

      const generation = provider.generateBatchEmbeddings(['retry me']);
      const rejection = generation.catch((error: unknown) => error);
      await vi.runAllTimersAsync();

      const finalError = await rejection;
      expect(finalError).toMatchObject({
        message: config.errorMessage(undefined, 'socket reset'),
        code: 'ECONNRESET',
      });
      expect(finalError).not.toHaveProperty('response');
      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('throws the final provider error after retries are exhausted', async () => {
      vi.useFakeTimers();
      const upstreamError = createAxiosError(503, 'still unavailable');
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(upstreamError);
      const provider = config.createProvider('test-api-key');

      const generation = provider.generateBatchEmbeddings(['retry me']);
      const rejection = expect(generation).rejects.toMatchObject({
        message: config.errorMessage(503, 'still unavailable'),
        code: 'ERR_UPSTREAM',
        response: upstreamError.response,
      });
      await vi.runAllTimersAsync();

      await rejection;
      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('does not retry a non-retryable provider failure', async () => {
      const upstreamError = createAxiosError(400, 'invalid input');
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(upstreamError);
      const provider = config.createProvider('test-api-key');

      await expect(provider.generateBatchEmbeddings(['invalid'])).rejects.toMatchObject({
        message: config.errorMessage(400, 'invalid input'),
      });
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('passes a non-HTTP error through unchanged without retrying', async () => {
      const unexpectedError = new TypeError('unexpected response shape');
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValue(unexpectedError);
      const provider = config.createProvider('test-api-key');

      let thrown: unknown;
      try {
        await provider.generateBatchEmbeddings(['unexpected']);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBe(unexpectedError);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });
}
