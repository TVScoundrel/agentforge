# ST-09077: Stabilize Release-Time pnpm Validation Path

## Summary

The release guide previously told maintainers to validate a patch release with `pnpm build && pnpm test`, but the path was not consistently reliable in practice. During the `0.16.61` patch release, `pnpm` preflight and build-approval policy handling could stop validation before the real package build or Vitest run started, and the documented fallback drifted into ad hoc direct `tsup` and `vitest` invocations. This story hardens the canonical path instead of replacing it: build approvals are now committed, release validation has an explicit guard, and the root test script now runs once instead of entering watch mode.

## Implementation

- Committed the required `allowBuilds` approvals in `pnpm-workspace.yaml` for the native/postinstall dependencies that `pnpm approve-builds --all` surfaced in the maintainer environment.
- Added `scripts/lib/pnpm-build-approvals.mjs` plus `scripts/check-pnpm-build-approvals.mjs` so release validation fails fast with an actionable explanation if the committed approvals drift or placeholders remain.
- Added `pnpm release:validate` as the canonical release-time validation command and updated `.ai/RELEASE_PROCESS.md`, `scripts/release.sh`, and the root `README.md` to point to that command instead of asking maintainers to improvise.
- Changed the root `test` script from `vitest` to `vitest run` and moved watch behavior to `test:watch`, so the documented release validation path always runs to completion in a non-interactive maintainer/release context.
- Added a small repo-level Vitest workspace target and focused tests for the build-approval guard.

## Test Strategy

This story used a targeted red-first test for the new guardrail rather than trying to fabricate a failing package build. The initial focused test run failed because the new validation module did not exist yet; once implemented, the tests exercised both the all-approved path and the actionable-error path for missing or placeholder approvals. The wider safety net came from rerunning the full release validation path after the guard and script changes landed.

## Validation

- Initial focused red-first run: `./node_modules/.bin/vitest run scripts/tests/pnpm-build-approvals.test.ts` -> failed because `scripts/lib/pnpm-build-approvals.mjs` did not exist yet
- `node scripts/check-pnpm-build-approvals.mjs` -> passed
- `pnpm release:validate` -> passed; `222` passed, `9` skipped files and `2505` passed, `110` skipped tests
- `pnpm lint:ci` -> passed with warnings only; explicit-`any` baseline held at `workspace 80/289` and `tools 53/67`

## Failure Mode Notes

- In the original release attempt, sandboxed `pnpm build` failed before the repo build with `ERR_PNPM_META_FETCH_FAIL` and `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; that is environment-specific noise rather than a repo regression.
- In the real maintainer path, `CI=true pnpm build` then failed in `pnpm` preflight with `ERR_PNPM_IGNORED_BUILDS` until the required approvals were explicitly committed. That was the actionable repository-level failure mode this story fixes.
- The release process still relies on a normal installed maintainer workspace. This story does not try to make `pnpm build` succeed in a network-restricted sandbox; it makes the documented repo path deterministic once the workspace is in a normal release-ready state.

## Compatibility Notes

- The signed-commit, tag, publish-order, npm verification, and smoke-test release flow is unchanged.
- The canonical release validation path is still based on `pnpm build` and `pnpm test`; it is now wrapped by `pnpm release:validate` so approval drift is caught before maintainers hit a misleading mid-release failure.
