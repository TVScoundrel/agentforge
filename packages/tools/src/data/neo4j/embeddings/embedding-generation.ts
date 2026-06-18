import type { BatchEmbeddingResult, EmbeddingResult } from './types.js';
import type { InitializedEmbeddingState } from './embedding-manager-shared.js';
import { embeddingLogger } from './embedding-manager-shared.js';

export async function generateManagedEmbedding(
  state: InitializedEmbeddingState,
  text: string,
  model?: string
): Promise<EmbeddingResult> {
  const startTime = Date.now();
  const modelToUse = model || state.config.model;

  embeddingLogger.debug('Generating embedding', {
    provider: state.provider.name,
    model: modelToUse,
    textLength: text.length,
  });

  const result = await state.provider.generateEmbedding(text, modelToUse);

  embeddingLogger.info('Embedding generated', {
    provider: state.provider.name,
    model: result.model,
    dimensions: result.dimensions,
    duration: Date.now() - startTime,
  });

  return result;
}

export async function generateManagedBatchEmbeddings(
  state: InitializedEmbeddingState,
  texts: string[],
  model?: string
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();
  const modelToUse = model || state.config.model;

  embeddingLogger.debug('Generating batch embeddings', {
    provider: state.provider.name,
    model: modelToUse,
    count: texts.length,
  });

  const result = await state.provider.generateBatchEmbeddings(texts, modelToUse);

  embeddingLogger.info('Batch embeddings generated', {
    provider: state.provider.name,
    model: result.model,
    dimensions: result.dimensions,
    count: texts.length,
    duration: Date.now() - startTime,
  });

  return result;
}
