import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { CompiledStateGraph } from '@langchain/langgraph';
import { describe, expect, it } from 'vitest';
import {
  WorkerLifecycleError,
  admitWorkerTopology,
} from '../../src/multi-agent/worker-lifecycle.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../src/multi-agent/types.js';

function worker(overrides: Partial<WorkerConfig> = {}): WorkerConfig {
  return {
    id: 'researcher',
    capabilities: {
      skills: ['research'],
      tools: ['stale-declaration'],
      available: true,
      currentWorkload: 1,
    },
    ...overrides,
  };
}

function expectLifecycleReason(action: () => unknown, reason: WorkerLifecycleError['reason']) {
  let thrown: unknown;
  try {
    action();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(WorkerLifecycleError);
  expect(thrown).toMatchObject({ reason });
}

describe('Worker lifecycle admission', () => {
  it('rejects an empty Worker topology', () => {
    expectLifecycleReason(() => admitWorkerTopology([]), 'empty-topology');
  });

  it.each(['', '  ', ' padded', 'padded ', 'worker,other'])(
    'rejects the invalid Worker identity %j',
    (id) => {
      expectLifecycleReason(() => admitWorkerTopology([worker({ id })]), 'invalid-identity');
    }
  );

  it('validates every identity before detecting duplicates', () => {
    expectLifecycleReason(
      () =>
        admitWorkerTopology([
          worker({ id: 'duplicate' }),
          worker({ id: 'duplicate' }),
          worker({ id: '' }),
        ]),
      'invalid-identity'
    );
  });

  it('rejects duplicate Worker identities after identity validation', () => {
    expectLifecycleReason(
      () => admitWorkerTopology([worker({ id: 'duplicate' }), worker({ id: 'duplicate' })]),
      'duplicate-identity'
    );
  });

  it.each([
    [[{}]],
    [[{ name: '' }]],
    [[{ name: '   ' }]],
    [[{ name: 'search' }, { metadata: { name: ' search ' } }]],
  ])('rejects nameless and duplicate normalized tools', (tools) => {
    expectLifecycleReason(
      () => admitWorkerTopology([worker({ tools: tools as WorkerConfig['tools'] })]),
      'invalid-tool'
    );
  });

  it('creates a canonical immutable snapshot while retaining opaque dependency identity', () => {
    const model = {} as BaseChatModel;
    const tool = { metadata: { name: ' search ' } } as unknown as NonNullable<
      WorkerConfig['tools']
    >[number];
    const executeFn = async (): Promise<Partial<MultiAgentStateType>> => ({ status: 'completed' });
    const agent = {} as CompiledStateGraph<unknown, unknown>;
    const skills = ['research'];
    const tools = [tool];
    const capabilities = {
      skills,
      tools: ['caller-declaration'],
      available: true,
      currentWorkload: 2,
    };
    const configuredWorker = worker({ capabilities, model, tools, executeFn, agent });
    const workers = [configuredWorker];

    const lifecycle = admitWorkerTopology(workers);
    const admitted = lifecycle.topology[0]!;

    workers.push(worker({ id: 'late-worker' }));
    skills.push('late-skill');
    tools.push({ name: 'late-tool' } as unknown as NonNullable<WorkerConfig['tools']>[number]);
    capabilities.available = false;
    capabilities.currentWorkload = 99;

    expect(lifecycle.topology).toHaveLength(1);
    expect(admitted.capabilities).toEqual({
      skills: ['research'],
      tools: ['search'],
      available: true,
      currentWorkload: 2,
    });
    expect(admitted.tools).toEqual([tool]);
    expect(admitted.model).toBe(model);
    expect(admitted.tools?.[0]).toBe(tool);
    expect(admitted.executeFn).toBe(executeFn);
    expect(admitted.agent).toBe(agent);
    expect(Object.isFrozen(lifecycle.topology)).toBe(true);
    expect(Object.isFrozen(admitted)).toBe(true);
    expect(Object.isFrozen(admitted.capabilities)).toBe(true);
    expect(Object.isFrozen(admitted.capabilities.skills)).toBe(true);
    expect(Object.isFrozen(admitted.capabilities.tools)).toBe(true);
    expect(Object.isFrozen(admitted.tools)).toBe(true);
    expect(lifecycle.captureWorkerSnapshot()).toEqual({
      researcher: admitted.capabilities,
    });
    expect(Object.isFrozen(lifecycle.captureWorkerSnapshot())).toBe(true);
  });
});
