import { describe, expect, it } from 'vitest';
import { buildWorkerResultContext } from '../../../src/multi-agent/nodes/shared.js';
import { createMockState } from './shared.js';

describe('Multi-Agent Shared Node Helpers', () => {
  it('should limit worker-result context to the most recent completed tasks', () => {
    const state = createMockState();
    state.completedTasks = [
      {
        assignmentId: 'task-1',
        workerId: 'worker1',
        success: true,
        result: 'oldest-result',
        completedAt: Date.now() - 3,
      },
      {
        assignmentId: 'task-2',
        workerId: 'worker2',
        success: true,
        result: 'second-result',
        completedAt: Date.now() - 2,
      },
      {
        assignmentId: 'task-3',
        workerId: 'worker3',
        success: true,
        result: 'third-result',
        completedAt: Date.now() - 1,
      },
      {
        assignmentId: 'task-4',
        workerId: 'worker4',
        success: true,
        result: 'latest-result',
        completedAt: Date.now(),
      },
    ];

    const context = buildWorkerResultContext(state);

    expect(context).toContain('second-result');
    expect(context).toContain('third-result');
    expect(context).toContain('latest-result');
    expect(context).not.toContain('oldest-result');
  });

  it('should truncate long worker-result details to a safe prompt length', () => {
    const state = createMockState();
    const longResult = 'x'.repeat(400);
    state.completedTasks = [
      {
        assignmentId: 'task-long',
        workerId: 'worker1',
        success: true,
        result: longResult,
        completedAt: Date.now(),
      },
    ];

    const context = buildWorkerResultContext(state);

    expect(context).toBeDefined();
    expect(context).toContain('…');
    expect(context).not.toContain(longResult);
    expect(context?.length).toBeLessThan(longResult.length + 120);
  });
});
