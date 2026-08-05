# ST-09094: Neo4j Property and Query Payload Contracts

## Scope

Harden the Neo4j tools package at the property, query-parameter, node-helper, and embedding-provider error boundaries without changing public tool result shapes or database behavior.

## Contract Changes

- Neo4j properties and query parameters now use the shared JSON-safe `JsonValue`/`JsonObject` contracts.
- Neo4j schemas recursively validate JSON-compatible scalar, array, nested-object, and null-prototype values while rejecting functions and `Date` instances.
- Property filters and node creation preserve parameter binding and identifier sanitization without broad `any` payloads.
- Embedding retry and provider error paths accept `unknown`, safely classify malformed errors, and preserve retry metadata and existing user-facing messages.
- The connection query result default is `unknown` instead of an unconstrained `any` alias.

## Test Strategy

Test-first automated coverage was used. The initial focused test run failed because embedding-property schemas exposed `ZodAny` and `isRetryableError(null)` dereferenced an unknown value. The final focused suite covers supported property values, nested and null-prototype maps, rejected unsupported values, sanitized parameter binding, malformed errors, and provider error metadata. Compile-time assertions reject function and `Date` property values.

## Validation

- `pnpm --filter @agentforge/tools test --run tests/data/neo4j/contracts.test.ts` — passed, 5 tests.
- `pnpm --filter @agentforge/tools typecheck` — passed.
- `pnpm lint:explicit-any:baseline` — passed at `45/289` warnings (`tools 26/67`); this is an improvement with no baseline regression. The repository script requests a separate baseline-cap update for measured reductions, so the cap file remains unchanged in this story.
- `pnpm --filter @agentforge/tools test --run` — passed, 93 files with 1168 tests passed and 110 skipped.
- `pnpm lint` — passed with existing warnings and no errors.
- `pnpm test` — passed, 231 files with 2564 tests passed and 110 skipped.
- `pnpm build` — passed; the existing VitePress large-chunk warning remains.

## CI Assessment

No CI change is required. The existing package test, package typecheck, workspace lint, and explicit-`any` baseline commands cover the new contract and regression tests.
