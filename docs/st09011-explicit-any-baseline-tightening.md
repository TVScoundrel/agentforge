# ST-09011: Tighten Explicit-`any` Baseline Caps

## Summary

Tightened the committed `@typescript-eslint/no-explicit-any` baseline caps so the no-regression guard now reflects the current measured floor instead of stale historical allowance values.

## What Changed

| File | Change |
|------|--------|
| `scripts/no-explicit-any-baseline.json` | Updated the total `maxWarnings` cap from `496` to `289`, refreshed per-package caps to the current measured counts, and stamped the baseline snapshot date to `2026-03-23`. |
| `planning/kanban-queue.md` | Moved ST-09011 into active execution while tightening the queue rationale around baseline enforcement. |
| `planning/epics-and-stories.md` | Updated ST-09011 status and phase-chain sequencing to reflect active execution. |
| `planning/features/09-solid-micro-refactors-feature-plan.md` | Updated the EP-09 active-story marker while the baseline-tightening work is in progress. |

## Baseline Cap Delta

- Total cap: `496 -> 289`
- `core`: `256 -> 119`
- `tools`: `82 -> 67`
- `patterns`: `82 -> 28`
- `testing`: `51 -> 51` (unchanged)
- `cli`: `25 -> 24`
- `skills`: `0 -> 0` (unchanged)

## Validation Performed

```bash
pnpm lint:explicit-any:baseline
pnpm test --run
pnpm lint
```

Baseline result:
- `289/289` warnings
- `cli 24/24`, `core 119/119`, `patterns 28/28`, `skills 0/0`, `testing 51/51`, `tools 67/67`

Full-suite result:
- `152` files passed, `16` skipped
- `2119` tests passed, `286` skipped

Lint result:
- `pnpm lint` exited `0`
- Existing workspace warnings remain outside this story's touched baseline file

## Test Impact

No source runtime behavior changed. This story tightens a lint-baseline data file and validates it with the existing baseline command instead of adding new automated tests.

## Status

Ready for review on `codex/chore/st-09011-explicit-any-baseline-tightening`.
