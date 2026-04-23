import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { toolBuilder } from '../../src/tools/builder.js';
import {
  clearRegistryTools,
  registerManyRegistryTools,
  registerRegistryTool,
  removeRegistryTool,
  updateRegistryTool,
  type RegistryMutationEvents,
} from '../../src/tools/registry-mutations.js';
import type { RegistryTool } from '../../src/tools/registry-collection.js';
import { ToolCategory } from '../../src/tools/types.js';

const events = {
  registered: 'registered',
  removed: 'removed',
  updated: 'updated',
  cleared: 'cleared',
} as const satisfies RegistryMutationEvents<string>;

function createTool(name: string, description = `Tool ${name}`) {
  return toolBuilder()
    .name(name)
    .description(description)
    .category(ToolCategory.UTILITY)
    .schema(z.object({ input: z.string().describe('Input') }))
    .implement(async ({ input }) => input)
    .build();
}

describe('registry-mutations', () => {
  it('registers a tool and emits the registered event', () => {
    const tools = new Map<string, RegistryTool>();
    const emit = vi.fn();
    const tool = createTool('registered-tool');

    registerRegistryTool(tools, tool, emit, events);

    expect(tools.get('registered-tool')).toBe(tool);
    expect(emit).toHaveBeenCalledWith(events.registered, tool);
  });

  it('rejects duplicate registration with the existing public error message', () => {
    const tools = new Map<string, RegistryTool>();
    const emit = vi.fn();
    const tool = createTool('duplicate-tool');

    registerRegistryTool(tools, tool, emit, events);

    expect(() => registerRegistryTool(tools, tool, emit, events)).toThrow(
      'Tool with name "duplicate-tool" is already registered. Use update() to modify it.'
    );
  });

  it('removes existing tools and emits the removed event', () => {
    const tool = createTool('remove-me');
    const tools = new Map<string, RegistryTool>([['remove-me', tool]]);
    const emit = vi.fn();

    const removed = removeRegistryTool(tools, 'remove-me', emit, events);

    expect(removed).toBe(true);
    expect(tools.has('remove-me')).toBe(false);
    expect(emit).toHaveBeenCalledWith(events.removed, tool);
  });

  it('updates existing tools, preserving the name-consistency check and update payload', () => {
    const originalTool = createTool('update-me', 'Original tool description');
    const updatedTool = createTool('update-me', 'Updated tool description');
    const tools = new Map<string, RegistryTool>([['update-me', originalTool]]);
    const emit = vi.fn();

    const updated = updateRegistryTool(tools, 'update-me', updatedTool, emit, events);

    expect(updated).toBe(true);
    expect(tools.get('update-me')).toBe(updatedTool);
    expect(emit).toHaveBeenCalledWith(events.updated, { name: 'update-me', tool: updatedTool });
  });

  it('rejects updates that would desync the registry key and tool name', () => {
    const tools = new Map<string, RegistryTool>([['original-name', createTool('original-name')]]);
    const emit = vi.fn();

    expect(() =>
      updateRegistryTool(tools, 'original-name', createTool('renamed-tool'), emit, events)
    ).toThrow(
      'Cannot update tool: metadata.name "renamed-tool" does not match registry key "original-name". To rename a tool, remove it and register it again with the new name.'
    );
  });

  it('registers many tools atomically after duplicate and conflict checks', () => {
    const tools = new Map<string, RegistryTool>();
    const emit = vi.fn();
    const pendingTools = [createTool('tool-1'), createTool('tool-2')];

    registerManyRegistryTools(tools, pendingTools, emit, events);

    expect(Array.from(tools.keys())).toEqual(['tool-1', 'tool-2']);
    expect(emit).toHaveBeenNthCalledWith(1, events.registered, pendingTools[0]);
    expect(emit).toHaveBeenNthCalledWith(2, events.registered, pendingTools[1]);
  });

  it('rejects duplicate names inside bulk registration input without partial writes', () => {
    const tools = new Map<string, RegistryTool>();
    const emit = vi.fn();

    expect(() =>
      registerManyRegistryTools(
        tools,
        [createTool('duplicate-name'), createTool('duplicate-name')],
        emit,
        events
      )
    ).toThrow('Cannot register tools: duplicate names in input list: duplicate-name');

    expect(tools.size).toBe(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it('rejects existing-name conflicts during bulk registration without partial writes', () => {
    const tools = new Map<string, RegistryTool>([['existing', createTool('existing')]]);
    const emit = vi.fn();

    expect(() =>
      registerManyRegistryTools(tools, [createTool('new-tool'), createTool('existing')], emit, events)
    ).toThrow('Cannot register tools: the following names already exist: existing');

    expect(tools.has('new-tool')).toBe(false);
    expect(emit).not.toHaveBeenCalled();
  });

  it('clears all tools and emits the cleared event', () => {
    const tools = new Map<string, RegistryTool>([
      ['tool-1', createTool('tool-1')],
      ['tool-2', createTool('tool-2')],
    ]);
    const emit = vi.fn();

    clearRegistryTools(tools, emit, events);

    expect(tools.size).toBe(0);
    expect(emit).toHaveBeenCalledWith(events.cleared, null);
  });
});
