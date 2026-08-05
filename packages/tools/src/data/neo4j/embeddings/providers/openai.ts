/**
 * OpenAI Embedding Provider
 * 
 * Generate embeddings using OpenAI's embedding models.
 * Requires OPENAI_API_KEY environment variable.
 * Get your API key at: https://platform.openai.com/api-keys
 */

import axios from 'axios';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from '../types.js';
import { getOpenAIApiKey, retryWithBackoff, validateText, validateBatch, withProviderErrorMetadata } from '../utils.js';

/**
 * OpenAI API response structure for embeddings
 */
interface OpenAIEmbeddingResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI embedding provider implementation
 */
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'openai' as const;
  readonly defaultModel = 'text-embedding-3-small';
  
  private apiKey: string | undefined;
  private readonly baseURL = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || getOpenAIApiKey();
  }

  /**
   * Check if OpenAI is available (API key is set)
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not found. Set OPENAI_API_KEY environment variable. ' +
        'Get your key at https://platform.openai.com/api-keys'
      );
    }

    validateText(text);

    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post<OpenAIEmbeddingResponse>(
          `${this.baseURL}/embeddings`,
          {
            input: text,
            model: modelToUse,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds
          }
        );

        const data = response.data;
        
        if (!data.data || data.data.length === 0) {
          throw new Error('No embedding returned from OpenAI');
        }

        return {
          embedding: data.data[0].embedding,
          model: data.model,
          dimensions: data.data[0].embedding.length,
          usage: {
            promptTokens: data.usage.prompt_tokens,
            totalTokens: data.usage.total_tokens,
          },
        };
      } catch (error: unknown) {
        // Create error with helpful message while preserving metadata for retry logic
        let message: string;
        const response = axios.isAxiosError(error) ? error.response : undefined;

        if (response?.status === 401) {
          message = 'Invalid OpenAI API key. Get your key at https://platform.openai.com/api-keys';
        } else if (response?.status === 429) {
          message = 'OpenAI API rate limit exceeded. Please try again later or upgrade your plan.';
        } else if (response?.status === 400) {
          message = `OpenAI API error: ${response.data?.error?.message || 'Bad request'}`;
        } else {
          message = `OpenAI embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        throw withProviderErrorMetadata(error, message);
      }
    });
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not found. Set OPENAI_API_KEY environment variable. ' +
        'Get your key at https://platform.openai.com/api-keys'
      );
    }

    validateBatch(texts);

    const modelToUse = model || this.defaultModel;

    return retryWithBackoff(async () => {
      try {
        const response = await axios.post<OpenAIEmbeddingResponse>(
          `${this.baseURL}/embeddings`,
          {
            input: texts,
            model: modelToUse,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 seconds for batch
          }
        );

        const data = response.data;
        
        if (!data.data || data.data.length === 0) {
          throw new Error('No embeddings returned from OpenAI');
        }

        // Sort by index to ensure correct order
        const sortedData = data.data.sort((a, b) => a.index - b.index);

        return {
          embeddings: sortedData.map(item => item.embedding),
          model: data.model,
          dimensions: sortedData[0].embedding.length,
          usage: {
            promptTokens: data.usage.prompt_tokens,
            totalTokens: data.usage.total_tokens,
          },
        };
      } catch (error: unknown) {
        // Create error with helpful message while preserving metadata for retry logic
        let message: string;
        const response = axios.isAxiosError(error) ? error.response : undefined;

        if (response?.status === 401) {
          message = 'Invalid OpenAI API key. Get your key at https://platform.openai.com/api-keys';
        } else if (response?.status === 429) {
          message = 'OpenAI API rate limit exceeded. Please try again later or upgrade your plan.';
        } else if (response?.status === 400) {
          message = `OpenAI API error: ${response.data?.error?.message || 'Bad request'}`;
        } else {
          message = `OpenAI batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        throw withProviderErrorMetadata(error, message);
      }
    });
  }
}
