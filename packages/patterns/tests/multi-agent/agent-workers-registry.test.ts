import { describe, expect, it } from 'vitest';
import {
  createMultiAgentSystem,
  createWorkersRegistry,
  WorkerLifecycleError,
} from '../../src/index.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../src/multi-agent/types.js';

describe('Worker capability registry construction', () => {
  it('matches factory admission normalization', async () => {
    const registry = createWorkersRegistry([
      {
        id: 'researcher',
        capabilities: {
          skills: ['research'],
          tools: [' search '],
          available: true,
          currentWorkload: 2,
        },
      },
    ]);
    const executableTool = { name: ' search ' } as unknown as NonNullable<
      WorkerConfig['tools']
    >[number];
    const system = createMultiAgentSystem({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'researcher',
          capabilities: {
            skills: ['research'],
            tools: ['ignored-declaration'],
            available: true,
            currentWorkload: 2,
          },
          tools: [executableTool],
        },
      ],
    });

    const state = (await system.invoke({ input: 'test' })) as MultiAgentStateType;

    expect(registry).toEqual(state.workers);
  });

  it.each([
    {
      name: 'invalid Worker identities',
      workers: [
        {
          id: ' padded',
          capabilities: {
            skills: [],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      ],
      reason: 'invalid-identity',
    },
    {
      name: 'duplicate Worker identities',
      workers: [
        {
          id: 'duplicate',
          capabilities: {
            skills: [],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
        {
          id: 'duplicate',
          capabilities: {
            skills: [],
            tools: [],
            available: false,
            currentWorkload: 1,
          },
        },
      ],
      reason: 'duplicate-identity',
    },
    {
      name: 'nameless tools',
      workers: [
        {
          id: 'worker',
          capabilities: {
            skills: [],
            tools: ['   '],
            available: true,
            currentWorkload: 0,
          },
        },
      ],
      reason: 'invalid-tool',
    },
    {
      name: 'duplicate normalized tool names',
      workers: [
        {
          id: 'worker',
          capabilities: {
            skills: [],
            tools: ['search', ' search '],
            available: true,
            currentWorkload: 0,
          },
        },
      ],
      reason: 'invalid-tool',
    },
  ] as const)('rejects $name with the lifecycle reason', ({ workers, reason }) => {
    expect(() => createWorkersRegistry(workers)).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason })
    );
  });

  it('returns an immutable snapshot detached from caller-owned capability data', () => {
    const skills = ['research'];
    const tools = [' search '];
    const capabilities = {
      skills,
      tools,
      available: true,
      currentWorkload: 2,
    };

    const registry = createWorkersRegistry([{ id: 'researcher', capabilities }]);

    skills.push('late-skill');
    tools.push('late-tool');
    capabilities.available = false;
    capabilities.currentWorkload = 99;

    expect(registry).toEqual({
      researcher: {
        skills: ['research'],
        tools: ['search'],
        available: true,
        currentWorkload: 2,
      },
    });
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.researcher)).toBe(true);
    expect(Object.isFrozen(registry.researcher?.skills)).toBe(true);
    expect(Object.isFrozen(registry.researcher?.tools)).toBe(true);
  });

  it('accepts empty input without creating a Multi-Agent System', () => {
    expect(createWorkersRegistry([])).toEqual({});
  });

  it('returns records detached from compiled Worker lifecycle state', async () => {
    const sharedSkills = ['research'];
    const sharedCapabilities = {
      skills: sharedSkills,
      tools: [' search '],
      available: true,
      currentWorkload: 0,
    };
    const system = createMultiAgentSystem({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'researcher',
          capabilities: sharedCapabilities,
          tools: [
            { name: ' search ' } as unknown as NonNullable<WorkerConfig['tools']>[number],
          ],
        },
      ],
    });

    const registry = createWorkersRegistry([{ id: 'researcher', capabilities: sharedCapabilities }]);

    const state = (await system.invoke({ input: 'test' })) as MultiAgentStateType;

    expect(registry.researcher).toEqual({
      skills: ['research'],
      tools: ['search'],
      available: true,
      currentWorkload: 0,
    });
    expect(registry.researcher).toEqual(state.workers.researcher);
    expect(registry.researcher).not.toBe(state.workers.researcher);
    expect(registry.researcher?.skills).not.toBe(state.workers.researcher?.skills);
    expect(registry.researcher?.tools).not.toBe(state.workers.researcher?.tools);
  });
});
