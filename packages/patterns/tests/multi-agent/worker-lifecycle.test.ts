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
  });
});

describe('Worker lifecycle snapshot capture', () => {
  it('uses initial status when a prototype-named Worker has no invocation override', () => {
    const lifecycle = admitWorkerTopology([
      worker({
        id: 'toString',
        capabilities: {
          skills: ['prototype-safety'],
          tools: [],
          available: true,
          currentWorkload: 2,
        },
      }),
    ]);

    expect(lifecycle.captureSnapshot({})).toEqual({
      toString: {
        skills: ['prototype-safety'],
        tools: [],
        available: true,
        currentWorkload: 2,
      },
    });
  });

  it('uses invocation-owned status while retaining every admitted Worker', () => {
    const lifecycle = admitWorkerTopology([
      worker(),
      worker({
        id: 'writer',
        capabilities: {
          skills: ['writing'],
          tools: [],
          available: false,
          currentWorkload: 4,
        },
      }),
    ]);

    expect(
      lifecycle.captureSnapshot({
        researcher: {
          skills: ['caller-skill'],
          tools: ['caller-tool'],
          available: false,
          currentWorkload: 7,
        },
      })
    ).toEqual({
      researcher: {
        skills: ['research'],
        tools: [],
        available: false,
        currentWorkload: 7,
      },
      writer: {
        skills: ['writing'],
        tools: [],
        available: false,
        currentWorkload: 4,
      },
    });
  });

  it.each(['intruder', 'toString'])(
    'rejects an override for unknown Worker %j with the lifecycle reason',
    (workerId) => {
      const lifecycle = admitWorkerTopology([worker()]);

      expectLifecycleReason(
        () =>
          lifecycle.captureSnapshot({
            [workerId]: { available: true, currentWorkload: 0 },
          }),
        'unknown-worker'
      );
    }
  );

  it('returns mutable records detached from lifecycle and caller-owned collections', () => {
    const lifecycle = admitWorkerTopology([worker()]);
    const callerSkills = ['caller-skill'];
    const callerTools = ['caller-tool'];
    const override = {
      skills: callerSkills,
      tools: callerTools,
      available: false,
      currentWorkload: 6,
    };

    const snapshot = lifecycle.captureSnapshot({ researcher: override });
    const captured = snapshot.researcher!;

    callerSkills.push('late-caller-skill');
    callerTools.push('late-caller-tool');
    override.available = true;
    override.currentWorkload = 99;
    captured.skills.push('snapshot-skill');
    captured.tools.push('snapshot-tool');
    captured.available = true;
    captured.currentWorkload = 12;

    expect(Object.isFrozen(snapshot)).toBe(false);
    expect(Object.isFrozen(captured)).toBe(false);
    expect(Object.isFrozen(captured.skills)).toBe(false);
    expect(Object.isFrozen(captured.tools)).toBe(false);
    expect(lifecycle.captureSnapshot({ researcher: override })).toEqual({
      researcher: {
        skills: ['research'],
        tools: [],
        available: true,
        currentWorkload: 99,
      },
    });
    expect(lifecycle.topology[0]?.capabilities).toEqual({
      skills: ['research'],
      tools: [],
      available: true,
      currentWorkload: 1,
    });
  });

  it('keeps an earlier snapshot isolated from a later routing-skill publication', () => {
    const lifecycle = admitWorkerTopology([worker()]);
    const earlier = lifecycle.captureSnapshot({});

    lifecycle.updateRoutingSkills([{ id: 'researcher', skills: ['analysis'] }]);

    expect(earlier.researcher?.skills).toEqual(['research']);
    expect(lifecycle.captureSnapshot({}).researcher?.skills).toEqual(['analysis']);
  });
});

describe('Worker lifecycle routing-skill operations', () => {
  it.each(['publishRoutingSkills', 'updateRoutingSkills'] as const)(
    '%s atomically publishes one multi-Worker replacement',
    (operation) => {
      const lifecycle = admitWorkerTopology([
        worker({ tools: [{ name: 'search' }] }),
        worker({
          id: 'writer',
          capabilities: {
            skills: ['writing'],
            tools: [],
            available: false,
            currentWorkload: 4,
          },
        }),
      ]);
      const previousLifecycleSnapshot = lifecycle.captureSnapshot({});
      const researcherSkills = ['analysis'];
      const writerSkills = ['editing'];

      lifecycle[operation]([
        { id: 'researcher', skills: researcherSkills, assertedTools: [{ name: 'search' }] },
        { id: 'writer', skills: writerSkills },
      ]);
      researcherSkills.push('caller-mutation');
      writerSkills.push('caller-mutation');

      const currentLifecycleSnapshot = lifecycle.captureSnapshot({});
      expect(currentLifecycleSnapshot).not.toBe(previousLifecycleSnapshot);
      expect(previousLifecycleSnapshot).toMatchObject({
        researcher: { skills: ['research'] },
        writer: { skills: ['writing'] },
      });
      expect(currentLifecycleSnapshot).toEqual({
        researcher: {
          skills: ['analysis'],
          tools: ['search'],
          available: true,
          currentWorkload: 1,
        },
        writer: {
          skills: ['editing'],
          tools: [],
          available: false,
          currentWorkload: 4,
        },
      });
    }
  );

  it.each(['publishRoutingSkills', 'updateRoutingSkills'] as const)(
    '%s preserves published capabilities when its batch is empty',
    (operation) => {
      const lifecycle = admitWorkerTopology([worker()]);
      const baselineLifecycleSnapshot = lifecycle.captureSnapshot({});

      lifecycle[operation]([]);

      expect(lifecycle.captureSnapshot({})).toEqual(baselineLifecycleSnapshot);
    }
  );

  it('validates every publication identity before detecting duplicates', () => {
    const lifecycle = admitWorkerTopology([worker()]);

    expectLifecycleReason(
      () =>
        lifecycle.publishRoutingSkills([
          { id: 'researcher', skills: [] },
          { id: 'researcher', skills: [] },
          { id: '', skills: [] },
        ]),
      'invalid-identity'
    );
  });

  it.each([
    {
      name: 'duplicate Worker identities',
      updates: [
        { id: 'researcher', skills: [] },
        { id: 'researcher', skills: [] },
      ],
      reason: 'duplicate-identity' as const,
    },
    {
      name: 'an unknown Worker',
      updates: [{ id: 'unknown', skills: [] }],
      reason: 'unknown-worker' as const,
    },
    {
      name: 'a nameless asserted tool',
      updates: [{ id: 'researcher', skills: [], assertedTools: [{}] }],
      reason: 'invalid-tool' as const,
    },
    {
      name: 'duplicate asserted tools',
      updates: [
        {
          id: 'researcher',
          skills: [],
          assertedTools: [{ name: 'search' }, { metadata: { name: ' search ' } }],
        },
      ],
      reason: 'invalid-tool' as const,
    },
    {
      name: 'mismatched asserted tools',
      updates: [{ id: 'researcher', skills: [], assertedTools: [{ name: 'different-tool' }] }],
      reason: 'invalid-tool' as const,
    },
  ])('preserves the lifecycle reason for $name', ({ updates, reason }) => {
    const lifecycle = admitWorkerTopology([worker({ tools: [{ name: 'search' }] })]);

    expectLifecycleReason(() => lifecycle.publishRoutingSkills(updates), reason);
  });

  it('publishes nothing when any update in the batch is invalid', () => {
    const lifecycle = admitWorkerTopology([
      worker(),
      worker({
        id: 'writer',
        capabilities: {
          skills: ['writing'],
          tools: [],
          available: false,
          currentWorkload: 4,
        },
        tools: [{ name: 'write' }],
      }),
    ]);
    const baselineLifecycleSnapshot = lifecycle.captureSnapshot({});

    expectLifecycleReason(
      () =>
        lifecycle.publishRoutingSkills([
          { id: 'researcher', skills: ['must-not-publish'] },
          {
            id: 'writer',
            skills: ['also-must-not-publish'],
            assertedTools: [{ name: 'different-tool' }],
          },
        ]),
      'invalid-tool'
    );

    expect(lifecycle.captureSnapshot({})).toEqual(baselineLifecycleSnapshot);
    expect(lifecycle.captureSnapshot({})).toMatchObject({
      researcher: { skills: ['research'] },
      writer: { skills: ['writing'] },
    });
  });

  it('isolates earlier lifecycle snapshots from later publications', () => {
    const lifecycle = admitWorkerTopology([worker({ tools: [{ name: 'search' }] })]);
    const earlierExecution = lifecycle.captureSnapshot({});

    lifecycle.publishRoutingSkills([{ id: 'researcher', skills: ['analysis'] }]);

    expect(earlierExecution.researcher?.skills).toEqual(['research']);
    expect(lifecycle.captureSnapshot({}).researcher).toEqual({
      skills: ['analysis'],
      tools: ['search'],
      available: true,
      currentWorkload: 1,
    });
    expect(lifecycle.captureSnapshot({}).researcher?.skills).toEqual(['analysis']);
  });
});
