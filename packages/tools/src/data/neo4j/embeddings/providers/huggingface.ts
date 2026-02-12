/**
 * HuggingFace Embedding Provider
 * 
 * Implementation of embedding generation using HuggingFace Inference API
 * https://huggingface.co/docs/api-inference/detailed_parameters#feature-extraction-task
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { retryWithBackoff } from '../utils.js';

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
    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/${modelToUse}`,
          {
            inputs: text,
            options: {
              wait_for_model: true,
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // HuggingFace returns the embedding directly as an array
        const embedding = Array.isArray(response.data) ? response.data : response.data[0];

        return {
          embedding,
          model: modelToUse,
          dimensions: embedding.length,
        };
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error || error.message;
          let wrappedError: any;

          if (status === 401) {
            wrappedError = new Error(`HuggingFace API authentication failed. Please check your HUGGINGFACE_API_KEY. ${message}`);
          } else if (status === 429) {
            wrappedError = new Error(`HuggingFace API rate limit exceeded. ${message}`);
          } else if (status === 400) {
            wrappedError = new Error(`HuggingFace API request invalid: ${message}`);
          } else if (status === 503) {
            wrappedError = new Error(`HuggingFace model is loading. Please retry in a moment. ${message}`);
          } else {
            wrappedError = new Error(`HuggingFace API error (${status}): ${message}`);
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

  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/${modelToUse}`,
          {
            inputs: texts,
            options: {
              wait_for_model: true,
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const embeddings = response.data;
        const dimensions = embeddings[0]?.length || 0;

        return {
          embeddings,
          model: modelToUse,
          dimensions,
        };
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error || error.message;
          let wrappedError: any;

          if (status === 401) {
            wrappedError = new Error(`HuggingFace API authentication failed. Please check your HUGGINGFACE_API_KEY. ${message}`);
          } else if (status === 429) {
            wrappedError = new Error(`HuggingFace API rate limit exceeded. ${message}`);
          } else if (status === 400) {
            wrappedError = new Error(`HuggingFace API request invalid: ${message}`);
          } else if (status === 503) {
            wrappedError = new Error(`HuggingFace model is loading. Please retry in a moment. ${message}`);
          } else {
            wrappedError = new Error(`HuggingFace API error (${status}): ${message}`);
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

