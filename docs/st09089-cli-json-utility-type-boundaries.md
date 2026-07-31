# ST-09089: Harden CLI JSON Utility Type Boundaries

## Summary

The CLI filesystem helpers exposed `any` at both JSON write and read boundaries. This allowed callers to pass values outside the JSON data model and made untyped reads silently default to an unsafe type.

## Implementation

- Added exported `JsonPrimitive`, `JsonObject`, and recursive `JsonValue` types to `packages/cli/src/utils/fs.ts`.
- Changed `writeJson(...)` to accept JSON-safe values.
- Changed `readJson<T = unknown>(...)` to use an unknown-first generic default while preserving explicit typed reads.
- Updated the CLI project manifest model to declare its JSON object boundary explicitly.
- Kept the existing `fs-extra` delegation, formatting option, encoding behavior, and error propagation unchanged.
- Added focused utility coverage for nested JSON round trips, generic output, malformed JSON, and read/write filesystem failures.

## Test Strategy

Focused tests were added before the production contract change. The runtime tests exercise the existing `fs-extra` seam and verify that successful values and underlying errors pass through unchanged. The typecheck then validates the new JSON-safe input and unknown-first output contracts across CLI callers.

## Validation

- Red-first focused run: the initial command used a workspace-relative path with the package-local Vitest config and found no test files; the canonical package-relative rerun passed after the tests were added.
- Focused CLI tests: `pnpm --filter @agentforge/cli test --run tests/utils/fs.test.ts` -> `25` passed tests.
- CLI typecheck: `pnpm --filter @agentforge/cli typecheck` -> passed.
- Explicit-`any` baseline: `pnpm lint:explicit-any:baseline` -> passed at `workspace 78/289`, `cli 4/24`; improved from `80/289`, `cli 6/24`.

## Compatibility Notes

- Existing `readJson<SomeType>(...)` calls remain supported.
- JSON serialization still uses two-space formatting and relies on `fs-extra` for malformed-JSON and filesystem errors.
- No CI workflow change is required because the existing CLI package test/typecheck commands and workspace explicit-`any` gate cover the changed boundary.
