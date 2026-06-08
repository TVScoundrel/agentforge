import type { JsonObject, JsonValue } from '@agentforge/core';
import { z } from 'zod';

function isPlainJsonObject(value: unknown): value is JsonObject {
  const prototype =
    typeof value === 'object' && value !== null ? Object.getPrototypeOf(value) : null;

  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (prototype === Object.prototype || prototype === null)
  );
}

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    JsonObjectSchema,
  ])
);

export const JsonObjectSchema: z.ZodType<JsonObject> = z
  .custom<JsonObject>(isPlainJsonObject, {
    message: 'Expected a plain JSON object',
  })
  .pipe(z.record(JsonValueSchema));
