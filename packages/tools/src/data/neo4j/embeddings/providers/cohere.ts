/**
 * Cohere Embedding Provider
 *
 * Implementation of embedding generation using Cohere's API
 * https://docs.cohere.com/reference/embed
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { generateHostedBatchEmbeddings, generateHostedEmbedding } from './hosted.js';
import type { HostedProviderError } from './hosted.js';

function formatCohereError({ kind, status, providerMessage }: HostedProviderError): string {
  if (kind === 'authentication') {
    return `Cohere API authentication failed. Please check your COHERE_API_KEY. ${providerMessage}`;
  }
  if (kind === 'rate-limit') return `Cohere API rate limit exceeded. ${providerMessage}`;
  if (kind === 'invalid-request') return `Cohere API request invalid: ${providerMessage}`;
  return `Cohere API error (${status}): ${providerMessage}`;
}

/**
 * Cohere embedding provider
 */
export class CohereEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'cohere' as const;
  readonly defaultModel = 'embed-english-v3.0';

  private apiKey: string | undefined;
  private baseUrl = 'https://api.cohere.ai/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check if Cohere is available (API key is set)
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
      formatError: formatCohereError,
      request: async (requestTexts, requestModel) => {
        const response = await axios.post(
          `${this.baseUrl}/embed`,
          {
            texts: requestTexts,
            model: requestModel,
            input_type: 'search_document', // For storing in vector DB
            embedding_types: ['float'],
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const embeddings = response.data.embeddings.float;

        return {
          embeddings,
          usage: response.data.meta?.billed_units
            ? {
                promptTokens: response.data.meta.billed_units.input_tokens || 0,
                totalTokens: response.data.meta.billed_units.input_tokens || 0,
              }
            : undefined,
        };
      },
    });
  }
}
