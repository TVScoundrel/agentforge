# ST-09043: Tighten Error Reporter Context Contracts

## Summary

Tightened the public error-reporter contracts in `packages/core/src/langgraph/observability/errors.ts` so error state is unknown-first, metadata is explicitly JSON-safe, and `AgentError.toJSON()` no longer exposes broad `any` return values. The runtime behavior for wrapped nodes, manual reporting, and serialized error shape remains unchanged.

## Scope

Touched files:
- `packages/core/src/langgraph/observability/errors.ts`
- `packages/core/tests/langgraph/observability/errors.typecheck.ts`

## Test Strategy

Test-first path used.

The first failing automated gate was a standalone typecheck fixture for `AgentError` and `createErrorReporter(...)`:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/langgraph/observability/errors.typecheck.ts`
- initial failure included:
  - `Unused '@ts-expect-error' directive.`

That failure proved the public error state and metadata contracts were still wide enough to allow direct property access on `state` and non-JSON-safe values in `metadata`.

## Validation

Focused validation after implementation:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/langgraph/observability/errors.typecheck.ts`
- `pnpm test --run packages/core/tests/langgraph/observability/errors.test.ts`
- `pnpm --filter @agentforge/core typecheck`
- `pnpm lint:explicit-any:baseline`

Full validation before review:
- `pnpm test --run`
- `pnpm lint`
- `git diff --check`

Coverage relevance:
- source-included typecheck coverage for unknown-first `state` access and JSON-safe `metadata`
- existing runtime tests already cover serialized error payloads, optional state inclusion, wrapped-node propagation, async errors, and manual reporting behavior

## Explicit-any Delta

Touched source file:
- `packages/core/src/langgraph/observability/errors.ts`: `5 -> 0`

Package and workspace baseline impact:
- `core`: `28/119 -> 23/119`
- workspace: `99/289 -> 94/289`

## Behavior Notes

Preserved behavior includes:
- `AgentError` message, code, node, cause, and timestamp handling
- wrapped-node propagation through `createErrorReporter(...).wrap(...)`
- optional inclusion of state when `includeState` is enabled
- fallback safety when the reporting callback itself throws
- `toJSON()` field names and nested cause structure

The contract tightening is limited to type boundaries:
- `state` is now unknown-first and requires narrowing by consumers
- `metadata` must be JSON-safe at the API boundary
- `toJSON()` returns a typed serialized object instead of a broad `Record<string, any>`
