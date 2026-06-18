import { describe, expect, it } from 'vitest';

import {
  EmbeddingManager,
  createEmbeddingConfig,
  generateBatchEmbeddings,
  generateEmbedding,
  initializeEmbeddingsWithConfig,
  providerStubs,
} from './shared.js';

describe('EmbeddingManager generation', () => {
  it('passes an explicit model override to single embedding generation', async () => {
    const manager = new EmbeddingManager();
    manager.initialize(createEmbeddingConfig('openai', { model: 'configured-openai-model' }));

    await manager.generateEmbedding('hello world', 'override-model');

    expect(providerStubs.openai.generateEmbedding).toHaveBeenCalledWith('hello world', 'override-model');
  });

  it('falls back to the configured model for batch generation', async () => {
    const manager = new EmbeddingManager();
    manager.initialize(createEmbeddingConfig('cohere', { model: 'configured-cohere-model' }));

    await manager.generateBatchEmbeddings(['first', 'second']);

    expect(providerStubs.cohere.generateBatchEmbeddings).toHaveBeenCalledWith(
      ['first', 'second'],
      'configured-cohere-model'
    );
  });

  it('delegates top-level helper exports to the singleton manager', async () => {
    initializeEmbeddingsWithConfig(createEmbeddingConfig('voyage', { model: 'voyage-configured-model' }));

    await generateEmbedding('singleton-single');
    await generateBatchEmbeddings(['singleton-batch']);

    expect(providerStubs.voyage.generateEmbedding).toHaveBeenCalledWith(
      'singleton-single',
      'voyage-configured-model'
    );
    expect(providerStubs.voyage.generateBatchEmbeddings).toHaveBeenCalledWith(
      ['singleton-batch'],
      'voyage-configured-model'
    );
  });

  it('uses the resolved default env model when no model override is supplied', async () => {
    const manager = new EmbeddingManager();
    manager.initialize(createEmbeddingConfig('ollama', { model: 'nomic-embed-text', apiKey: '' }));

    await manager.generateEmbedding('local text');

    expect(providerStubs.ollama.generateEmbedding).toHaveBeenCalledWith('local text', 'nomic-embed-text');
  });
});
