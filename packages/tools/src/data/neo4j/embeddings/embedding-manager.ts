/**
 * Embedding Manager
 *
 * Stable public facade for embedding provider initialization and generation.
 */

import type { BatchEmbeddingResult, EmbeddingConfig, EmbeddingResult, IEmbeddingProvider } from './types.js';
import {
  embeddingLogger,
  requireEmbeddingConfig,
  requireEmbeddingProvider,
} from './embedding-manager-shared.js';
import { createEmbeddingProvider, getDefaultEmbeddingModel } from './embedding-provider-factory.js';
import { resolveEmbeddingEnvironment } from './embedding-environment.js';
import { generateManagedBatchEmbeddings, generateManagedEmbedding } from './embedding-generation.js';

/**
 * Singleton embedding manager
 */
export class EmbeddingManager {
  private provider: IEmbeddingProvider | null = null;
  private config: EmbeddingConfig | null = null;

  /**
   * Initialize with configuration
   */
  initialize(config: EmbeddingConfig): void {
    embeddingLogger.debug('Initializing embedding manager', {
      provider: config.provider,
      model: config.model,
    });

    this.config = config;
    this.provider = createEmbeddingProvider(config.provider, config.apiKey);

    embeddingLogger.info('Embedding manager initialized', {
      provider: config.provider,
      model: config.model || getDefaultEmbeddingModel(config.provider),
    });
  }

  /**
   * Initialize from environment variables
   */
  initializeFromEnv(): void {
    const resolved = resolveEmbeddingEnvironment();

    this.provider = createEmbeddingProvider(
      resolved.providerName,
      resolved.apiKey,
      resolved.config.model,
      resolved.baseUrl
    );
    this.config = resolved.config;

    embeddingLogger.info('Embedding manager initialized from environment', {
      provider: resolved.providerName,
      model: this.config.model,
    });
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.provider !== null && this.config !== null;
  }

  /**
   * Get current provider
   */
  getProvider(): IEmbeddingProvider {
    return requireEmbeddingProvider(this.provider);
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbeddingConfig {
    return requireEmbeddingConfig(this.config);
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    return generateManagedEmbedding(
      {
        provider: this.getProvider(),
        config: this.getConfig(),
      },
      text,
      model
    );
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    return generateManagedBatchEmbeddings(
      {
        provider: this.getProvider(),
        config: this.getConfig(),
      },
      texts,
      model
    );
  }

  /**
   * Reset the manager (for testing)
   */
  reset(): void {
    this.provider = null;
    this.config = null;
  }
}

/**
 * Singleton instance
 */
export const embeddingManager = new EmbeddingManager();

/**
 * Initialize embedding manager from environment variables
 */
export function initializeEmbeddings(): void {
  embeddingManager.initializeFromEnv();
}

/**
 * Initialize embedding manager with custom configuration
 */
export function initializeEmbeddingsWithConfig(config: EmbeddingConfig): void {
  embeddingManager.initialize(config);
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
  return embeddingManager.generateEmbedding(text, model);
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
  return embeddingManager.generateBatchEmbeddings(texts, model);
}
