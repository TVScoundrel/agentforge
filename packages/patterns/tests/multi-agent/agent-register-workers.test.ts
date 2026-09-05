import { StateGraph } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';
import {
  createMultiAgentSystem,
  registerWorkers,
  WorkerLifecycleError,
} from '../../src/multi-agent/agent.js';
import type { MultiAgentSystemWithRegistry } from '../../src/multi-agent/agent-types.js';
import { MultiAgentState } from '../../src/multi-agent/state.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { MultiAgentSystemConfig } from '../../src/multi-agent/types.js';

const mockedLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../src/shared/deduplication.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/shared/deduplication.js')>()),
  createPatternLogger: () => mockedLogger,
}));

function createBaseConfig(): MultiAgentSystemConfig {
  return {
    supervisor: { strategy: 'round-robin' },
    workers: [
      {
        id: 'initial',
        capabilities: {
          skills: ['initial'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
      },
    ],
    maxIterations: 0,
  };
}

async function workerState(system: MultiAgentSystemWithRegistry) {
  const result = (await system.invoke({ input: 'test' })) as MultiAgentStateType;
  return result.workers;
}

describe('Multi-Agent worker registration', () => {
  it('updates routing skills for a known Worker in subsequent executions', async () => {
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [{ name: 'initial', capabilities: ['updated'] }]);

    expect(await workerState(system)).toEqual({
      initial: {
        skills: ['updated'],
        tools: [],
        available: true,
        currentWorkload: 0,
      },
    });
  });

  it('publishes a complete multi-Worker batch while preserving Worker status and input ownership', async () => {
    const baseConfig = createBaseConfig();
    const system = createMultiAgentSystem({
      ...baseConfig,
      workers: [
        {
          ...baseConfig.workers[0]!,
          capabilities: {
            ...baseConfig.workers[0]!.capabilities,
            available: false,
            currentWorkload: 2,
          },
        },
        {
          id: 'writer',
          capabilities: {
            skills: ['writing'],
            tools: [],
            available: true,
            currentWorkload: 5,
          },
        },
      ],
    });
    const initialSkills = ['updated-initial'];
    const writerSkills = ['editing'];

    registerWorkers(system, [
      { name: 'initial', capabilities: initialSkills },
      { name: 'writer', capabilities: writerSkills },
    ]);
    initialSkills.push('caller-mutation');
    writerSkills.push('caller-mutation');

    expect(await workerState(system)).toEqual({
      initial: {
        skills: ['updated-initial'],
        tools: [],
        available: false,
        currentWorkload: 2,
      },
      writer: {
        skills: ['editing'],
        tools: [],
        available: true,
        currentWorkload: 5,
      },
    });
  });

  it('uses updated routing skills for subsequent routing decisions', async () => {
    const system = createMultiAgentSystem({
      supervisor: { strategy: 'skill-based' },
      workers: [
        {
          id: 'initial',
          capabilities: {
            skills: ['research'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
        {
          id: 'writer',
          capabilities: {
            skills: ['write'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      ],
      maxIterations: 1,
    });

    registerWorkers(system, [{ name: 'initial', capabilities: ['write'] }]);
    const result = (await system.invoke({ input: 'write the report' })) as MultiAgentStateType;

    expect(result.routingHistory[0]?.targetAgent).toBe('initial');
  });

  it('isolates an in-flight execution from updates that become visible to the next execution', async () => {
    let markWorkerStarted!: () => void;
    let releaseWorker!: () => void;
    const workerStarted = new Promise<void>((resolve) => {
      markWorkerStarted = resolve;
    });
    const workerReleased = new Promise<void>((resolve) => {
      releaseWorker = resolve;
    });
    const observedSkills: string[][] = [];
    const system = createMultiAgentSystem({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'initial',
          capabilities: {
            skills: ['initial'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
          executeFn: async (state) => {
            markWorkerStarted();
            await workerReleased;
            observedSkills.push([...state.workers.initial!.skills]);
            return { status: 'completed' };
          },
        },
      ],
      maxIterations: 1,
    });

    const inFlight = system.invoke({ input: 'first' });
    await workerStarted;
    registerWorkers(system, [{ name: 'initial', capabilities: ['updated'] }]);
    releaseWorker();
    await inFlight;

    expect(observedSkills).toEqual([['initial']]);
    expect((await workerState(system)).initial?.skills).toEqual(['updated']);
    expect(observedSkills).toEqual([['initial'], ['updated']]);
  });

  it('accepts an empty compatibility update without changing Worker state', async () => {
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, []);

    expect((await workerState(system)).initial?.skills).toEqual(['initial']);
  });

  it('rejects registration for an unknown Worker', () => {
    const system = createMultiAgentSystem(createBaseConfig());

    expect(() =>
      registerWorkers(system, [{ name: 'unknown', capabilities: ['impossible'] }])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'unknown-worker' })
    );
  });

  it('rejects a compiled graph without an associated Worker lifecycle', () => {
    const workflow = new StateGraph(MultiAgentState);
    const system = workflow.compile() as unknown as MultiAgentSystemWithRegistry;

    expect(() =>
      registerWorkers(system, [{ name: 'initial', capabilities: ['updated'] }])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'unsupported-system' })
    );
  });

  it('does not replace compiled graph execution methods', () => {
    const system = createMultiAgentSystem(createBaseConfig());
    const invoke = system.invoke;
    const stream = system.stream;

    registerWorkers(system, [{ name: 'initial', capabilities: ['updated'] }]);

    expect(system.invoke).toBe(invoke);
    expect(system.stream).toBe(stream);
  });

  it('applies a registration batch atomically', async () => {
    const baseConfig = createBaseConfig();
    const system = createMultiAgentSystem({
      ...baseConfig,
      workers: [
        ...baseConfig.workers,
        {
          id: 'writer',
          capabilities: {
            skills: ['writing'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
          tools: [{ name: 'compiled-tool' }],
        },
      ],
    });

    expect(() =>
      registerWorkers(system, [
        { name: 'initial', capabilities: ['must-not-publish'] },
        {
          name: 'writer',
          capabilities: ['also-must-not-publish'],
          tools: [{ name: 'different-tool' }],
        },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );

    expect(await workerState(system)).toMatchObject({
      initial: { skills: ['initial'] },
      writer: { skills: ['writing'] },
    });
  });

  it('emits one deprecation warning per Multi-Agent System', () => {
    mockedLogger.warn.mockClear();
    const first = createMultiAgentSystem(createBaseConfig());
    const second = createMultiAgentSystem(createBaseConfig());

    registerWorkers(first, []);
    registerWorkers(first, []);
    registerWorkers(second, []);

    expect(mockedLogger.warn).toHaveBeenCalledTimes(2);
  });
});
