# ST-09044: Tighten Testing Mock Tool Factory Contracts

## Summary

This story hardens the `@agentforge/testing` mock tool factory so schema-driven input types remain ergonomic without relying on broad `any` seams. It also restores valid default helper names for the built-in mock tool helpers, which were failing tool metadata validation at runtime.

## What Changed

- introduced a shared default mock-tool schema constant in [packages/testing/src/mocks/mock-tool.ts](../packages/testing/src/mocks/mock-tool.ts)
- replaced broad generic defaults and implementation/input `any` seams with schema-driven aliases and explicit overloads for:
  - no-schema default mock tools
  - schema-driven mock tools
- kept the runtime default implementation behavior intact by continuing to stringify the validated input payload
- corrected the built-in helper default names from underscore variants to kebab-case while preserving underscore compatibility in helper name overrides for delayed/error/echo tools
- added a source-included typecheck regression in [packages/testing/src/mocks/mock-tool.typecheck.ts](../packages/testing/src/mocks/mock-tool.typecheck.ts)
- added focused runtime coverage in [packages/testing/tests/mock-tool.test.ts](../packages/testing/tests/mock-tool.test.ts)

## Test-First Evidence

- first failing gate:
  - `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/testing/src/mocks/mock-tool.typecheck.ts`
- failure mode before implementation:
  - unused `@ts-expect-error` directives on the default no-schema mock-tool boundary, proving the public input contract still widened to broad `any`
- focused runtime failures before the fix:
  - `pnpm test --run packages/testing/tests/mock-tool.test.ts`
  - helper construction failed metadata validation because default helper names still used underscore variants such as `mock_tool`, `error_tool`, and `delayed_tool`

## Validation

- `./node_modules/.bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --types node packages/testing/src/mocks/mock-tool.typecheck.ts`
- `pnpm test --run packages/testing/tests/mock-tool.test.ts`
- `pnpm --filter @agentforge/testing typecheck`
- `pnpm lint:explicit-any:baseline`
- `pnpm test --run`
- `pnpm lint`
- `git diff --check`

## Explicit-`any` Delta

- [packages/testing/src/mocks/mock-tool.ts](../packages/testing/src/mocks/mock-tool.ts): `3 -> 0`
- `testing` baseline: `3/51 -> 0/51`
- workspace baseline: `94/289 -> 91/289`

## Residual Risk

- the public factory now relies on a narrow cast after `.build()` because the builder API does not currently expose a generic factory entrypoint for carrying the overload-selected schema type all the way through construction
- that cast stays local to the helper surface, and the source-included typecheck fixture plus focused runtime tests cover the intended public contract
