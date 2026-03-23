# ST-09012: Remove Package Export-Map Build Warnings

## Summary

Cleaned up package export-map condition ordering in the published `@agentforge/skills`, `@agentforge/tools`, and `@agentforge/testing` manifests so routine builds no longer emit the avoidable `"types" condition will never be used` warning.

## What Changed

| File | Change |
|------|--------|
| `packages/skills/package.json` | Reordered the root export conditions to put `types` before `import` and `require`, so TypeScript and related tooling can select the declaration entrypoint before the runtime conditions, eliminating the build warning. |
| `packages/tools/package.json` | Reordered the root export conditions to put `types` before `import` and `require`, preserving the same runtime entrypoints while ensuring TypeScript/tooling sees the declaration entrypoint first. |
| `packages/testing/package.json` | Reordered the root export conditions to put `types` before `import` and `require`, preserving the same runtime/test entrypoints while ensuring TypeScript/tooling sees the declaration entrypoint first. |
| `planning/kanban-queue.md` | Moved ST-09012 from `Ready` to `In Review` during execution. |
| `planning/epics-and-stories.md` | Updated ST-09012 status from `Ready` to `In Review`. |
| `planning/features/09-solid-micro-refactors-feature-plan.md` | Updated the EP-09 active-story marker from `Ready` to `In Review`. |

## Warning Removed

The same warning was present in all three touched packages before this change:

```text
The condition "types" here will never be used as it comes after both "import" and "require"
```

Reordering the condition keys removes that warning without changing the resolved file targets:

- `types` still resolves to `./dist/index.d.ts`
- `import` still resolves to `./dist/index.js`
- `require` still resolves to `./dist/index.cjs`

## Validation Performed

```bash
pnpm --filter @agentforge/skills build
pnpm --filter @agentforge/tools build
pnpm --filter @agentforge/testing build
node <temp>/runtime.cjs
node <temp>/runtime.mjs
pnpm exec tsc --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck --noEmit <temp>/index.ts
pnpm exec vitest run --config <temp>/vitest.config.ts
```

Focused validation results:

- The `exports.types` warning no longer appears in the builds for `@agentforge/skills`, `@agentforge/tools`, or `@agentforge/testing`.
- CJS and ESM package entrypoint smoke checks passed for `@agentforge/skills` and `@agentforge/tools`.
- TypeScript entrypoint resolution passed for `@agentforge/skills`, `@agentforge/tools`, and `@agentforge/testing`.
- A disposable Vitest smoke test passed for `@agentforge/testing`, which is the correct runtime context for that package.

## Test Impact

No repository source runtime logic changed. This story only adjusts package metadata ordering, so focused build and consumer-entrypoint smoke checks provide the meaningful regression coverage rather than new committed tests.

## Full Validation

```bash
pnpm test --run
pnpm lint
```

Full-suite result:

- `152` files passed, `16` skipped
- `2119` tests passed, `286` skipped

Lint result:

- `pnpm lint` exited `0`
- Existing workspace warnings remain outside this story's touched package metadata files

## Status

Ready for review on `codex/fix/st-09012-package-export-map-warning-cleanup`.
