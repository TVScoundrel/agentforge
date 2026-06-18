import { beforeEach, vi } from 'vitest';

import type {
  BatchEmbeddingResult,
  EmbeddingConfig,
  EmbeddingProvider,
  EmbeddingResult,
} from '../../../../src/data/neo4j/embeddings/types.js';

type AvailabilityFn = () => boolean;
type GenerateEmbeddingFn = (text: string, model?: string) => Promise<EmbeddingResult>;
type GenerateBatchEmbeddingsFn = (texts: string[], model?: string) => Promise<BatchEmbeddingResult>;

export interface ProviderStub {
  readonly name: EmbeddingProvider;
  readonly defaultModel: string;
  readonly isAvailable: ReturnType<typeof vi.fn<AvailabilityFn>>;
  readonly generateEmbedding: ReturnType<typeof vi.fn<GenerateEmbeddingFn>>;
  readonly generateBatchEmbeddings: ReturnType<typeof vi.fn<GenerateBatchEmbeddingsFn>>;
}

function createProviderStub(name: EmbeddingProvider, defaultModel: string): ProviderStub {
  return {
    name,
    defaultModel,
    isAvailable: vi.fn<AvailabilityFn>(() => true),
    generateEmbedding: vi.fn<GenerateEmbeddingFn>(),
    generateBatchEmbeddings: vi.fn<GenerateBatchEmbeddingsFn>(),
  };
}

const hoisted = vi.hoisted(() => {
  const providerStubs = {
    openai: createProviderStub('openai', 'text-embedding-3-small'),
    cohere: createProviderStub('cohere', 'embed-english-v3.0'),
    huggingface: createProviderStub('huggingface', 'sentence-transformers/all-MiniLM-L6-v2'),
    voyage: createProviderStub('voyage', 'voyage-2'),
    ollama: createProviderStub('ollama', 'nomic-embed-text'),
  } satisfies Record<EmbeddingProvider, ProviderStub>;

  return {
    providerStubs,
    mockOpenAIEmbeddingProvider: vi.fn<(apiKey?: string) => ProviderStub>(),
    mockCohereEmbeddingProvider: vi.fn<(apiKey?: string) => ProviderStub>(),
    mockHuggingFaceEmbeddingProvider: vi.fn<(apiKey?: string) => ProviderStub>(),
    mockVoyageEmbeddingProvider: vi.fn<(apiKey?: string) => ProviderStub>(),
    mockOllamaEmbeddingProvider: vi.fn<(model?: string, baseUrl?: string) => ProviderStub>(),
    mockGetEmbeddingProvider: vi.fn<() => string>(),
    mockGetEmbeddingModel: vi.fn<() => string | undefined>(),
    mockGetOpenAIApiKey: vi.fn<() => string | undefined>(),
    mockGetCohereApiKey: vi.fn<() => string | undefined>(),
    mockGetHuggingFaceApiKey: vi.fn<() => string | undefined>(),
    mockGetVoyageApiKey: vi.fn<() => string | undefined>(),
    mockGetOllamaBaseUrl: vi.fn<() => string>(),
  };
});

vi.mock('../../../../src/data/neo4j/embeddings/providers/openai.js', () => ({
  OpenAIEmbeddingProvider: hoisted.mockOpenAIEmbeddingProvider,
}));

vi.mock('../../../../src/data/neo4j/embeddings/providers/cohere.js', () => ({
  CohereEmbeddingProvider: hoisted.mockCohereEmbeddingProvider,
}));

vi.mock('../../../../src/data/neo4j/embeddings/providers/huggingface.js', () => ({
  HuggingFaceEmbeddingProvider: hoisted.mockHuggingFaceEmbeddingProvider,
}));

vi.mock('../../../../src/data/neo4j/embeddings/providers/voyage.js', () => ({
  VoyageEmbeddingProvider: hoisted.mockVoyageEmbeddingProvider,
}));

vi.mock('../../../../src/data/neo4j/embeddings/providers/ollama.js', () => ({
  OllamaEmbeddingProvider: hoisted.mockOllamaEmbeddingProvider,
}));

vi.mock('../../../../src/data/neo4j/embeddings/utils.js', () => ({
  getEmbeddingProvider: hoisted.mockGetEmbeddingProvider,
  getEmbeddingModel: hoisted.mockGetEmbeddingModel,
  getOpenAIApiKey: hoisted.mockGetOpenAIApiKey,
  getCohereApiKey: hoisted.mockGetCohereApiKey,
  getHuggingFaceApiKey: hoisted.mockGetHuggingFaceApiKey,
  getVoyageApiKey: hoisted.mockGetVoyageApiKey,
  getOllamaBaseUrl: hoisted.mockGetOllamaBaseUrl,
}));

import * as embeddingManagerModule from '../../../../src/data/neo4j/embeddings/embedding-manager.js';

export const EmbeddingManager = embeddingManagerModule.EmbeddingManager;
export const embeddingManager = embeddingManagerModule.embeddingManager;
export const generateBatchEmbeddings = embeddingManagerModule.generateBatchEmbeddings;
export const generateEmbedding = embeddingManagerModule.generateEmbedding;
export const initializeEmbeddings = embeddingManagerModule.initializeEmbeddings;
export const initializeEmbeddingsWithConfig = embeddingManagerModule.initializeEmbeddingsWithConfig;

export const providerStubs = hoisted.providerStubs;
export const mockOpenAIEmbeddingProvider = hoisted.mockOpenAIEmbeddingProvider;
export const mockCohereEmbeddingProvider = hoisted.mockCohereEmbeddingProvider;
export const mockHuggingFaceEmbeddingProvider = hoisted.mockHuggingFaceEmbeddingProvider;
export const mockVoyageEmbeddingProvider = hoisted.mockVoyageEmbeddingProvider;
export const mockOllamaEmbeddingProvider = hoisted.mockOllamaEmbeddingProvider;
export const mockGetEmbeddingProvider = hoisted.mockGetEmbeddingProvider;
export const mockGetEmbeddingModel = hoisted.mockGetEmbeddingModel;
export const mockGetOpenAIApiKey = hoisted.mockGetOpenAIApiKey;
export const mockGetCohereApiKey = hoisted.mockGetCohereApiKey;
export const mockGetHuggingFaceApiKey = hoisted.mockGetHuggingFaceApiKey;
export const mockGetVoyageApiKey = hoisted.mockGetVoyageApiKey;
export const mockGetOllamaBaseUrl = hoisted.mockGetOllamaBaseUrl;

export function createEmbeddingConfig(
  provider: EmbeddingProvider,
  overrides: Partial<EmbeddingConfig> = {}
): EmbeddingConfig {
  return {
    provider,
    model: overrides.model ?? `configured-${provider}-model`,
    apiKey: overrides.apiKey ?? `${provider}-api-key`,
    dimensions: overrides.dimensions,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  embeddingManager.reset();

  hoisted.mockOpenAIEmbeddingProvider.mockImplementation(() => providerStubs.openai);
  hoisted.mockCohereEmbeddingProvider.mockImplementation(() => providerStubs.cohere);
  hoisted.mockHuggingFaceEmbeddingProvider.mockImplementation(() => providerStubs.huggingface);
  hoisted.mockVoyageEmbeddingProvider.mockImplementation(() => providerStubs.voyage);
  hoisted.mockOllamaEmbeddingProvider.mockImplementation(() => providerStubs.ollama);

  hoisted.mockGetEmbeddingProvider.mockReturnValue('openai');
  hoisted.mockGetEmbeddingModel.mockReturnValue(undefined);
  hoisted.mockGetOpenAIApiKey.mockReturnValue('env-openai-key');
  hoisted.mockGetCohereApiKey.mockReturnValue('env-cohere-key');
  hoisted.mockGetHuggingFaceApiKey.mockReturnValue('env-huggingface-key');
  hoisted.mockGetVoyageApiKey.mockReturnValue('env-voyage-key');
  hoisted.mockGetOllamaBaseUrl.mockReturnValue('http://localhost:11434');

  providerStubs.openai.generateEmbedding.mockResolvedValue({
    embedding: [0.1, 0.2, 0.3],
    model: 'text-embedding-3-small',
    dimensions: 3,
  });
  providerStubs.openai.generateBatchEmbeddings.mockResolvedValue({
    embeddings: [[0.1, 0.2, 0.3]],
    model: 'text-embedding-3-small',
    dimensions: 3,
  });

  providerStubs.cohere.generateEmbedding.mockResolvedValue({
    embedding: [0.4, 0.5],
    model: 'embed-english-v3.0',
    dimensions: 2,
  });
  providerStubs.cohere.generateBatchEmbeddings.mockResolvedValue({
    embeddings: [[0.4, 0.5]],
    model: 'embed-english-v3.0',
    dimensions: 2,
  });

  providerStubs.huggingface.generateEmbedding.mockResolvedValue({
    embedding: [0.6],
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 1,
  });
  providerStubs.huggingface.generateBatchEmbeddings.mockResolvedValue({
    embeddings: [[0.6]],
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 1,
  });

  providerStubs.voyage.generateEmbedding.mockResolvedValue({
    embedding: [0.7, 0.8],
    model: 'voyage-2',
    dimensions: 2,
  });
  providerStubs.voyage.generateBatchEmbeddings.mockResolvedValue({
    embeddings: [[0.7, 0.8]],
    model: 'voyage-2',
    dimensions: 2,
  });

  providerStubs.ollama.generateEmbedding.mockResolvedValue({
    embedding: [0.9, 1.0],
    model: 'nomic-embed-text',
    dimensions: 2,
  });
  providerStubs.ollama.generateBatchEmbeddings.mockResolvedValue({
    embeddings: [[0.9, 1.0]],
    model: 'nomic-embed-text',
    dimensions: 2,
  });
});
