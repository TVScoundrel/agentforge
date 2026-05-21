import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createJsonMergeTool } from '../../../src/data/json/tools/json-merge.js';
import { createJsonQueryTool } from '../../../src/data/json/tools/json-query.js';
import {
  jsonMergeSchema,
  jsonQuerySchema,
  jsonStringifySchema,
} from '../../../src/data/json/types.js';

describe('json schemas', () => {
  it('remove broad any payload seams while preserving valid inputs', () => {
    expect(jsonStringifySchema.parse({
      data: { id: 1, nested: { active: true }, tags: ['a'] },
      pretty: true,
      indent: 2,
    })).toMatchObject({
      data: { id: 1, nested: { active: true }, tags: ['a'] },
      pretty: true,
      indent: 2,
    });

    expect(jsonQuerySchema.parse({
      data: { user: { name: 'Ada', roles: ['admin'] } },
      path: 'user.name',
    }).data).toEqual({ user: { name: 'Ada', roles: ['admin'] } });

    expect(jsonMergeSchema.parse({
      objects: [
        { id: 1, nested: { enabled: true } },
        { status: 'ok' },
      ],
      deep: true,
    }).objects).toEqual([
      { id: 1, nested: { enabled: true } },
      { status: 'ok' },
    ]);

    expect(jsonStringifySchema.shape.data).toBeInstanceOf(z.ZodUnknown);
    expect(jsonQuerySchema.shape.data).toBeInstanceOf(z.ZodUnknown);
    expect(jsonMergeSchema.shape.objects.element).toBeInstanceOf(z.ZodRecord);

    expect(() =>
      jsonMergeSchema.parse({
        objects: [{ id: 1 }, null],
      })
    ).toThrow();
  });

  it('preserve json query and deep merge behavior after unknown-first hardening', async () => {
    const jsonQueryTool = createJsonQueryTool();
    const jsonMergeTool = createJsonMergeTool();

    await expect(jsonQueryTool.invoke({
      data: {
        user: {
          profile: {
            roles: [{ name: 'admin' }],
          },
        },
      },
      path: 'user.profile.roles[0].name',
    })).resolves.toMatchObject({
      success: true,
      data: {
        value: 'admin',
        type: 'string',
      },
    });

    await expect(jsonQueryTool.invoke({
      data: { user: { name: 'Ada' } },
      path: 'user.missing',
    })).resolves.toMatchObject({
      success: false,
      error: 'Path not found: user.missing',
    });

    await expect(jsonMergeTool.invoke({
      objects: [
        { user: { name: 'Ada', flags: { active: true } } },
        { user: { flags: { staff: true } }, status: 'ok' },
      ],
      deep: true,
    })).resolves.toEqual({
      user: {
        name: 'Ada',
        flags: {
          active: true,
          staff: true,
        },
      },
      status: 'ok',
    });
  });
});
