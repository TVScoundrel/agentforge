import { describe, expect, it } from 'vitest';
import {
  createMultiAgentSystem,
  MultiAgentSystemBuilder,
  WorkerLifecycleError,
} from '../../src/multi-agent/agent.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../src/multi-agent/types.js';

function createSystem() {
  const searchTool = { name: 'search' } as unknown as NonNullable<WorkerConfig['tools']>[number];

  return createMultiAgentSystem({
    supervisor: { strategy: 'round-robin' },
    workers: [
      {
        id: 'researcher',
        capabilities: {
          skills: ['research'],
          tools: ['stale-declaration'],
          available: true,
          currentWorkload: 0,
        },
        tools: [searchTool],
      },
    ],
    maxIterations: 0,
  });
}

function invocationWorkers(available: boolean, currentWorkload: number) {
  return {
    researcher: {
      skills: ['caller-skill'],
      tools: ['caller-tool'],
      available,
      currentWorkload,
    },
  };
}

describe('Multi-Agent Worker execution initialization', () => {
  it('uses topology-owned capabilities and invocation-owned status', async () => {
    const system = createSystem();

    const result = (await system.invoke({
      input: 'test',
      workers: invocationWorkers(false, 7),
    })) as MultiAgentStateType;

    expect(result.workers).toEqual({
      researcher: {
        skills: ['research'],
        tools: ['search'],
        available: false,
        currentWorkload: 7,
      },
    });
  });

  it('rejects unknown invocation Workers with the lifecycle reason', async () => {
    const system = createSystem();

    await expect(
      system.invoke({
        input: 'test',
        workers: {
          intruder: {
            skills: [],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      })
    ).rejects.toMatchObject<Partial<WorkerLifecycleError>>({ reason: 'unknown-worker' });
  });

  it('initializes Worker state through streaming before Supervisor execution', async () => {
    const chunks = [];

    for await (const chunk of await createSystem().stream({
      input: 'test',
      workers: invocationWorkers(false, 3),
    })) {
      chunks.push(chunk);
    }

    expect(chunks[0]).toEqual({
      initializeWorkers: {
        workers: {
          researcher: {
            skills: ['research'],
            tools: ['search'],
            available: false,
            currentWorkload: 3,
          },
        },
      },
    });
    expect(chunks[1]).toHaveProperty('supervisor');
  });

  it('initializes every execution in a batch independently', async () => {
    const results = (await createSystem().batch([
      { input: 'first', workers: invocationWorkers(false, 1) },
      { input: 'second', workers: invocationWorkers(true, 4) },
    ])) as MultiAgentStateType[];

    expect(results.map((result) => result.workers.researcher)).toEqual([
      {
        skills: ['research'],
        tools: ['search'],
        available: false,
        currentWorkload: 1,
      },
      {
        skills: ['research'],
        tools: ['search'],
        available: true,
        currentWorkload: 4,
      },
    ]);
  });

  it('exposes equivalent initialized state through event streaming', async () => {
    const events = [];

    for await (const event of createSystem().streamEvents(
      { input: 'test', workers: invocationWorkers(false, 5) },
      { version: 'v2' }
    )) {
      events.push(event);
    }

    const initializationEnd = events.find(
      (event) => event.event === 'on_chain_end' && event.name === 'initializeWorkers'
    );
    expect(initializationEnd?.data.output).toEqual({
      workers: {
        researcher: {
          skills: ['research'],
          tools: ['search'],
          available: false,
          currentWorkload: 5,
        },
      },
    });
  });

  it('gives builder executions the same initialized Worker state', async () => {
    const builder = new MultiAgentSystemBuilder({
      supervisor: { strategy: 'round-robin' },
      maxIterations: 0,
    }).registerWorkers([
      {
        name: 'researcher',
        capabilities: ['research'],
        tools: [{ name: 'search' }],
      },
    ]);

    const result = (await builder.build().invoke({
      input: 'test',
      workers: invocationWorkers(false, 6),
    })) as MultiAgentStateType;

    expect(result.workers).toEqual({
      researcher: {
        skills: ['research'],
        tools: ['search'],
        available: false,
        currentWorkload: 6,
      },
    });
  });

  it('keeps routing behavior on the initialized compatible Worker record', async () => {
    const system = createMultiAgentSystem({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'researcher',
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
            skills: ['writing'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      ],
      maxIterations: 1,
    });

    const result = (await system.invoke({
      input: 'test',
      workers: {
        researcher: {
          skills: ['caller-skill'],
          tools: ['caller-tool'],
          available: false,
          currentWorkload: 0,
        },
        writer: {
          skills: ['caller-skill'],
          tools: ['caller-tool'],
          available: true,
          currentWorkload: 2,
        },
      },
    })) as MultiAgentStateType;

    expect(result.routingHistory[0]?.targetAgent).toBe('writer');
    expect(result.workers.researcher?.skills).toEqual(['research']);
    expect(result.workers.writer?.skills).toEqual(['writing']);
  });
});
