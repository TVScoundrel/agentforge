# ST-09032: Tighten Managed Tool Lifecycle Contracts

## Summary

`packages/core/src/tools/lifecycle.ts` still relied on broad `any` defaults across the managed-tool lifecycle surface, including context, execute input/output, and health-check metadata. This story tightened those contracts to unknown-first or more accurate defaults, aligned health metadata with the shared JSON-safe payload types, and added direct lifecycle coverage for initialization, execution, cleanup, health checks, process-exit cleanup registration, and LangChain interop.

## What Changed

| File | Change |
|------|--------|
| `packages/core/src/tools/lifecycle.ts` | Replaced broad lifecycle generic defaults with safer defaults, aligned health-check metadata with shared JSON-safe payload contracts, exposed `context` as optionally present to match runtime reality, tightened the LangChain interop return type, normalized unknown error handling, and made auto-cleanup listeners and health-check teardown safer under repeated instance creation, long-running checks, concurrent cleanup, and repeated teardown calls. |
| `packages/core/src/tools/lifecycle.typecheck.ts` | Added source-included type regressions covering typed context access, execute input/output inference, JSON-safe health metadata, and the unknown-first default surface. |
| `packages/core/tests/tools/lifecycle.test.ts` | Added focused lifecycle coverage for initialization, execution stats, default and periodic health checks, cleanup, process-exit cleanup registration, LangChain-style invocation, pre-initialize cleanup, late health-check completion after cleanup, health-check races during teardown, and single-flight cleanup behavior. |

## Compatibility Notes

- The public managed-tool surface and core lifecycle flow remain stable, while the latest review-fix rounds tighten background-hook and teardown behavior in edge cases.
- `ManagedTool.context` is now typed as `TContext | undefined`, matching the existing runtime possibility when no initial context is provided.
- `healthCheck()` still returns `{ healthy: true, metadata: { message: 'No health check configured' } }` when no health check is configured.
- `toLangChainTool()` still returns the same runtime shape with `name`, `description`, and `invoke(...)`.
- Process-exit auto-cleanup registration remains enabled by default when `autoCleanup` is not disabled.
- Periodic health checks now run single-flight, so long-running checks do not overlap and race the stored health status.
- Auto-cleanup listeners are now removed during teardown even if `cleanup()` is called before `initialize()`.
- Cleanup now marks the tool unavailable before awaiting teardown hooks, so manual and periodic health checks do not write stale status after teardown starts.
- Cleanup is now single-flight, so repeated `cleanup()` calls cannot clear teardown state early or allow `initialize()` to race ahead of an in-progress teardown.

## Explicit `any` Warning Delta

### Story scope hotspot

- `packages/core/src/tools/lifecycle.ts`: `10 -> 0` (`-10`)
- `packages/core/src/tools/lifecycle.typecheck.ts`: `0 -> 0` (`0`)

### Baseline gate snapshot

- `@typescript-eslint/no-explicit-any` (`packages/**/src/**/*.ts`): `180 -> 170` (`-10`)
- `core` package: `63 -> 53` (`-10`)

(Captured with `pnpm lint:explicit-any:baseline --silent` on 2026-04-24.)

## Validation

- `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
- `pnpm exec eslint packages/core/src/tools/lifecycle.ts packages/core/src/tools/lifecycle.typecheck.ts packages/core/tests/tools/lifecycle.test.ts`
  - passed cleanly
- `pnpm test --run packages/core/tests/tools/lifecycle.test.ts`
  - `1 passed` file, `13 passed` tests
- `pnpm lint:explicit-any:baseline --silent`
  - `170/289` warnings, `core 53/119`
- `pnpm test --run`
  - `163 passed | 16 skipped` files
  - `2233 passed | 286 skipped` tests
- `pnpm lint`
  - exit `0`; warnings only

## Test Impact

Added a dedicated lifecycle suite so the managed-tool contract now has direct coverage for lifecycle hooks, execution stats, periodic health checks, process-exit cleanup registration, LangChain-style invocation, and teardown race handling instead of relying on indirect transitive coverage.
