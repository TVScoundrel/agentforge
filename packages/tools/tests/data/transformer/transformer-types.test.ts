import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  arrayFilterSchema,
  arrayGroupBySchema,
  arrayMapSchema,
  arraySortSchema,
  objectOmitSchema,
  objectPickSchema,
} from '../../../src/data/transformer/types.js';

describe('transformer schemas', () => {
  it('accept primitive and object values without relying on ZodAny boundaries', () => {
    expect(arrayFilterSchema.parse({
      array: [1, { score: 2 }, 'three'],
      property: 'score',
      operator: 'greater-than',
      value: 1,
    })).toMatchObject({
      array: [1, { score: 2 }, 'three'],
      value: 1,
    });

    expect(arrayMapSchema.parse({
      array: [{ id: 1 }, { id: 2 }],
      properties: ['id'],
    }).array).toEqual([{ id: 1 }, { id: 2 }]);

    expect(arraySortSchema.parse({
      array: ['beta', 'alpha'],
      property: 'length',
      order: 'asc',
    }).array).toEqual(['beta', 'alpha']);

    expect(arrayGroupBySchema.parse({
      array: [{ team: 'a' }, { team: 'b' }],
      property: 'team',
    }).array).toEqual([{ team: 'a' }, { team: 'b' }]);

    expect(objectPickSchema.parse({
      object: { id: 1, active: true, meta: { score: 2 } },
      properties: ['id', 'meta'],
    }).object).toEqual({ id: 1, active: true, meta: { score: 2 } });

    expect(objectOmitSchema.parse({
      object: { id: 1, active: true, meta: { score: 2 } },
      properties: ['active'],
    }).object).toEqual({ id: 1, active: true, meta: { score: 2 } });

    expect(arrayFilterSchema.shape.array.element).toBeInstanceOf(z.ZodUnknown);
    expect(arrayFilterSchema.shape.value).toBeInstanceOf(z.ZodUnknown);
    expect(arrayMapSchema.shape.array.element).toBeInstanceOf(z.ZodUnknown);
    expect(arraySortSchema.shape.array.element).toBeInstanceOf(z.ZodUnknown);
    expect(arrayGroupBySchema.shape.array.element).toBeInstanceOf(z.ZodUnknown);
    expect(objectPickSchema.shape.object._def.valueType).toBeInstanceOf(z.ZodUnknown);
    expect(objectOmitSchema.shape.object._def.valueType).toBeInstanceOf(z.ZodUnknown);
  });
});
