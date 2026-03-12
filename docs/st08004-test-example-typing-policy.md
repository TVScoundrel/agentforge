# ST-08004: Test/Example Typing Policy and Targeted Cleanup

## Scope
Define and apply a practical `no-explicit-any` policy for tests/examples, then remove low-effort warning hotspots without reducing test readability.

## Policy

### 1) Runtime `src/**` code
- `any` remains discouraged and should be replaced with concrete types or `unknown` + narrowing.

### 2) Tests/examples/templates
- Prefer concrete types first.
- Use `unknown` at mock boundaries when exact typing is not worth the maintenance cost.
- Allow explicit `any` only when required by third-party mock surfaces or intentionally untyped dynamic payloads.
- When explicit `any` is intentionally kept, add a localized rationale comment (or scoped eslint disable) at the usage site.

## ESLint Scoping Update
Updated root ESLint config (`eslint.config.js`) to make test/example policy explicit:
- Added file-scoped override for `tests`, `__tests__`, `examples`, and `templates`.
- Kept `@typescript-eslint/no-explicit-any` visibility as `warn`.
- Enabled `ignoreRestArgs: true` in those scopes to reduce mock-signature noise.

## Targeted Cleanup Performed

### Files updated
- `packages/core/tests/langgraph/builders/subgraph.test.ts`
  - Replaced broad `as any` edge casts with `unknown`-based casts.
- `packages/cli/tests/utils/package-manager.test.ts`
  - Replaced `any`-typed mock parameters with `string`.
  - Replaced repeated `{} as any`/`{ stdout: ... } as any` mocks with typed helper:
    - `type ExecaResult = Awaited<ReturnType<typeof execa>>`
    - `execaResult(...)` factory.

## Lint Delta (`@typescript-eslint/no-explicit-any` in tests/examples/templates)
Measured with:
- `pnpm exec eslint packages --ext .ts,.js -f json`
- Filtered to paths matching `tests|__tests__|examples|templates`.

- Before: `358`
- After: `283`
- Delta: `-75`

Focused touched-file deltas:
- `packages/core/tests/langgraph/builders/subgraph.test.ts`: `46 -> 0`
- `packages/cli/tests/utils/package-manager.test.ts`: `26 -> 0`

## Remaining Warning Rationale
Most remaining warnings are in older integration/fixture-heavy tests and examples where:
- LangGraph or tool mocks rely on dynamic generic boundaries.
- Test setup intentionally favors concise fixtures over strict type plumbing.

These can be reduced further in follow-up cleanup slices without broad behavior risk.

## Validation
- `pnpm test --run packages/core/tests/langgraph/builders/subgraph.test.ts packages/cli/tests/utils/package-manager.test.ts`
  - Result: `2` files passed, `37` tests passed.
- `pnpm exec eslint packages/core/tests/langgraph/builders/subgraph.test.ts packages/cli/tests/utils/package-manager.test.ts`
  - No `no-explicit-any` warnings in touched files.
- `pnpm test --run`
  - Result: `146` passed, `16` skipped test files (`162` total)
  - Result: `2076` passed, `286` skipped tests (`2362` total)
- `pnpm lint`
  - Result: exit code `0` (warnings-only, no lint errors)
