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

  it('reject array traversal as object records and harden merge special keys', async () => {
    const jsonQueryTool = createJsonQueryTool();
    const jsonMergeTool = createJsonMergeTool();

    await expect(jsonQueryTool.invoke({
      data: [['Ada']],
      path: '0.name',
    })).resolves.toMatchObject({
      success: false,
      error: 'Path not found: 0.name',
    });

    const polluted = await jsonMergeTool.invoke({
      objects: [
        {
          safe: true,
          ['__proto__']: { polluted: true },
          constructor: 'ctor',
          prototype: 'proto',
        },
      ],
      deep: false,
    });

    expect(Object.getPrototypeOf(polluted)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(polluted, '__proto__')?.value).toEqual({ polluted: true });
    expect(Object.getOwnPropertyDescriptor(polluted, 'constructor')?.value).toBe('ctor');
    expect(Object.getOwnPropertyDescriptor(polluted, 'prototype')?.value).toBe('proto');
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();

    const deepPolluted = await jsonMergeTool.invoke({
      objects: [
        { nested: { ['__proto__']: { polluted: true } } },
        { nested: { safe: true } },
      ],
      deep: true,
    });

    expect(Object.getPrototypeOf(deepPolluted.nested as object)).toBe(Object.prototype);
    expect(
      Object.getOwnPropertyDescriptor(deepPolluted.nested as Record<string, unknown>, '__proto__')?.value
    ).toEqual({ polluted: true });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
