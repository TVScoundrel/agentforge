import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import {
  assertStateChanged,
  compareStates,
  createMessageSnapshot,
  createSnapshot,
  createStateDiff,
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
      { count: 1 },
      {
        normalizer: (value: unknown) => {
          if (typeof value === 'object' && value !== null) {
            return { normalized: true };
          }

          return value;
        },
      }
    );

    expect(snapshot).toEqual({ normalized: true });
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
});
