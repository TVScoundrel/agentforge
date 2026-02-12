/**
 * Embedding Utilities
 *
 * Utility functions for embedding generation
 */

import type { EmbeddingRetryConfig } from './types.js';

/**
 * Default retry configuration for embedding API calls
 */
export const DEFAULT_RETRY_CONFIG: EmbeddingRetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Check if error is retryable (network errors, timeouts, 5xx errors, rate limits)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return true;
  }

  // 5xx server errors (but not 4xx client errors)
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // Rate limiting (429) - retryable with backoff
  if (error.response?.status === 429) {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: EmbeddingRetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Get OpenAI API key from environment
 */
export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

/**
 * Get Cohere API key from environment
 */
export function getCohereApiKey(): string | undefined {
  return process.env.COHERE_API_KEY;
}

/**
 * Get HuggingFace API key from environment
 */
export function getHuggingFaceApiKey(): string | undefined {
  return process.env.HUGGINGFACE_API_KEY;
}

/**
 * Get Voyage AI API key from environment
 */
export function getVoyageApiKey(): string | undefined {
  return process.env.VOYAGE_API_KEY;
}

/**
 * Get Ollama base URL from environment (defaults to localhost)
 */
export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
}

/**
 * Get embedding provider from environment (defaults to 'openai')
 */
export function getEmbeddingProvider(): string {
  return process.env.EMBEDDING_PROVIDER || 'openai';
}

/**
 * Get embedding model from environment
 */
export function getEmbeddingModel(): string | undefined {
  return process.env.EMBEDDING_MODEL;
}

/**
 * Validate text for embedding generation
 */
export function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  
  // Most embedding models have token limits (e.g., 8191 for OpenAI)
  // This is a rough character limit check
  if (text.length > 50000) {
    throw new Error('Text is too long for embedding generation (max ~50,000 characters)');
  }
}

/**
 * Validate batch of texts
 */
export function validateBatch(texts: string[]): void {
  if (!texts || texts.length === 0) {
    throw new Error('Batch cannot be empty');
  }
  
  if (texts.length > 2048) {
    throw new Error('Batch size too large (max 2048 texts)');
  }
  
  texts.forEach((text, index) => {
    try {
      validateText(text);
    } catch (error) {
      throw new Error(`Invalid text at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

