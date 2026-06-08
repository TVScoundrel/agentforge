import type { JsonObject, JsonValue } from '@agentforge/core';
import { z } from 'zod';

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ])
);

export const JsonObjectSchema: z.ZodType<JsonObject> = z.record(JsonValueSchema);
