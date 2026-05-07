import { describe, expect, it } from 'vitest';
import {
  arrayFilter,
  arraySort,
  objectOmit,
  objectPick,
} from '../../../src/data/transformer/index.js';
import {
  getNestedValue,
  omitObjectProperties,
  pickObjectProperties,
} from '../../../src/data/transformer/tools/shared.js';

describe('transformer shared helpers', () => {
  it('reads nested values and tolerates missing paths', () => {
    const callable = Object.assign(() => 'ok', {
      profile: { name: 'Function Ada' },
    });

    expect(getNestedValue({ profile: { name: 'Ada' } }, 'profile.name')).toBe('Ada');
    expect(getNestedValue({ profile: null }, 'profile.name')).toBeUndefined();
    expect(getNestedValue('primitive', 'profile.name')).toBeUndefined();
    expect(getNestedValue({ callable }, 'callable.profile.name')).toBe('Function Ada');
  });

  it('projects only the requested object properties', () => {
    expect(
      pickObjectProperties(
        { id: 1, profile: { name: 'Ada' }, active: true },
        ['id', 'profile']
      )
    ).toEqual({ id: 1, profile: { name: 'Ada' } });
  });

  it('omits only the requested object properties', () => {
    expect(
      omitObjectProperties(
        { id: 1, profile: { name: 'Ada' }, active: true },
        ['active']
      )
    ).toEqual({ id: 1, profile: { name: 'Ada' } });
  });
});

describe('transformer tool behavior', () => {
  it('filters arrays using nested values and preserves missing-path behavior', async () => {
    const result = await arrayFilter.invoke({
      array: [
        { id: 1, profile: { role: 'admin' } },
        { id: 2, profile: { role: 'user' } },
        { id: 3 },
      ],
      property: 'profile.role',
      operator: 'equals',
      value: 'admin',
    });

    expect(result.filtered).toEqual([{ id: 1, profile: { role: 'admin' } }]);
    expect(result.originalCount).toBe(3);
    expect(result.filteredCount).toBe(1);
  });

  it('sorts arrays using nested values', async () => {
    const result = await arraySort.invoke({
      array: [
        { id: 1, profile: { score: 30 } },
        { id: 2, profile: { score: 10 } },
        { id: 3, profile: { score: 20 } },
      ],
      property: 'profile.score',
      order: 'asc',
    });

    expect(result.sorted.map((item) => item.id)).toEqual([2, 3, 1]);
    expect(result.count).toBe(3);
  });

  it('picks and omits object properties without changing public behavior', async () => {
    await expect(
      objectPick.invoke({
        object: { id: 1, profile: { name: 'Ada' }, active: true },
        properties: ['id', 'profile'],
      })
    ).resolves.toEqual({ id: 1, profile: { name: 'Ada' } });

    await expect(
      objectOmit.invoke({
        object: { id: 1, profile: { name: 'Ada' }, active: true },
        properties: ['active'],
      })
    ).resolves.toEqual({ id: 1, profile: { name: 'Ada' } });
  });
});
