import type { RunnableConfig } from '@langchain/core/runnables';
import type { CompiledStateGraph } from '@langchain/langgraph';
import type { WorkerCapabilities } from './schemas.js';
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

export interface MultiAgentSystemWithRegistry
  extends CompiledStateGraph<MultiAgentStateType, unknown> {
  _workerRegistry?: Record<string, WorkerCapabilities>;
  _originalInvoke?: (
    input: Partial<MultiAgentStateType>,
    config?: RunnableConfig,
  ) => ReturnType<MultiAgentSystemWithRegistry['invoke']>;
  _originalStream?: (
    input: Partial<MultiAgentStateType>,
    config?: RunnableConfig,
  ) => ReturnType<MultiAgentSystemWithRegistry['stream']>;
}
