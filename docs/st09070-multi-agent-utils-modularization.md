# ST-09070: Multi-Agent Utilities Modularization

## Summary

Modularized `packages/patterns/src/multi-agent/utils.ts` from a mixed-responsibility runtime into a thin public facade backed by focused ReAct-agent detection, result-shape extraction/serialization, shared runtime guards, and wrapped worker-execution helpers. Split the coupled utility coverage into a public entrypoint plus focused detection and wrap-agent suites under `packages/patterns/tests/multi-agent/utils/`.

## Test-First Evidence

- This story is behavior-preserving refactor work rather than a new capability, so a red-first assertion on file structure would have tested temporary layout rather than stable public utility behavior.
- The practical test-first path was characterization-first coverage:
  - replaced the monolithic `packages/patterns/tests/multi-agent/utils.test.ts` body with a stable public entrypoint
  - added focused detection and wrapped-agent suites in `packages/patterns/tests/multi-agent/utils/` before production changes
- First focused run after the suite split:
  - `pnpm test --run packages/patterns/tests/multi-agent/utils.test.ts`
  - failed because the initial positive `isReActAgent(...)` fixture did not match the production constructor-name guard closely enough
- Fixed the detection fixture to mirror the public contract, reran the focused entrypoint, and then used the passing public utility coverage as the modularization safety net.

## Implementation Notes

- Extracted focused runtime helpers:
  - `packages/patterns/src/multi-agent/utils-shared.ts`
  - `packages/patterns/src/multi-agent/utils-react-detection.ts`
  - `packages/patterns/src/multi-agent/utils-react-result.ts`
  - `packages/patterns/src/multi-agent/utils-react-wrapper.ts`
- Kept `packages/patterns/src/multi-agent/utils.ts` as the stable public facade that still exports `isReActAgent(...)` and `wrapReActAgent(...)`.
- Preserved public behavior around ReAct compiled-graph detection, assignment selection, worker-specific checkpoint namespace derivation, wrapped-agent response extraction, structured response serialization, tool-name deduplication, and wrapped error handling.

## File Size Results

- Production files:
  - `packages/patterns/src/multi-agent/utils.ts`: `322 -> 11` lines
  - `packages/patterns/src/multi-agent/utils-shared.ts`: `49` lines
  - `packages/patterns/src/multi-agent/utils-react-detection.ts`: `23` lines
  - `packages/patterns/src/multi-agent/utils-react-result.ts`: `65` lines
  - `packages/patterns/src/multi-agent/utils-react-wrapper.ts`: `180` lines

## Test Modularization Results

- Test files:
  - `packages/patterns/tests/multi-agent/utils.test.ts`: `2` lines
  - `packages/patterns/tests/multi-agent/utils/shared.ts`: `65` lines
  - `packages/patterns/tests/multi-agent/utils/detection.suite.ts`: `30` lines
  - `packages/patterns/tests/multi-agent/utils/wrap-react-agent.suite.ts`: `176` lines

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline`
- Result: `80/289` warnings overall, `2/28` in `patterns`
- Delta: unchanged from the pre-story baseline; no regression introduced

## Residual Test Impact

No additional automated coverage was required beyond the new focused utility suites. The split now isolates detection, assignment selection, response serialization, and wrapped-agent execution behavior behind the stable `packages/patterns/tests/multi-agent/utils.test.ts` public entrypoint while the broader multi-agent nodes, routing, and system-level test surfaces continue to cover end-to-end coordination behavior.

## Validation

- Focused utility coverage:
  - `pnpm test --run packages/patterns/tests/multi-agent/utils.test.ts`
  - `1` file passed, `8` tests passed
- Package compatibility:
  - `pnpm --filter @agentforge/patterns typecheck`
  - Passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Passed with no regression

## CI Impact

No CI change required. The story preserves the public multi-agent utility facade and stays within the repository's existing typecheck, test, lint, and explicit-`any` baseline validation paths.
