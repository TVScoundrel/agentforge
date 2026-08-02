# ST-09091: Type Directory Listing Results

## Summary

The directory-list tool returned an unstructured `any[]` for its entries, forcing consumers to infer fields and weakening the public filesystem boundary. This story gives the result a stable exported model without changing traversal or serialization behavior.

## Implementation

- Added exported `DirectoryListEntry` and `DirectoryListResult` interfaces in `packages/tools/src/file/directory/types.ts`.
- Replaced the recursive helper's `Promise<any[]>` and local `any[]` contracts with `DirectoryListEntry[]`.
- Kept detail metadata optional because `fullPath`, `size`, and `modified` are emitted only when `includeDetails` is enabled.
- Preserved recursive traversal, extension filtering, relative paths, counts, `lstat` detail lookup, and filesystem-policy resolution.
- Added focused coverage for empty, flat, recursive, filtered, detailed, and policy-constrained listings plus consumer-facing model assignability.

## Test Strategy

The focused suite was added before the production type change and passed against the existing runtime. This confirms the requested behavior before tightening the compile-time contract; tools typecheck then verifies that the exported model and implementation agree.

## Validation

- Focused tools tests: `pnpm --filter @agentforge/tools test --run tests/file/directory-list.test.ts` -> `6` passed tests before and after the type change.
- Tools typecheck: `pnpm --filter @agentforge/tools typecheck` -> passed.
- Explicit-`any` baseline: `pnpm lint:explicit-any:baseline` -> passed at `workspace 76/289`, `tools 51/67`; improved from `workspace 78/289`, `tools 53/67`.

## Compatibility Notes

- Public fields and serialized output remain unchanged.
- Detail-only fields remain optional in the shared entry model to represent both default and detailed results.
- No CI workflow change is required because existing tools package validation and workspace explicit-`any` checks cover the changed boundary.
