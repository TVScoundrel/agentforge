/**
 * Voyage AI Embedding Provider
 * 
 * Implementation of embedding generation using Voyage AI's API
 * https://docs.voyageai.com/docs/embeddings
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { retryWithBackoff } from '../utils.js';

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
          `${this.baseUrl}/embeddings`,
          {
            input: texts,
            model: modelToUse,
            input_type: 'document', // For storing in vector DB
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const embeddings = response.data.data.map((item: any) => item.embedding);
        const dimensions = embeddings[0]?.length || 0;

        return {
          embeddings,
          model: modelToUse,
          dimensions,
          usage: response.data.usage ? {
            promptTokens: response.data.usage.total_tokens || 0,
            totalTokens: response.data.usage.total_tokens || 0,
          } : undefined,
        };
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.message || error.message;
          let wrappedError: any;

          if (status === 401) {
            wrappedError = new Error(`Voyage AI API authentication failed. Please check your VOYAGE_API_KEY. ${message}`);
          } else if (status === 429) {
            wrappedError = new Error(`Voyage AI API rate limit exceeded. ${message}`);
          } else if (status === 400) {
            wrappedError = new Error(`Voyage AI API request invalid: ${message}`);
          } else {
            wrappedError = new Error(`Voyage AI API error (${status}): ${message}`);
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

