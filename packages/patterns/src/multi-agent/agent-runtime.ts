import type { RunnableConfig } from '@langchain/core/runnables';
import type { WorkerCapabilities } from './schemas.js';
import type { MultiAgentStateType } from './state.js';
import type { MultiAgentSystemWithRegistry, RegisterWorkerInput } from './agent-types.js';
import { toWorkerCapabilities } from './agent-workers.js';

function mergeWorkers(
  input: Partial<MultiAgentStateType>,
  workerCapabilities: Record<string, WorkerCapabilities>,
): Partial<MultiAgentStateType> {
  return {
    ...input,
    workers: {
      ...workerCapabilities,
      ...(input.workers || {}),
    },
  };
}

export function wrapCompiledSystem(
  system: MultiAgentSystemWithRegistry,
  workerCapabilities: Record<string, WorkerCapabilities>,
): MultiAgentSystemWithRegistry {
  const originalInvoke = system.invoke.bind(system);
  system.invoke = (async function (
    input: Partial<MultiAgentStateType>,
    config?: RunnableConfig,
  ) {
    return originalInvoke(
      mergeWorkers(input, workerCapabilities) as Parameters<typeof originalInvoke>[0],
      config as Parameters<typeof originalInvoke>[1],
    );
  }) as unknown as typeof system.invoke;

  const originalStream = system.stream.bind(system);
  system.stream = (async function (
    input: Partial<MultiAgentStateType>,
    config?: RunnableConfig,
  ) {
    return originalStream(
      mergeWorkers(input, workerCapabilities) as Parameters<typeof originalStream>[0],
      config as Parameters<typeof originalStream>[1],
    );
  }) as unknown as typeof system.stream;

  return system;
}

export function registerWorkerCapabilities(
  system: MultiAgentSystemWithRegistry,
  workers: RegisterWorkerInput[],
): void {
  if (!system._workerRegistry) {
    system._workerRegistry = {};
  }

  for (const worker of workers) {
    system._workerRegistry[worker.name] = toWorkerCapabilities(worker);
  }

  if (!system._originalInvoke) {
    system._originalInvoke = system.invoke.bind(system);
    system.invoke = (async function (
      input: Partial<MultiAgentStateType>,
      config?: RunnableConfig,
    ) {
      return system._originalInvoke!(
        mergeWorkers(input, system._workerRegistry || {}) as Parameters<
          NonNullable<typeof system._originalInvoke>
        >[0],
        config as Parameters<NonNullable<typeof system._originalInvoke>>[1],
      );
    }) as unknown as typeof system.invoke;
  }

  if (!system._originalStream) {
    system._originalStream = system.stream.bind(system);
    system.stream = (async function (
      input: Partial<MultiAgentStateType>,
      config?: RunnableConfig,
    ) {
      return system._originalStream!(
        mergeWorkers(input, system._workerRegistry || {}) as Parameters<
          NonNullable<typeof system._originalStream>
        >[0],
        config as Parameters<NonNullable<typeof system._originalStream>>[1],
      );
    }) as unknown as typeof system.stream;
  }
}
