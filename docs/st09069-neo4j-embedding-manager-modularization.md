# ST-09069: Neo4j Embedding Manager Modularization

## Summary

Modularized `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` from a mixed-responsibility runtime into a thin public facade backed by focused provider-factory, environment-resolution, generation-flow, and shared state/assertion helpers. Split the embedding-manager coverage into a public entrypoint plus focused initialization, provider-selection, and generation suites under `packages/tools/tests/data/neo4j/embedding-manager/`.

## Test-First Evidence

- This story is behavior-preserving refactor work rather than a new capability, so a red-first test would only have failed by asserting on temporary file structure instead of stable public behavior.
- The practical test-first path was characterization-first coverage:
  - added a stable public entrypoint at `packages/tools/tests/data/neo4j/embedding-manager.test.ts`
  - added focused suites for initialization, provider selection, and generation behavior before completing the runtime split
- First focused run after the new suites were added:
  - `pnpm test --run packages/tools/tests/data/neo4j/embedding-manager.test.ts`
  - Failed because the shared test harness re-exported the imported runtime symbols in a way Vitest did not bind correctly under the mocked dependency graph.
- Fixed the shared harness export wiring, reran the focused suite, and then used the passing characterization coverage as the refactor safety net.

## Implementation Notes

- Extracted focused runtime helpers:
  - `packages/tools/src/data/neo4j/embeddings/embedding-manager-shared.ts`
  - `packages/tools/src/data/neo4j/embeddings/embedding-provider-factory.ts`
  - `packages/tools/src/data/neo4j/embeddings/embedding-environment.ts`
  - `packages/tools/src/data/neo4j/embeddings/embedding-generation.ts`
- Kept `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts` as the stable public facade that still exports `EmbeddingManager`, the singleton helpers, and the same public generation API.
- Preserved public behavior around provider defaults, required environment variables, singleton initialization helpers, model override precedence, and batch/single generation delegation.

## File Size Results

- Production files:
  - `packages/tools/src/data/neo4j/embeddings/embedding-manager.ts`: `332 -> 151` lines
  - `packages/tools/src/data/neo4j/embeddings/embedding-manager-shared.ts`: `29` lines
  - `packages/tools/src/data/neo4j/embeddings/embedding-provider-factory.ts`: `56` lines
  - `packages/tools/src/data/neo4j/embeddings/embedding-environment.ts`: `120` lines
  - `packages/tools/src/data/neo4j/embeddings/embedding-generation.ts`: `56` lines

## Test Modularization Results

- Test files:
  - `packages/tools/tests/data/neo4j/embedding-manager.test.ts`: `7` lines
  - `packages/tools/tests/data/neo4j/embedding-manager/shared.ts`: `195` lines
  - `packages/tools/tests/data/neo4j/embedding-manager/initialization.suite.ts`: `98` lines
  - `packages/tools/tests/data/neo4j/embedding-manager/provider-selection.suite.ts`: `62` lines
  - `packages/tools/tests/data/neo4j/embedding-manager/generation.suite.ts`: `58` lines

## Explicit-`any` Baseline

- `pnpm lint:explicit-any:baseline`
- Result: `80/289` warnings overall, `53/67` in `tools`
- Delta: unchanged from the pre-story baseline; no regression introduced

## Residual Test Impact

No additional automated coverage was required beyond the new focused embedding-manager suites. The new entrypoint now isolates environment initialization, provider selection, and single/batch generation behavior while the existing `packages/tools/tests/data/neo4j.test.ts` integration surface remains available for broader Neo4j tool coverage.

## Validation

- Focused embedding-manager coverage:
  - `pnpm test --run packages/tools/tests/data/neo4j/embedding-manager.test.ts`
  - `1` file passed, `16` tests passed
- Package compatibility:
  - `pnpm --filter @agentforge/tools typecheck`
  - Passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Passed with no regression
- Full test suite:
  - `pnpm test --run`
  - `212` files passed, `18` files skipped
  - `2340` tests passed, `286` tests skipped
- Lint:
  - `pnpm lint`
  - Exit `0`; warnings only (`0` errors)

## CI Impact

No CI change required. The story preserves the public embedding-manager facade and stays within the repository's existing `typecheck`, `test`, `lint`, and explicit-`any` baseline validation paths.
