/**
 * Voyage AI Embedding Provider
 *
 * Implementation of embedding generation using Voyage AI's API
 * https://docs.voyageai.com/docs/embeddings
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { generateHostedBatchEmbeddings, generateHostedEmbedding } from './hosted.js';
import type { HostedProviderError } from './hosted.js';

function formatVoyageError({ kind, status, providerMessage }: HostedProviderError): string {
  if (kind === 'authentication') {
    return `Voyage AI API authentication failed. Please check your VOYAGE_API_KEY. ${providerMessage}`;
  }
  if (kind === 'rate-limit') return `Voyage AI API rate limit exceeded. ${providerMessage}`;
  if (kind === 'invalid-request') return `Voyage AI API request invalid: ${providerMessage}`;
  return `Voyage AI API error (${status}): ${providerMessage}`;
}

/**
 * Voyage AI embedding provider
 */
export class VoyageEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'voyage' as const;
  readonly defaultModel = 'voyage-2';

  private apiKey: string | undefined;
  private baseUrl = 'https://api.voyageai.com/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check if Voyage AI is available (API key is set)
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    return generateHostedEmbedding(text, model, (texts, batchModel) =>
      this.generateBatchEmbeddings(texts, batchModel)
    );
  }

  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    const modelToUse = model || this.defaultModel;

    return generateHostedBatchEmbeddings({
      texts,
      model: modelToUse,
      formatError: formatVoyageError,
      request: async (requestTexts, requestModel) => {
        const response = await axios.post(
          `${this.baseUrl}/embeddings`,
          {
            input: requestTexts,
            model: requestModel,
            input_type: 'document', // For storing in vector DB
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const embeddings = response.data.data.map(
          (item: { embedding: number[] }) => item.embedding
        );

        return {
          embeddings,
          usage: response.data.usage
            ? {
                promptTokens: response.data.usage.total_tokens || 0,
                totalTokens: response.data.usage.total_tokens || 0,
              }
            : undefined,
        };
      },
    });
  }
}
