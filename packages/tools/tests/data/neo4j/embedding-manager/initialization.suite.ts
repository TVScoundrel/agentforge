import { describe, expect, it } from 'vitest';

import {
  EmbeddingManager,
  createEmbeddingConfig,
  embeddingManager,
  initializeEmbeddings,
  initializeEmbeddingsWithConfig,
  mockGetEmbeddingModel,
  mockGetEmbeddingProvider,
  mockGetOllamaBaseUrl,
  mockGetOpenAIApiKey,
  mockOllamaEmbeddingProvider,
  mockOpenAIEmbeddingProvider,
} from './shared.js';

describe('EmbeddingManager initialization', () => {
  it('stores configuration and creates the configured provider', () => {
    const manager = new EmbeddingManager();
    const config = createEmbeddingConfig('openai');

    manager.initialize(config);

    expect(manager.isInitialized()).toBe(true);
    expect(manager.getConfig()).toEqual(config);
    expect(mockOpenAIEmbeddingProvider).toHaveBeenCalledWith('openai-api-key');
  });

  it('initializes from env using the configured provider and explicit env model', () => {
    const manager = new EmbeddingManager();

    mockGetEmbeddingProvider.mockReturnValue('openai');
    mockGetEmbeddingModel.mockReturnValue('env-openai-model');
    mockGetOpenAIApiKey.mockReturnValue('env-key');

    manager.initializeFromEnv();

    expect(mockOpenAIEmbeddingProvider).toHaveBeenCalledWith('env-key');
    expect(manager.getConfig()).toEqual({
      provider: 'openai',
      model: 'env-openai-model',
      apiKey: '',
    });
  });

  it('falls back to the provider default model for ollama env initialization', () => {
    const manager = new EmbeddingManager();

    mockGetEmbeddingProvider.mockReturnValue('ollama');
    mockGetEmbeddingModel.mockReturnValue(undefined);
    mockGetOllamaBaseUrl.mockReturnValue('http://ollama.local:11434');

    manager.initializeFromEnv();

    expect(mockOllamaEmbeddingProvider).toHaveBeenCalledWith(
      'nomic-embed-text',
      'http://ollama.local:11434'
    );
    expect(manager.getConfig()).toEqual({
      provider: 'ollama',
      model: 'nomic-embed-text',
      apiKey: '',
    });
  });

  it('treats an empty env model as missing and falls back to the provider default', () => {
    const manager = new EmbeddingManager();

    mockGetEmbeddingProvider.mockReturnValue('openai');
    mockGetEmbeddingModel.mockReturnValue('');
    mockGetOpenAIApiKey.mockReturnValue('env-key');

    manager.initializeFromEnv();

    expect(manager.getConfig()).toEqual({
      provider: 'openai',
      model: 'text-embedding-3-small',
      apiKey: '',
    });
  });

  it('throws a helpful error when required env credentials are missing', () => {
    const manager = new EmbeddingManager();

    mockGetEmbeddingProvider.mockReturnValue('openai');
    mockGetOpenAIApiKey.mockReturnValue(undefined);

    expect(() => manager.initializeFromEnv()).toThrow(
      'OPENAI_API_KEY environment variable is required for OpenAI embeddings'
    );
  });

  it('rejects invalid env providers before model resolution', () => {
    const manager = new EmbeddingManager();

    mockGetEmbeddingProvider.mockReturnValue('custom');

    expect(() => manager.initializeFromEnv()).toThrow('Unknown embedding provider: custom');
    expect(mockGetEmbeddingModel).not.toHaveBeenCalled();
  });

  it('throws when configuration is requested before initialization', () => {
    const manager = new EmbeddingManager();

    expect(() => manager.getConfig()).toThrow(
      'Embedding manager not initialized. Call initialize() or initializeFromEnv() first.'
    );
    expect(() => manager.getProvider()).toThrow(
      'Embedding manager not initialized. Call initialize() or initializeFromEnv() first.'
    );
  });

  it('supports the singleton initialization helpers', () => {
    initializeEmbeddingsWithConfig(createEmbeddingConfig('cohere'));

    expect(embeddingManager.isInitialized()).toBe(true);

    embeddingManager.reset();
    initializeEmbeddings();

    expect(embeddingManager.isInitialized()).toBe(true);
  });
});
