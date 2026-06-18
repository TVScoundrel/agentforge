import { describe, expect, it } from 'vitest';

import {
  EmbeddingManager,
  createEmbeddingConfig,
  mockCohereEmbeddingProvider,
  mockGetEmbeddingProvider,
  mockHuggingFaceEmbeddingProvider,
  mockOllamaEmbeddingProvider,
  mockOpenAIEmbeddingProvider,
  mockVoyageEmbeddingProvider,
} from './shared.js';

describe('EmbeddingManager provider selection', () => {
  it('creates the OpenAI provider for openai configs', () => {
    const manager = new EmbeddingManager();

    manager.initialize(createEmbeddingConfig('openai'));

    expect(mockOpenAIEmbeddingProvider).toHaveBeenCalledWith('openai-api-key');
  });

  it('creates the Cohere provider for cohere configs', () => {
    const manager = new EmbeddingManager();

    manager.initialize(createEmbeddingConfig('cohere'));

    expect(mockCohereEmbeddingProvider).toHaveBeenCalledWith('cohere-api-key');
  });

  it('creates the HuggingFace provider for huggingface configs', () => {
    const manager = new EmbeddingManager();

    manager.initialize(createEmbeddingConfig('huggingface'));

    expect(mockHuggingFaceEmbeddingProvider).toHaveBeenCalledWith('huggingface-api-key');
  });

  it('creates the Voyage provider for voyage configs', () => {
    const manager = new EmbeddingManager();

    manager.initialize(createEmbeddingConfig('voyage'));

    expect(mockVoyageEmbeddingProvider).toHaveBeenCalledWith('voyage-api-key');
  });

  it('creates the Ollama provider for ollama configs', () => {
    const manager = new EmbeddingManager();

    manager.initialize(createEmbeddingConfig('ollama', { apiKey: '' }));

    expect(mockOllamaEmbeddingProvider).toHaveBeenCalledWith(undefined, 'http://localhost:11434');
  });

  it('rejects unknown providers returned from environment resolution', () => {
    const manager = new EmbeddingManager();

    mockGetEmbeddingProvider.mockReturnValue('custom');

    expect(() => manager.initializeFromEnv()).toThrow('Unknown embedding provider: custom');
  });
});
