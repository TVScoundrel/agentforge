import { describe, expect, it } from 'vitest';
import { createMultiAgentSystem, registerWorkers } from '../../src/multi-agent/agent.js';
import type { MultiAgentSystemConfig } from '../../src/multi-agent/types.js';

function createBaseConfig(): MultiAgentSystemConfig {
  return {
    supervisor: {
      strategy: 'round-robin',
    },
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
  };
}

describe('Multi-Agent worker registration', () => {
  it('should create workers registry', () => {
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [{ name: 'tool1' }],
      },
      {
        name: 'worker2',
        capabilities: ['skill2'],
        tools: [{ name: 'tool2' }],
      },
    ]);

    expect(system._workerRegistry).toEqual({
      worker1: {
        skills: ['skill1'],
        tools: ['tool1'],
        available: true,
        currentWorkload: 0,
      },
      worker2: {
        skills: ['skill2'],
        tools: ['tool2'],
        available: true,
        currentWorkload: 0,
      },
    });
  });

  it('should handle empty workers array', () => {
    const system = createMultiAgentSystem(createBaseConfig());
    registerWorkers(system, []);
    expect(system._workerRegistry).toEqual({});
  });

  it('should handle single worker', () => {
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'solo',
        capabilities: ['everything'],
        tools: [{ name: 'all' }],
      },
    ]);

    expect(system._workerRegistry).toEqual({
      solo: {
        skills: ['everything'],
        tools: ['all'],
        available: true,
        currentWorkload: 0,
      },
    });
  });
});
