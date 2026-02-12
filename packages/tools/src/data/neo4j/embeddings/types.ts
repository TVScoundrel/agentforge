/**
 * Embedding Generation Types
 * 
 * Types and interfaces for embedding generation providers
 */

/**
 * Supported embedding providers
 */
export type EmbeddingProvider = 'openai' | 'cohere' | 'huggingface' | 'voyage' | 'ollama';

/**
 * Configuration for embedding generation
 */
export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  apiKey: string;
  dimensions?: number;
}

/**
 * Result from embedding generation
 */
export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Base interface for embedding providers
 */
export interface IEmbeddingProvider {
  readonly name: EmbeddingProvider;
  readonly defaultModel: string;
  
  /**
   * Check if provider is available (API key configured)
   */
  isAvailable(): boolean;
  
  /**
   * Generate embedding for a single text
   */
  generateEmbedding(text: string, model?: string): Promise<EmbeddingResult>;
  
  /**
   * Generate embeddings for multiple texts (batch)
   */
  generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult>;
}

/**
 * Retry configuration for embedding API calls
 */
export interface EmbeddingRetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

