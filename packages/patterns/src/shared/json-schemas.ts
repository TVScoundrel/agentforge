import type { JsonObject, JsonValue } from '@agentforge/core';
import { z } from 'zod';

function isPlainJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
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
