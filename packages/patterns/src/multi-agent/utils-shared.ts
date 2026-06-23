import type { RunnableConfig } from '@langchain/core/runnables';
import type { CompiledStateGraph } from '@langchain/langgraph';
import type { WorkerExecutionConfig } from './types.js';

export type ReActAgentGraph = CompiledStateGraph<string, unknown>;

export interface ReActAction {
  name?: unknown;
}

export interface ReActResultShape {
  messages?: Array<{ content?: unknown }>;
  actions?: ReActAction[];
  iteration?: unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRunnableConfig(
  config: WorkerExecutionConfig | undefined
): RunnableConfig | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  return config as RunnableConfig;
}

export function getReActResultShape(value: unknown): ReActResultShape {
  if (!isRecord(value)) {
    return {};
  }

  const messages = Array.isArray(value.messages)
    ? value.messages.filter((message): message is { content?: unknown } => isRecord(message))
    : undefined;

  const actions = Array.isArray(value.actions)
    ? value.actions.filter((action): action is ReActAction => isRecord(action))
    : undefined;

  return {
    messages,
    actions,
    iteration: value.iteration,
  };
}
