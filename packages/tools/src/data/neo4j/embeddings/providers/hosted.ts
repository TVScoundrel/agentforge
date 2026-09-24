import axios from 'axios';

import type { BatchEmbeddingResult, EmbeddingResult } from '../types.js';
import { retryWithBackoff, withProviderErrorMetadata } from '../utils.js';

interface HostedEmbeddingResponse {
  embeddings: number[][];
  usage?: BatchEmbeddingResult['usage'];
}

export interface HostedProviderError {
  kind: 'authentication' | 'rate-limit' | 'invalid-request' | 'other';
  status: number | undefined;
  providerMessage: string;
}

interface HostedBatchOptions {
  texts: string[];
  model: string;
  request: (texts: string[], model: string) => Promise<HostedEmbeddingResponse>;
  formatError: (error: HostedProviderError) => string;
}

export async function generateHostedEmbedding(
  text: string,
  model: string | undefined,
  generateBatch: (texts: string[], model?: string) => Promise<BatchEmbeddingResult>
): Promise<EmbeddingResult> {
  const result = await generateBatch([text], model);

  return {
    embedding: result.embeddings[0],
    model: result.model,
    dimensions: result.dimensions,
    usage: result.usage,
  };
}

export function generateHostedBatchEmbeddings({
  texts,
  model,
  request,
  formatError,
}: HostedBatchOptions): Promise<BatchEmbeddingResult> {
  return retryWithBackoff(async () => {
    try {
      const { embeddings, usage } = await request(texts, model);

      return {
        embeddings,
        model,
        dimensions: embeddings[0]?.length || 0,
        usage,
      };
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) throw error;

      const status = error.response?.status;
      const providerMessage = error.response?.data?.message || error.message;
      throw withProviderErrorMetadata(
        error,
        formatError({
          kind: classifyHttpError(status),
          status,
          providerMessage,
        })
      );
    }
  });
}

function classifyHttpError(status: number | undefined): HostedProviderError['kind'] {
  if (status === 401) return 'authentication';
  if (status === 429) return 'rate-limit';
  if (status === 400) return 'invalid-request';
  return 'other';
}
