import { createLogger } from '@agentforge/core';

import type { EmbeddingConfig, IEmbeddingProvider } from './types.js';

export const embeddingLogger = createLogger('agentforge:tools:neo4j:embeddings');

export interface InitializedEmbeddingState {
  config: EmbeddingConfig;
  provider: IEmbeddingProvider;
}

const NOT_INITIALIZED_ERROR =
  'Embedding manager not initialized. Call initialize() or initializeFromEnv() first.';

export function requireEmbeddingProvider(provider: IEmbeddingProvider | null): IEmbeddingProvider {
  if (!provider) {
    throw new Error(NOT_INITIALIZED_ERROR);
  }

  return provider;
}

export function requireEmbeddingConfig(config: EmbeddingConfig | null): EmbeddingConfig {
  if (!config) {
    throw new Error(NOT_INITIALIZED_ERROR);
  }

  return config;
}
