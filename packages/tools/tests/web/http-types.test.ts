import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  httpPostSchema,
  httpRequestSchema,
} from '../../src/web/http/types.js';

describe('http schemas', () => {
  it('keep request payload boundaries unknown-first instead of any', () => {
    expect(httpRequestSchema.parse({
      url: 'https://example.com/api',
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { ok: true, nested: ['x'] },
      timeout: 5000,
      params: { page: '1' },
    })).toMatchObject({
      url: 'https://example.com/api',
      method: 'POST',
      body: { ok: true, nested: ['x'] },
      timeout: 5000,
      params: { page: '1' },
    });

    expect(httpPostSchema.parse({
      url: 'https://example.com/api',
      body: { id: 1, active: true },
      headers: { 'x-trace-id': 'trace-1' },
    }).body).toEqual({ id: 1, active: true });

    expect(httpRequestSchema.shape.body).toBeInstanceOf(z.ZodOptional);
    expect(httpRequestSchema.shape.body.unwrap()).toBeInstanceOf(z.ZodUnknown);
    expect(httpPostSchema.shape.body).toBeInstanceOf(z.ZodUnknown);
  });
});
