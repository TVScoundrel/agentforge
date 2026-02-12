/**
 * Cohere Embedding Provider
 * 
 * Implementation of embedding generation using Cohere's API
 * https://docs.cohere.com/reference/embed
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { retryWithBackoff } from '../utils.js';

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
    // Forward model parameter to batch method
    const result = await this.generateBatchEmbeddings([text], model);
    return {
      embedding: result.embeddings[0],
      model: result.model,
      dimensions: result.dimensions,
      usage: result.usage,
    };
  }

  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/embed`,
          {
            texts,
            model: modelToUse,
            input_type: 'search_document', // For storing in vector DB
            embedding_types: ['float'],
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const embeddings = response.data.embeddings.float;
        const dimensions = embeddings[0]?.length || 0;

        return {
          embeddings,
          model: modelToUse,
          dimensions,
          usage: response.data.meta?.billed_units ? {
            promptTokens: response.data.meta.billed_units.input_tokens || 0,
            totalTokens: response.data.meta.billed_units.input_tokens || 0,
          } : undefined,
        };
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.message || error.message;
          let wrappedError: any;

          if (status === 401) {
            wrappedError = new Error(`Cohere API authentication failed. Please check your COHERE_API_KEY. ${message}`);
          } else if (status === 429) {
            wrappedError = new Error(`Cohere API rate limit exceeded. ${message}`);
          } else if (status === 400) {
            wrappedError = new Error(`Cohere API request invalid: ${message}`);
          } else {
            wrappedError = new Error(`Cohere API error (${status}): ${message}`);
          }

          // Preserve error metadata for retry logic
          if (error.code) wrappedError.code = error.code;
          if (error.response) wrappedError.response = error.response;

          throw wrappedError;
        }

        throw error;
      }
    });
  }
}

