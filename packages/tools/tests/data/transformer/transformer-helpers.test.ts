import { describe, expect, it } from 'vitest';
import {
  arrayFilter,
  arrayGroupBy,
  arrayMap,
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
    expect(getNestedValue('foo', 'length')).toBe(3);
    expect(getNestedValue('primitive', 'profile.name')).toBeUndefined();
    expect(getNestedValue({ callable }, 'callable.profile.name')).toBe('Function Ada');
  });

  it('projects only the requested object properties', () => {
    const source = {
      id: 1,
      profile: { name: 'Ada' },
      active: true,
    };

    Object.defineProperty(source, '__proto__', {
      value: 'safe',
      enumerable: true,
      configurable: true,
      writable: true,
    });

    const picked = pickObjectProperties(
      source,
      ['id', 'profile', '__proto__']
    );

    expect(picked.id).toBe(1);
    expect(picked.profile).toEqual({ name: 'Ada' });
    expect(Object.getPrototypeOf(picked)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(picked, '__proto__')?.value).toBe('safe');
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

  it('maps arrays using nested values and preserves unknown-first behavior', async () => {
    const result = await arrayMap.invoke({
      array: [
        { id: 1, profile: { name: 'Ada' } },
        { id: 2, profile: { name: 'Grace' } },
      ],
      properties: ['id', 'profile.name'],
    });

    expect(result.mapped).toEqual([
      { id: 1, 'profile.name': 'Ada' },
      { id: 2, 'profile.name': 'Grace' },
    ]);
    expect(result.count).toBe(2);
  });

  it('maps arrays safely when property names include special keys', async () => {
    const result = await arrayMap.invoke({
      array: [{ id: 1 }],
      properties: ['__proto__'],
    });

    expect(Object.getPrototypeOf(result.mapped[0])).toBeNull();
    expect(
      Object.getOwnPropertyDescriptor(result.mapped[0], '__proto__')
    ).toBeDefined();
  });

  it('groups arrays by property value without changing public behavior', async () => {
    const result = await arrayGroupBy.invoke({
      array: [
        { team: 'a', id: 1 },
        { team: 'b', id: 2 },
        { team: 'a', id: 3 },
      ],
      property: 'team',
    });

    expect(result.groups).toEqual({
      a: [
        { team: 'a', id: 1 },
        { team: 'a', id: 3 },
      ],
      b: [{ team: 'b', id: 2 }],
    });
    expect(result.groupCount).toBe(2);
    expect(result.totalItems).toBe(3);
    expect(Object.getPrototypeOf(result.groups)).toBeNull();
  });

  it('groups arrays safely for special keys and preserves nullish failure semantics', async () => {
    const result = await arrayGroupBy.invoke({
      array: [{ team: '__proto__', id: 1 }],
      property: 'team',
    });

    expect(Object.getPrototypeOf(result.groups)).toBeNull();
    expect(result.groups.__proto__).toEqual([{ team: '__proto__', id: 1 }]);

    await expect(
      arrayGroupBy.invoke({
        array: [null],
        property: 'team',
      })
    ).rejects.toThrow("Cannot read properties of null");
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
