/**
 * Embedding Manager
 *
 * Manages embedding generation across different providers
 */

import { createLogger } from '@agentforge/core';
import type { IEmbeddingProvider, EmbeddingProvider, EmbeddingConfig, EmbeddingResult, BatchEmbeddingResult } from './types.js';
import { OpenAIEmbeddingProvider } from './providers/openai.js';
import { CohereEmbeddingProvider } from './providers/cohere.js';
import { HuggingFaceEmbeddingProvider } from './providers/huggingface.js';
import { VoyageEmbeddingProvider } from './providers/voyage.js';
import { OllamaEmbeddingProvider } from './providers/ollama.js';
import {
  getEmbeddingProvider,
  getEmbeddingModel,
  getOpenAIApiKey,
  getCohereApiKey,
  getHuggingFaceApiKey,
  getVoyageApiKey,
  getOllamaBaseUrl,
} from './utils.js';

const logger = createLogger('agentforge:tools:neo4j:embeddings');

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
    logger.debug('Initializing embedding manager', {
      provider: config.provider,
      model: config.model,
    });

    this.config = config;
    this.provider = this.createProvider(config.provider, config.apiKey);

    logger.info('Embedding manager initialized', {
      provider: config.provider,
      model: config.model || this.getDefaultModel(config.provider),
    });
  }

  /**
   * Initialize from environment variables
   */
  initializeFromEnv(): void {
    const providerName = getEmbeddingProvider() as EmbeddingProvider;
    const model = getEmbeddingModel();

    logger.debug('Initializing embedding manager from environment', {
      provider: providerName,
      model: model || this.getDefaultModel(providerName),
    });

    // Get API key based on provider
    let apiKey = '';
    let baseUrl = '';

    switch (providerName) {
      case 'openai': {
        const key = getOpenAIApiKey();
        if (!key) {
          logger.error('OPENAI_API_KEY environment variable not set', {
            provider: 'openai',
            required: true,
          });
          throw new Error('OPENAI_API_KEY environment variable is required for OpenAI embeddings');
        }
        apiKey = key;
        logger.debug('OpenAI API key found');
        break;
      }

      case 'cohere': {
        const key = getCohereApiKey();
        if (!key) {
          logger.error('COHERE_API_KEY environment variable not set', {
            provider: 'cohere',
            required: true,
          });
          throw new Error('COHERE_API_KEY environment variable is required for Cohere embeddings');
        }
        apiKey = key;
        logger.debug('Cohere API key found');
        break;
      }

      case 'huggingface': {
        const key = getHuggingFaceApiKey();
        if (!key) {
          logger.error('HUGGINGFACE_API_KEY environment variable not set', {
            provider: 'huggingface',
            required: true,
          });
          throw new Error('HUGGINGFACE_API_KEY environment variable is required for HuggingFace embeddings');
        }
        apiKey = key;
        logger.debug('HuggingFace API key found');
        break;
      }

      case 'voyage': {
        const key = getVoyageApiKey();
        if (!key) {
          logger.error('VOYAGE_API_KEY environment variable not set', {
            provider: 'voyage',
            required: true,
          });
          throw new Error('VOYAGE_API_KEY environment variable is required for Voyage AI embeddings');
        }
        apiKey = key;
        logger.debug('Voyage API key found');
        break;
      }

      case 'ollama':
        baseUrl = getOllamaBaseUrl();
        logger.debug('Using Ollama (local, no API key required)', {
          baseUrl: baseUrl || 'http://localhost:11434',
        });
        // Ollama doesn't require an API key (local)
        break;

      default:
        logger.error('Unknown embedding provider', {
          provider: providerName,
        });
        throw new Error(`Unknown embedding provider: ${providerName}`);
    }

    // Create provider
    this.provider = this.createProvider(providerName, apiKey, model, baseUrl);
    this.config = {
      provider: providerName,
      model: model || this.getDefaultModel(providerName),
      apiKey: '', // Not stored when using env
    };

    logger.info('Embedding manager initialized from environment', {
      provider: providerName,
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
    if (!this.provider) {
      throw new Error('Embedding manager not initialized. Call initialize() or initializeFromEnv() first.');
    }
    return this.provider;
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbeddingConfig {
    if (!this.config) {
      throw new Error('Embedding manager not initialized. Call initialize() or initializeFromEnv() first.');
    }
    return this.config;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    const startTime = Date.now();
    const provider = this.getProvider();
    const config = this.getConfig();

    // Use provided model, fall back to configured model, then provider default
    const modelToUse = model || config.model;

    logger.debug('Generating embedding', {
      provider: provider.name,
      model: modelToUse,
      textLength: text.length,
    });

    // Pass model parameter to provider
    const result = await provider.generateEmbedding(text, modelToUse);

    logger.info('Embedding generated', {
      provider: provider.name,
      model: result.model,
      dimensions: result.dimensions,
      duration: Date.now() - startTime,
    });

    return result;
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateBatchEmbeddings(texts: string[], model?: string): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const provider = this.getProvider();
    const config = this.getConfig();

    // Use provided model, fall back to configured model, then provider default
    const modelToUse = model || config.model;

    logger.debug('Generating batch embeddings', {
      provider: provider.name,
      model: modelToUse,
      count: texts.length,
    });

    // Pass model parameter to provider
    const result = await provider.generateBatchEmbeddings(texts, modelToUse);

    logger.info('Batch embeddings generated', {
      provider: provider.name,
      model: result.model,
      dimensions: result.dimensions,
      count: texts.length,
      duration: Date.now() - startTime,
    });

    return result;
  }

  /**
   * Get default model for a provider
   */
  private getDefaultModel(provider: EmbeddingProvider): string {
    switch (provider) {
      case 'openai':
        return 'text-embedding-3-small';
      case 'cohere':
        return 'embed-english-v3.0';
      case 'huggingface':
        return 'sentence-transformers/all-MiniLM-L6-v2';
      case 'voyage':
        return 'voyage-2';
      case 'ollama':
        return 'nomic-embed-text';
      default:
        return 'text-embedding-3-small';
    }
  }

  /**
   * Create a provider instance
   */
  private createProvider(
    providerName: EmbeddingProvider,
    apiKey?: string,
    model?: string,
    baseUrl?: string
  ): IEmbeddingProvider {
    switch (providerName) {
      case 'openai':
        return new OpenAIEmbeddingProvider(apiKey);

      case 'cohere':
        return new CohereEmbeddingProvider(apiKey);

      case 'huggingface':
        return new HuggingFaceEmbeddingProvider(apiKey);

      case 'voyage':
        return new VoyageEmbeddingProvider(apiKey);

      case 'ollama':
        return new OllamaEmbeddingProvider(model, baseUrl || 'http://localhost:11434');

      default:
        throw new Error(`Unknown embedding provider: ${providerName}`);
    }
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

