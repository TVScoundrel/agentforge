/**
 * HuggingFace Embedding Provider
 *
 * Implementation of embedding generation using HuggingFace Inference API
 * https://huggingface.co/docs/api-inference/detailed_parameters#feature-extraction-task
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { retryWithBackoff, withProviderErrorMetadata } from '../utils.js';

type SingleEmbeddingResponse = number[] | { 0: number[] };

/**
 * HuggingFace embedding provider
 */
export class HuggingFaceEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'huggingface' as const;
  readonly defaultModel = 'sentence-transformers/all-MiniLM-L6-v2';

  private apiKey: string | undefined;
  private baseUrl = 'https://api-inference.huggingface.co/pipeline/feature-extraction';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check if HuggingFace is available (API key is set)
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    const { data, model: modelToUse } = await this.requestEmbeddings<SingleEmbeddingResponse>(
      text,
      model
    );

    // HuggingFace returns the embedding directly as an array
    const embedding = Array.isArray(data) ? data : data[0];

    return {
      embedding,
      model: modelToUse,
      dimensions: embedding.length,
    };
  }

  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    const { data: embeddings, model: modelToUse } = await this.requestEmbeddings<number[][]>(
      texts,
      model
    );
    const dimensions = embeddings[0]?.length || 0;

    return {
      embeddings,
      model: modelToUse,
      dimensions,
    };
  }

  private async requestEmbeddings<T>(
    inputs: string | string[],
    model?: string
  ): Promise<{ data: T; model: string }> {
    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post<T>(
          `${this.baseUrl}/${modelToUse}`,
          {
            inputs,
            options: {
              wait_for_model: true,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return {
          data: response.data,
          model: modelToUse,
        };
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error || error.message;
          let messageText: string;

          if (status === 401) {
            messageText = `HuggingFace API authentication failed. Please check your HUGGINGFACE_API_KEY. ${message}`;
          } else if (status === 429) {
            messageText = `HuggingFace API rate limit exceeded. ${message}`;
          } else if (status === 400) {
            messageText = `HuggingFace API request invalid: ${message}`;
          } else if (status === 503) {
            messageText = `HuggingFace model is loading. Please retry in a moment. ${message}`;
          } else {
            messageText = `HuggingFace API error (${status}): ${message}`;
          }

          throw withProviderErrorMetadata(error, messageText);
        }

        throw error;
      }
    });
  }
}
