/**
 * Ollama Embedding Provider
 * 
 * Implementation of embedding generation using Ollama (local embeddings)
 * https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { retryWithBackoff } from '../utils.js';

/**
 * Ollama embedding provider (local, privacy-focused)
 */
export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'ollama' as const;
  readonly defaultModel = 'nomic-embed-text';

  private baseUrl: string;

  constructor(model?: string, baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if Ollama is available (always true for local service)
   */
  isAvailable(): boolean {
    return true; // Ollama is local, no API key needed
  }

  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/embeddings`,
          {
            model: modelToUse,
            prompt: text,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const embedding = response.data.embedding;

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

          if (error.code === 'ECONNREFUSED') {
            wrappedError = new Error(`Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running locally.`);
          } else if (status === 404) {
            wrappedError = new Error(`Ollama model not found. Pull it with: ollama pull <model-name>`);
          } else if (status === 400) {
            wrappedError = new Error(`Ollama API request invalid: ${message}`);
          } else {
            wrappedError = new Error(`Ollama API error (${status}): ${message}`);
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

    // Ollama doesn't support batch embeddings, so we'll call individually
    const embeddings: number[][] = [];

    for (const text of texts) {
      const result = await this.generateEmbedding(text, modelToUse);
      embeddings.push(result.embedding);
    }

    const dimensions = embeddings[0]?.length || 0;

    return {
      embeddings,
      model: modelToUse,
      dimensions,
    };
  }
}

