# ST-08002: Core Runtime Type Hardening (Pass 1)

## Summary

Reduced explicit `any` usage in core runtime hotspots by replacing broad `any` types with `unknown`-first boundaries, typed helper aliases, and explicit narrowing where schema metadata is inspected.

## Scope

- `packages/core/src/tools/registry.ts`
- `packages/core/src/tools/executor.ts`
- `packages/core/src/resources/http-pool.ts`

## Type Design Decisions

### `tools/registry.ts`
- Introduced `RegistryTool = Tool<unknown, unknown>` as the default runtime-safe tool shape for storage/query operations.
- Changed event payload and handlers from `any` to `unknown`.
- Replaced direct schema `as any` internals access with a typed `getSchemaShape()` helper using `z.ZodObject` narrowing.

### `tools/executor.ts`
- Replaced `any`-based tool/input/result callbacks with an `ExecutableTool` interface and `unknown` boundaries.
- Added `toError()` normalization to handle thrown non-`Error` values safely while preserving retry/error hooks.
- Updated queue and execution signatures to return `unknown`/`unknown[]` instead of `any`.

### `resources/http-pool.ts`
- Replaced `any` defaults with `unknown` and added generic request payload typing via `RequestConfig<TData>`.
- Updated `HttpClient` method signatures (`post`, `put`, `request`) to carry typed request payloads without `any`.
- Preserved runtime behavior (mock client still returns `200 OK` with typed response envelope).

## Warning Count Delta (`@typescript-eslint/no-explicit-any`)

Captured via:

```bash
pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/executor.ts packages/core/src/resources/http-pool.ts -f json
```

### Per file

- `packages/core/src/tools/registry.ts`: `25 -> 0`
- `packages/core/src/tools/executor.ts`: `21 -> 0`
- `packages/core/src/resources/http-pool.ts`: `18 -> 0`

### Total reduction in targeted files

- `64` warnings removed

### Baseline impact (`src/**`)

From `pnpm lint:explicit-any:baseline`:

- `core: 256 -> 192` (`-64`)
- Workspace total: `496 -> 432` (`-64`)

## Validation

Commands run:

```bash
pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/executor.ts packages/core/src/resources/http-pool.ts packages/core/tests/resources/http-pool.test.ts
pnpm --filter @agentforge/core typecheck
pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/executor.test.ts packages/core/tests/resources/http-pool.test.ts
pnpm lint:explicit-any:baseline
```

Results:

- Lint/typecheck passed for touched code.
- Focused tests passed (`58` tests across touched core areas).
- Baseline gate passed and reported improvement.
