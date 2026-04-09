import { describe, expect, it, vi } from 'vitest';
import {
  addRegistryEventHandler,
  emitRegistryEvent,
  removeRegistryEventHandler,
  type RegistryEventHandler,
} from '../../src/tools/registry-events.js';

describe('registry-events helpers', () => {
  it('registers, emits, and removes handlers', () => {
    const handlers = new Map<string, Set<RegistryEventHandler>>();
    const handler = vi.fn();

    addRegistryEventHandler(handlers, 'tool:registered', handler);
    emitRegistryEvent(handlers, 'tool:registered', { name: 'test-tool' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ name: 'test-tool' });

    removeRegistryEventHandler(handlers, 'tool:registered', handler);
    emitRegistryEvent(handlers, 'tool:registered', { name: 'test-tool-2' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('continues emitting when one handler throws', () => {
    const handlers = new Map<string, Set<RegistryEventHandler>>();
    const badHandler = vi.fn(() => {
      throw new Error('Handler error');
    });
    const goodHandler = vi.fn();

    addRegistryEventHandler(handlers, 'tool:registered', badHandler);
    addRegistryEventHandler(handlers, 'tool:registered', goodHandler);

    expect(() => {
      emitRegistryEvent(handlers, 'tool:registered', { name: 'safe-tool' });
    }).not.toThrow();

    expect(badHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });
});
