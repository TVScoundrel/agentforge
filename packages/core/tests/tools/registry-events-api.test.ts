import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { RegistryEvent, ToolCategory, ToolRegistry, toolBuilder } from '../../src/index.js';

describe('ToolRegistry event API', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('emits an event when a tool is registered', () => {
    const handler = vi.fn();
    registry.on(RegistryEvent.TOOL_REGISTERED, handler);

    const tool = toolBuilder()
      .name('event-test')
      .description('A tool for event testing')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();

    registry.register(tool);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(tool);
  });

  it('emits an event when a tool is removed', () => {
    const handler = vi.fn();
    const tool = toolBuilder()
      .name('remove-event-test')
      .description('A tool for removal event testing')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();

    registry.register(tool);
    registry.on(RegistryEvent.TOOL_REMOVED, handler);
    registry.remove('remove-event-test');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(tool);
  });

  it('emits an event when a tool is updated', () => {
    const handler = vi.fn();
    const original = toolBuilder()
      .name('update-event-test')
      .description('Original tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();
    const updatedTool = toolBuilder()
      .name('update-event-test')
      .description('Updated tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input.toUpperCase())
      .build();

    registry.register(original);
    registry.on(RegistryEvent.TOOL_UPDATED, handler);
    registry.update('update-event-test', updatedTool);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ name: 'update-event-test', tool: updatedTool });
  });

  it('emits an event when the registry is cleared', () => {
    const handler = vi.fn();
    registry.on(RegistryEvent.REGISTRY_CLEARED, handler);

    registry.register(
      toolBuilder()
        .name('clear-event-test')
        .description('A tool for clear event testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build()
    );

    registry.clear();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('supports multiple handlers for the same event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    registry.on(RegistryEvent.TOOL_REGISTERED, handler1);
    registry.on(RegistryEvent.TOOL_REGISTERED, handler2);

    registry.register(
      toolBuilder()
        .name('multi-handler-test')
        .description('A tool for multiple handler testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build()
    );

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('removes an event handler', () => {
    const handler = vi.fn();
    registry.on(RegistryEvent.TOOL_REGISTERED, handler);
    registry.off(RegistryEvent.TOOL_REGISTERED, handler);

    registry.register(
      toolBuilder()
        .name('off-test')
        .description('A tool for handler removal testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build()
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw if a handler throws', () => {
    const errorHandler = vi.fn(() => {
      throw new Error('Handler error');
    });
    const goodHandler = vi.fn();

    registry.on(RegistryEvent.TOOL_REGISTERED, errorHandler);
    registry.on(RegistryEvent.TOOL_REGISTERED, goodHandler);

    expect(() =>
      registry.register(
        toolBuilder()
          .name('error-handler-test')
          .description('A tool for error handler testing')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ input: z.string().describe('Input') }))
          .implement(async ({ input }) => input)
          .build()
      )
    ).not.toThrow();

    expect(errorHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });
});
