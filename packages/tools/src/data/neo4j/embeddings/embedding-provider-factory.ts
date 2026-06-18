import type { EmbeddingProvider, IEmbeddingProvider } from './types.js';
import { OpenAIEmbeddingProvider } from './providers/openai.js';
import { CohereEmbeddingProvider } from './providers/cohere.js';
import { HuggingFaceEmbeddingProvider } from './providers/huggingface.js';
import { VoyageEmbeddingProvider } from './providers/voyage.js';
import { OllamaEmbeddingProvider } from './providers/ollama.js';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

export function parseEmbeddingProvider(providerName: string): EmbeddingProvider {
  switch (providerName) {
    case 'openai':
    case 'cohere':
    case 'huggingface':
    case 'voyage':
    case 'ollama':
      return providerName;
    default:
      throw new Error(`Unknown embedding provider: ${providerName}`);
  }
}

export function getDefaultEmbeddingModel(provider: EmbeddingProvider): string {
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
  }
}

export function createEmbeddingProvider(
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
      return new OllamaEmbeddingProvider(model, baseUrl || DEFAULT_OLLAMA_BASE_URL);
  }
}
