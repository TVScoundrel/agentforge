import { describe, expect, it } from 'vitest';
import { createMockTool, createToolSimulator } from '../../src/tools/testing.js';

describe('tool testing helpers', () => {
  it('matches predicate responses and falls back to the default response', async () => {
    const tool = createMockTool<'search', { query: string }, { matches: string[] }>({
      name: 'search',
      responses: [
        {
          input: (input) => input.query.startsWith('prefix:'),
          output: { matches: ['prefix'] },
        },
      ],
      defaultResponse: { matches: [] },
    });

    await expect(tool.invoke({ query: 'prefix:alpha' })).resolves.toEqual({ matches: ['prefix'] });
    await expect(tool.invoke({ query: 'other' })).resolves.toEqual({ matches: [] });
  });

  it('records configured errors in mock invocations', async () => {
    const error = new Error('boom');
    const tool = createMockTool<'failing', { id: number }, { ok: boolean }>({
      name: 'failing',
      responses: [{ input: { id: 1 }, error }],
    });

    await expect(tool.invoke({ id: 1 })).rejects.toThrow('boom');

    expect(tool.getInvocations()).toHaveLength(1);
    expect(tool.getInvocations()[0]?.error).toBe(error);
    expect(tool.getInvocations()[0]?.timestamp).toBeTypeOf('number');
    expect(tool.getInvocations()[0]?.duration).toBeGreaterThanOrEqual(0);
  });

  it('reports missing simulator tools and clears recorded invocations', async () => {
    const searchTool = createMockTool<'search', { query: string }, { matches: string[] }>({
      name: 'search',
      defaultResponse: { matches: [] },
    });
    const statusTool = createMockTool<'status', { id: number }, { ok: boolean }>({
      name: 'status',
      defaultResponse: { ok: true },
    });

    const simulator = createToolSimulator({
      tools: [searchTool, statusTool] as const,
    });

    await simulator.execute('search', { query: 'alpha' });
    await simulator.execute('status', { id: 1 });

    expect(simulator.getInvocations('search')).toHaveLength(1);
    expect(simulator.getInvocations('status')).toHaveLength(1);

    simulator.clearInvocations('search');
    expect(simulator.getInvocations('search')).toHaveLength(0);
    expect(simulator.getInvocations('status')).toHaveLength(1);

    simulator.clearInvocations();
    expect(simulator.getInvocations('status')).toHaveLength(0);

    await expect(
      simulator.execute('missing' as 'search', { query: 'alpha' })
    ).rejects.toThrow('Tool missing not found in simulator');
  });
});
