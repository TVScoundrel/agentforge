# ST-09039: Tighten Core Mock Tool Testing Helper Contracts

## Summary

Tightened the mock-tool and tool-simulator helper contracts in `packages/core/src/tools/testing.ts` so typed test helpers no longer rely on broad `any` payloads. The change preserves existing runtime matching and invocation behavior while making named-tool simulator execution and invocation inspection type-safe.

## Scope

Touched files:
- `packages/core/src/tools/testing.ts`
- `packages/core/tests/tools/testing.typecheck.ts`
- `packages/core/tests/tools/testing.test.ts`

## Test Strategy

Test-first path used.

The first failing automated gate was a standalone typecheck fixture for generic helper usage:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/tools/testing.typecheck.ts`
- initial failure included:
  - `Expected 0 type arguments, but got 2`
  - `Unused '@ts-expect-error' directive`

That failure proved `createMockTool(...)` and `createToolSimulator(...)` did not yet expose the intended generic input/output contracts.

## Validation

Focused validation after implementation:
- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/core/tests/tools/testing.typecheck.ts`
- `pnpm test --run packages/core/tests/tools/testing.test.ts`
- `pnpm --filter @agentforge/core typecheck`
- `pnpm lint:explicit-any:baseline`

Coverage added in the focused regression files:
- generic mock-tool input/output inference
- predicate response matching
- configured error recording
- simulator missing-tool errors
- simulator invocation clearing
- named-tool simulator input/output inference and invocation typing

## Explicit-any Delta

Touched helper file:
- `packages/core/src/tools/testing.ts`: `8 -> 0`

Package and workspace baseline impact:
- `core`: `44/119 -> 35/119`
- workspace: `115/289 -> 106/289`

## Behavior Notes

Preserved behavior includes:
- response matching by exact JSON payload or predicate
- default response fallback
- random error simulation
- latency simulation
- invocation recording timestamps and durations
- simulator execution and missing-tool error behavior

The main contract change is that mock tools and simulator tools now carry explicit generic input/output types, and named simulator execution can infer the correct payload shape from the selected tool name.
