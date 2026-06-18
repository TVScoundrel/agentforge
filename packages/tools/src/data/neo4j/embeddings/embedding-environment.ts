import type { EmbeddingConfig, EmbeddingProvider } from './types.js';
import {
  getEmbeddingProvider,
  getEmbeddingModel,
  getOpenAIApiKey,
  getCohereApiKey,
  getHuggingFaceApiKey,
  getVoyageApiKey,
  getOllamaBaseUrl,
} from './utils.js';
import { getDefaultEmbeddingModel } from './embedding-provider-factory.js';
import { embeddingLogger } from './embedding-manager-shared.js';

export interface ResolvedEmbeddingEnvironment {
  apiKey: string;
  baseUrl?: string;
  config: EmbeddingConfig;
  providerName: EmbeddingProvider;
}

export function resolveEmbeddingEnvironment(): ResolvedEmbeddingEnvironment {
  const providerName = getEmbeddingProvider() as EmbeddingProvider;
  const model = getEmbeddingModel() ?? getDefaultEmbeddingModel(providerName);

  embeddingLogger.debug('Initializing embedding manager from environment', {
    provider: providerName,
    model,
  });

  switch (providerName) {
    case 'openai':
      return createCredentialEnvironment(
        providerName,
        model,
        getOpenAIApiKey(),
        'OPENAI_API_KEY environment variable is required for OpenAI embeddings',
        'OPENAI_API_KEY environment variable not set'
      );
    case 'cohere':
      return createCredentialEnvironment(
        providerName,
        model,
        getCohereApiKey(),
        'COHERE_API_KEY environment variable is required for Cohere embeddings',
        'COHERE_API_KEY environment variable not set'
      );
    case 'huggingface':
      return createCredentialEnvironment(
        providerName,
        model,
        getHuggingFaceApiKey(),
        'HUGGINGFACE_API_KEY environment variable is required for HuggingFace embeddings',
        'HUGGINGFACE_API_KEY environment variable not set'
      );
    case 'voyage':
      return createCredentialEnvironment(
        providerName,
        model,
        getVoyageApiKey(),
        'VOYAGE_API_KEY environment variable is required for Voyage AI embeddings',
        'VOYAGE_API_KEY environment variable not set'
      );
    case 'ollama': {
      const baseUrl = getOllamaBaseUrl();
      embeddingLogger.debug('Using Ollama (local, no API key required)', {
        baseUrl,
      });

      return {
        providerName,
        apiKey: '',
        baseUrl,
        config: {
          provider: providerName,
          model,
          apiKey: '',
        },
      };
    }
    default:
      embeddingLogger.error('Unknown embedding provider', {
        provider: providerName,
      });
      throw new Error(`Unknown embedding provider: ${providerName}`);
  }
}

function createCredentialEnvironment(
  providerName: EmbeddingProvider,
  model: string,
  apiKey: string | undefined,
  missingKeyError: string,
  missingKeyLog: string
): ResolvedEmbeddingEnvironment {
  if (!apiKey) {
    embeddingLogger.error(missingKeyLog, {
      provider: providerName,
      required: true,
    });
    throw new Error(missingKeyError);
  }

  embeddingLogger.debug(`${providerName} API key found`);

  return {
    providerName,
    apiKey,
    config: {
      provider: providerName,
      model,
      apiKey: '',
    },
  };
}
