import { Command, END, MemorySaver, StateGraph, interrupt } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';
import { createMultiAgentSystem } from '../../src/multi-agent/agent.js';
import type { WorkerCapabilities } from '../../src/multi-agent/schemas.js';
import { MultiAgentState, type MultiAgentStateType } from '../../src/multi-agent/state.js';
import { createWorkerInitializationNode } from '../../src/multi-agent/worker-initialization.js';

function workerCapabilities(
  skills: readonly string[],
  available = true,
  currentWorkload = 0
): Readonly<Record<string, WorkerCapabilities>> {
  return Object.freeze({
    researcher: Object.freeze({
      skills: Object.freeze([...skills]),
      tools: Object.freeze(['search']),
      available,
      currentWorkload,
    }),
  });
}

function createCheckpointedSystem(checkpointer: MemorySaver) {
  return createMultiAgentSystem({
    supervisor: { strategy: 'round-robin' },
    workers: [
      {
        id: 'researcher',
        capabilities: {
          skills: ['research'],
          tools: ['search'],
          available: true,
          currentWorkload: 0,
        },
        tools: [{ name: 'search' }],
      },
    ],
    maxIterations: 0,
    checkpointer,
  });
}

function createInterruptibleGraph(
  captureWorkerSnapshot: () => Readonly<Record<string, WorkerCapabilities>>,
  interruptingWorker: (state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>>
) {
  const workflow = new StateGraph(MultiAgentState);

  workflow.addNode('initializeWorkers', createWorkerInitializationNode(captureWorkerSnapshot));
  workflow.addNode('interruptingWorker', interruptingWorker);
  workflow.setEntryPoint('initializeWorkers');
  workflow.addEdge('initializeWorkers', 'interruptingWorker');
  workflow.addEdge('interruptingWorker', END);

  return workflow.compile({ checkpointer: new MemorySaver() });
}

describe('Multi-Agent Worker checkpoint lifecycle', () => {
  it('preserves checkpointed Worker status across executions in one thread', async () => {
    const system = createCheckpointedSystem(new MemorySaver());
    const config = { configurable: { thread_id: 'status-persistence' } };

    await system.invoke(
      {
        input: 'first',
        workers: {
          researcher: {
            skills: ['caller-owned'],
            tools: ['caller-owned'],
            available: false,
            currentWorkload: 4,
          },
        },
      },
      config
    );
    const result = (await system.invoke({ input: 'second' }, config)) as MultiAgentStateType;

    expect(result.workers.researcher).toEqual({
      skills: ['research'],
      tools: ['search'],
      available: false,
      currentWorkload: 4,
    });
  });

  it('resumes with the captured Worker snapshot and initializes the next execution afresh', async () => {
    let currentCapabilities = workerCapabilities(['research'], false, 3);
    const captureWorkerSnapshot = vi.fn(() => currentCapabilities);
    const graph = createInterruptibleGraph(captureWorkerSnapshot, async (state) => {
      const response = interrupt<string, string>('continue?');
      return { response, workers: state.workers };
    });
    const interruptedConfig = { configurable: { thread_id: 'interrupted' } };
    const interrupted = await graph.invoke({ input: 'first' }, interruptedConfig);

    expect(interrupted).toHaveProperty('__interrupt__');
    expect(interrupted.workers.researcher).toMatchObject({
      skills: ['research'],
      available: false,
      currentWorkload: 3,
    });
    expect(captureWorkerSnapshot).toHaveBeenCalledTimes(1);

    currentCapabilities = workerCapabilities(['updated-research'], true, 0);
    const resumed = await graph.invoke(new Command({ resume: 'approved' }), interruptedConfig);

    expect(resumed.workers.researcher).toMatchObject({
      skills: ['research'],
      available: false,
      currentWorkload: 3,
    });
    expect(captureWorkerSnapshot).toHaveBeenCalledTimes(1);

    const later = await graph.invoke({ input: 'later' }, interruptedConfig);

    expect(later.workers.researcher).toMatchObject({
      skills: ['updated-research'],
      available: false,
      currentWorkload: 3,
    });
    expect(captureWorkerSnapshot).toHaveBeenCalledTimes(2);
  });

  it('preserves a failure thrown while resuming an interrupted execution', async () => {
    const cause = new Error('resume cause');
    const failure = new Error('resume failure', { cause });
    const captureWorkerSnapshot = vi.fn(() => workerCapabilities(['research']));
    const graph = createInterruptibleGraph(captureWorkerSnapshot, async () => {
      interrupt('continue?');
      throw failure;
    });
    const config = { configurable: { thread_id: 'resume-failure' } };

    await graph.invoke({ input: 'first' }, config);

    await expect(graph.invoke(new Command({ resume: 'approved' }), config)).rejects.toBe(failure);
    expect(failure.cause).toBe(cause);
    expect(captureWorkerSnapshot).toHaveBeenCalledTimes(1);
  });
});
