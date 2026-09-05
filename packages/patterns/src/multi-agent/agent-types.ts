import type { CompiledStateGraph } from '@langchain/langgraph';
import type { MultiAgentStateType } from './state.js';
import type { WorkerConfig } from './types.js';

export interface RegisterWorkerInput {
  name: string;
  description?: string;
  capabilities: string[];
  tools?: WorkerConfig['tools'];
  systemPrompt?: string;
}

export interface BuilderWorkerInput extends RegisterWorkerInput {
  model?: WorkerConfig['model'];
}

export type MultiAgentSystemWithRegistry = CompiledStateGraph<MultiAgentStateType, unknown>;
