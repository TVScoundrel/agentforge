import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import {
  assertStateChanged,
  compareStates,
  createMessageSnapshot,
  createSnapshot,
  createStateDiff,
  ROOT_SNAPSHOT_DIFF_KEY,
} from '../../src/runners/snapshot-testing.js';

describe('snapshot testing runner', () => {
  it('normalizes timestamps, UUIDs, nested objects, and arrays', () => {
    const snapshot = createSnapshot({
      id: '9f5d6b3a-bd1f-4c3e-b1e2-2f6e80de5ed7',
      createdAt: new Date('2026-04-25T10:00:00.000Z'),
      updatedAt: '2026-04-25T10:01:02.000Z',
      nested: {
        values: ['stable', '2026-04-25T10:02:03.000Z'],
      },
    });

    expect(snapshot).toEqual({
      id: '[UUID]',
      createdAt: '[TIMESTAMP]',
      updatedAt: '[TIMESTAMP]',
      nested: {
        values: ['stable', '[TIMESTAMP]'],
      },
    });
  });

  it('honors include and exclude field filters at each object level', () => {
    expect(
      createSnapshot(
        {
          keep: 'yes',
          drop: 'no',
          nested: {
            keep: 'nested yes',
            drop: 'nested no',
          },
        },
        { includeFields: ['keep', 'nested'] }
      )
    ).toEqual({
      keep: 'yes',
      nested: {
        keep: 'nested yes',
      },
    });

    expect(
      createSnapshot(
        {
          keep: 'yes',
          secret: 'no',
          nested: {
            keep: 'nested yes',
            secret: 'nested no',
          },
        },
        { excludeFields: ['secret'] }
      )
    ).toEqual({
      keep: 'yes',
      nested: {
        keep: 'nested yes',
      },
    });
  });

  it('applies a custom unknown-first normalizer before built-in normalization', () => {
    const snapshot = createSnapshot(
      { count: 1, ignored: 'value' },
      {
        normalizer: (value: unknown) => {
          if (typeof value === 'object' && value !== null) {
            return {
              normalized: true,
              id: '9f5d6b3a-bd1f-4c3e-b1e2-2f6e80de5ed7',
              createdAt: '2026-04-25T10:00:00.000Z',
            };
          }

          return value;
        },
      }
    );

    expect(snapshot).toEqual({
      normalized: true,
      id: '[UUID]',
      createdAt: '[TIMESTAMP]',
    });
  });

  it('compares states after configured normalization', () => {
    const first = {
      id: '9f5d6b3a-bd1f-4c3e-b1e2-2f6e80de5ed7',
      createdAt: '2026-04-25T10:00:00.000Z',
      value: 'same',
    };
    const second = {
      id: '1c01e8b1-30f0-4d58-910c-62b2c754c2f2',
      createdAt: '2026-04-25T11:00:00.000Z',
      value: 'same',
    };

    expect(compareStates(first, second)).toBe(true);
    expect(compareStates(first, { ...second, value: 'changed' })).toBe(false);
    expect(compareStates({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(compareStates({ value: 1n }, { value: 1n })).toBe(true);
  });

  it('creates state diffs for added, removed, and changed fields', () => {
    const diff = createStateDiff(
      {
        unchanged: 'same',
        removed: 'old',
        changed: { value: 1 },
      },
      {
        unchanged: 'same',
        added: 'new',
        changed: { value: 2 },
      }
    );

    expect(diff).toEqual({
      added: { added: 'new' },
      removed: { removed: 'old' },
      changed: {
        changed: { from: { value: 1 }, to: { value: 2 } },
      },
    });
    expect(() => assertStateChanged({ step: 1 }, { step: 2 }, ['step'])).not.toThrow();
  });

  it('uses own-property diff checks for prototype-named keys', () => {
    const diff = createStateDiff(
      {},
      {
        constructor: 'stable',
        toString: 'added',
      }
    );

    expect(diff.added).toEqual({
      constructor: 'stable',
      toString: 'added',
    });
    expect(diff.changed).toEqual({});
  });

  it('normalizes objects without allowing prototype pollution keys to mutate output prototypes', () => {
    const input = JSON.parse('{"__proto__":{"polluted":true},"safe":"value"}') as Record<
      string,
      unknown
    >;
    const snapshot = createSnapshot(input) as Record<string, unknown>;

    expect(Object.getPrototypeOf(snapshot)).toBeNull();
    expect(Object.hasOwn(snapshot, '__proto__')).toBe(true);
    expect(snapshot.__proto__).toEqual({ polluted: true });
    expect(snapshot.safe).toBe('value');
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('keeps prototype-sensitive keys as data in diff containers', () => {
    const added = createStateDiff({}, JSON.parse('{"__proto__":"added"}') as Record<
      string,
      unknown
    >);
    const removed = createStateDiff(
      JSON.parse('{"__proto__":"removed"}') as Record<string, unknown>,
      {}
    );
    const changed = createStateDiff(
      JSON.parse('{"__proto__":"before"}') as Record<string, unknown>,
      JSON.parse('{"__proto__":"after"}') as Record<string, unknown>
    );

    expect(Object.getPrototypeOf(added.added)).toBeNull();
    expect(Object.hasOwn(added.added, '__proto__')).toBe(true);
    expect(added.added.__proto__).toBe('added');

    expect(Object.getPrototypeOf(removed.removed)).toBeNull();
    expect(Object.hasOwn(removed.removed, '__proto__')).toBe(true);
    expect(removed.removed.__proto__).toBe('removed');

    expect(Object.getPrototypeOf(changed.changed)).toBeNull();
    expect(Object.hasOwn(changed.changed, '__proto__')).toBe(true);
    expect(changed.changed.__proto__).toEqual({ from: 'before', to: 'after' });
  });

  it('preserves non-plain objects instead of collapsing them to empty snapshots', () => {
    const date = new Date('2026-04-25T10:00:00.000Z');
    const map = new Map([['key', 'value']]);
    const pattern = /stable/;

    expect(createSnapshot(date, { normalizeTimestamps: false })).toBe(date);
    expect(createSnapshot(map)).toBe(map);
    expect(createSnapshot(pattern)).toBe(pattern);
  });

  it('reports root-level diffs for non-plain object snapshots', () => {
    const first = new Map([['key', 'before']]);
    const second = new Map([['key', 'after']]);
    const diff = createStateDiff(first, second);

    expect(diff).toEqual({
      added: {},
      removed: {},
      changed: {
        [ROOT_SNAPSHOT_DIFF_KEY]: { from: first, to: second },
      },
    });
  });

  it('reports root-level changes for non-object snapshot roots', () => {
    expect(createStateDiff('before', 'after')).toEqual({
      added: {},
      removed: {},
      changed: {
        [ROOT_SNAPSHOT_DIFF_KEY]: { from: 'before', to: 'after' },
      },
    });

    expect(createStateDiff(['a'], ['a', 'b'])).toEqual({
      added: {},
      removed: {},
      changed: {
        [ROOT_SNAPSHOT_DIFF_KEY]: { from: ['a'], to: ['a', 'b'] },
      },
    });

    expect(createStateDiff(null, undefined)).toEqual({
      added: {},
      removed: {},
      changed: {
        [ROOT_SNAPSHOT_DIFF_KEY]: { from: null, to: undefined },
      },
    });
  });

  it('creates stable message snapshots from LangChain messages', () => {
    const snapshot = createMessageSnapshot([
      new HumanMessage('hello'),
      new AIMessage([{ type: 'text', text: 'hi' }]),
    ]);

    expect(snapshot).toEqual([
      { type: 'human', content: 'hello' },
      { type: 'ai', content: [{ type: 'text', text: 'hi' }] },
    ]);
  });

  it('normalizes message snapshot content with configured snapshot options', () => {
    const snapshot = createMessageSnapshot(
      [
        new HumanMessage('normalize-me'),
        new AIMessage([
          {
            type: 'text',
            text: '2026-04-25T10:00:00.000Z',
          },
        ]),
      ],
      {
        excludeFields: ['type'],
        normalizer: (value: unknown) => {
          if (value === 'normalize-me') {
            return '9f5d6b3a-bd1f-4c3e-b1e2-2f6e80de5ed7';
          }

          return value;
        },
      }
    );

    expect(snapshot).toEqual([
      {
        type: 'human',
        content: '[UUID]',
      },
      {
        type: 'ai',
        content: [
          {
            text: '[TIMESTAMP]',
          },
        ],
      },
    ]);
  });
});
