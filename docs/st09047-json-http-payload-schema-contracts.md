# ST-09047: Tighten JSON and HTTP Payload Schema Contracts

## Summary

Replaced broad JSON and HTTP payload `any` seams in `@agentforge/tools` with unknown-first schema contracts and an unknown-first `HttpResponse.data` boundary, while preserving JSON query/merge behavior and HTTP schema usage.

## What Changed

- changed JSON schemas in `packages/tools/src/data/json/types.ts`:
  - `jsonStringifySchema.data` now uses `z.unknown()`
  - `jsonQuerySchema.data` now uses `z.unknown()`
  - `jsonMergeSchema.objects` now requires described `Record<string, unknown>` entries instead of blanket `z.any()`
- changed HTTP types in `packages/tools/src/web/http/types.ts`:
  - `httpRequestSchema.body` now uses `z.unknown()`
  - `httpPostSchema.body` now uses `z.unknown()`
  - `HttpResponse.data` is now `unknown`
- hardened JSON tool implementations to match the stricter contracts:
  - `packages/tools/src/data/json/tools/json-query.ts`
  - `packages/tools/src/data/json/tools/json-merge.ts`
- added focused regression coverage:
  - `packages/tools/tests/data/json/json-types.test.ts`
  - `packages/tools/tests/web/http-types.test.ts`

## Test Strategy

- first failing tests:
  - `pnpm test --run packages/tools/tests/data/json/json-types.test.ts`
  - failed because the JSON schema surfaces still exposed `ZodAny`
  - `pnpm test --run packages/tools/tests/web/http-types.test.ts`
  - the first run caught a test import-path mistake; after correcting the harness, the HTTP schema test validated the intended unknown-first body contract
- focused follow-up validation:
  - `pnpm test --run packages/tools/tests/data/json/json-types.test.ts packages/tools/tests/web/http-types.test.ts`
  - `pnpm --filter @agentforge/tools typecheck`
  - `pnpm --filter @agentforge/tools exec eslint src/data/json/types.ts src/data/json/tools/json-query.ts src/data/json/tools/json-merge.ts src/web/http/types.ts tests/data/json/json-types.test.ts tests/web/http-types.test.ts`
  - `pnpm test --run`
  - `pnpm lint`
  - `pnpm lint:explicit-any:baseline`
  - `git diff --check`

## Behavior Notes

- JSON query still supports dotted object traversal and array index access such as `roles[0].name`
- JSON merge still preserves deep nested object merge behavior
- HTTP request schemas still accept arbitrary request bodies; the contract is now explicit at the type boundary instead of flowing through `any`
- `HttpResponse.data` is now caller-narrowed from `unknown`, matching the rest of the repo's unknown-first hardening direction

## Explicit-`any` Impact

- touched files:
  - `packages/tools/src/data/json/types.ts`
  - `packages/tools/src/web/http/types.ts`
  - `packages/tools/src/data/json/tools/json-merge.ts`
- explicit `any` delta for touched files:
  - `packages/tools/src/data/json/types.ts`: removed `3` broad schema `any` seams
  - `packages/tools/src/web/http/types.ts`: removed `3` payload/response `any` seams
  - `packages/tools/src/data/json/tools/json-merge.ts`: removed `3` deep-merge helper `any` seams
- current touched-file grep for `\\bany\\b` is clean
- package typecheck and scoped eslint both pass after the contract shift
- full-suite validation passed with `177` test files green (`16` skipped) and workspace lint passed with warnings only
- explicit-`any` baseline improved from `90/289` to `84/289`, with `tools` improving from `59/67` to `53/67`
