# ST-09056: Skills Registry Modularization

## Summary

`ST-09056` modularizes the skills registry runtime and its coupled registry tests without changing public behavior. The public `SkillRegistry` facade remains stable while discovery, duplicate-handling, prompt rendering, and event plumbing move into focused internal modules.

## Test Strategy

A structure-only failing test would mostly prove file layout rather than `SkillRegistry` behavior. For this story, the real contract is preserving discovery order, duplicate precedence, scan-error reporting, prompt output, event semantics, trust lookups, and public imports while splitting the oversized runtime and coupled test surface.

The practical test-first substitute was:

- split `packages/skills/tests/registry.test.ts` into focused discovery, query, event, and rescan suites first
- use those focused suites together with the existing prompt, trust, activation, and conformance coverage as the regression net while extracting registry responsibilities behind the stable public facade

No additional CI automation was required because the existing `@agentforge/skills` typecheck, focused test runs, workspace test suite, lint, and explicit-`any` baseline gate already cover the changed surfaces.

## Runtime And Test Layout

### Production

- `packages/skills/src/registry.ts`: `506` -> `101` lines
- Added `packages/skills/src/registry-discovery.ts`: `103` lines
- Added `packages/skills/src/registry-events.ts`: `52` lines
- Added `packages/skills/src/registry-prompt.ts`: `73` lines
- Added `packages/skills/src/registry-query-api.ts`: `30` lines
- Added `packages/skills/src/registry-internal.ts`: `10` lines

### Tests

- Replaced `packages/skills/tests/registry.test.ts`: `419` lines
- Added `packages/skills/tests/registry-discovery.test.ts`: `168` lines
- Added `packages/skills/tests/registry-query.test.ts`: `67` lines
- Added `packages/skills/tests/registry-events.test.ts`: `90` lines
- Added `packages/skills/tests/registry-rescan.test.ts`: `56` lines
- Added shared helper `packages/skills/tests/registry.test-utils.ts`: `22` lines

## Behavior Preserved

- discovery still scans configured roots in order and keeps first-root precedence for duplicate names
- parse/validation warnings still populate `getScanErrors()` and emit `skill:warning` events
- `get`, `getAll`, `has`, `size`, `getNames`, `getAllowedTools`, and `getAllowUntrustedScripts` remain unchanged
- `generatePrompt()` still preserves feature-flag gating, subset filtering, max-skill capping, and XML escaping
- `on`, `off`, `emitEvent`, and activation-tool integration remain unchanged

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline` remained stable at `84/289` workspace warnings
- `@agentforge/skills` remained at `0/0`

## Validation

- Focused skills suites:
  - `pnpm test --run packages/skills/tests/registry-discovery.test.ts packages/skills/tests/registry-query.test.ts packages/skills/tests/registry-events.test.ts packages/skills/tests/registry-rescan.test.ts packages/skills/tests/prompt.test.ts packages/skills/tests/trust.test.ts packages/skills/tests/activation.test.ts packages/skills/tests/conformance.test.ts`
  - `8` files passed, `164` tests passed
- Package checks:
  - `pnpm --filter @agentforge/skills typecheck`
  - `pnpm --filter @agentforge/skills exec eslint src/registry.ts src/registry-discovery.ts src/registry-events.ts src/registry-prompt.ts src/registry-query-api.ts tests/registry-discovery.test.ts tests/registry-query.test.ts tests/registry-events.test.ts tests/registry-rescan.test.ts tests/registry.test-utils.ts`
- Workspace checks:
  - `pnpm lint:explicit-any:baseline`
  - `pnpm test --run` -> `205` files passed, `18` skipped; `2307` tests passed, `286` skipped
  - `pnpm lint` -> passed with warnings only
  - `git diff --check`
