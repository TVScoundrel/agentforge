# ST-09086: Relational Schema Diff Modularization

## Summary

- Reduced `packages/tools/src/data/relational/schema/schema-diff.ts` from a mixed-responsibility runtime to a small public facade that re-exports focused comparison, JSON, and public diff-type modules.
- Split the previous `packages/tools/tests/data/relational/schema-diff.test.ts` monolith into focused diff and JSON suites behind the same public test entrypoint.
- Preserved the public `diffSchemas(...)`, `exportSchemaToJson(...)`, and `importSchemaFromJson(...)` surfaces together with the current diff-report shapes and validation messages.

## Compatibility Rationale

- Table and column comparisons remain case-insensitive where they were before because the same name-normalization semantics were preserved in the extracted comparison helper.
- Primary-key ordering remains part of the diff contract, so reordered composite keys still produce a `primaryKeyChanged` result instead of being normalized away.
- JSON import/export behavior remains intentionally strict and deterministic: exported object keys are sorted, while import still rejects missing `vendor`, `tables`, `generatedAt`, `name`, `columns`, and `primaryKey` fields with the same actionable error shape.

## Validation

- `pnpm --filter @agentforge/tools test --run tests/data/relational/schema-diff.test.ts`
- `pnpm --filter @agentforge/tools typecheck`
- `pnpm lint:explicit-any:baseline`

## Explicit Any Baseline

- `pnpm lint:explicit-any:baseline` passed at `workspace 80/289` warnings with `tools 53/67`.

## CI Impact

- No CI workflow change is required; the existing tools package-scoped validation path still covers the modularized schema-diff public entrypoint.
