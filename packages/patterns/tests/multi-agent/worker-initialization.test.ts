import { describe, expect, it } from 'vitest';
import type { WorkerCapabilities } from '../../src/multi-agent/schemas.js';
import { initializeWorkerState } from '../../src/multi-agent/worker-initialization.js';

describe('Worker state initialization', () => {
  it('uses initial status when a prototype-named Worker has no invocation override', () => {
    const worker: WorkerCapabilities = {
      skills: ['prototype-safety'],
      tools: [],
      available: true,
      currentWorkload: 2,
    };
    const topology = Object.fromEntries([['toString', worker]]);

    expect(initializeWorkerState(topology, {})).toEqual({
      toString: {
        skills: ['prototype-safety'],
        tools: [],
        available: true,
        currentWorkload: 2,
      },
    });
  });
});
