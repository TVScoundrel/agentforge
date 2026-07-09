import { pickRunnableConfigKeys, type RunnableConfig } from '@langchain/core/runnables';
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

function removeUndefinedEntries<T extends Record<string, unknown>>(
  value: T
): Partial<T> | undefined {
  const filtered = Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as Partial<T>;

  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

export function toRunnableConfig(
  config: WorkerExecutionConfig | undefined
): RunnableConfig | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  const runnableConfig = pickRunnableConfigKeys(config);

  if (!runnableConfig || !isRecord(runnableConfig)) {
    return undefined;
  }

  const cleanedConfig = removeUndefinedEntries(runnableConfig);
  if (!cleanedConfig) {
    return undefined;
  }

  const { configurable, ...restConfig } = cleanedConfig;
  const cleanedConfigurable = isRecord(configurable)
    ? removeUndefinedEntries(configurable)
    : undefined;

  return {
    ...restConfig,
    ...(cleanedConfigurable !== undefined ? { configurable: cleanedConfigurable } : {}),
  };
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
