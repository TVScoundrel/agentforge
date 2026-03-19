# Epic 09: SOLID Micro-Refactors and Type Boundary Hardening - Story Tasks

## ST-09001: Harden Core Tool Composition Contracts

**Branch:** `fix/st-09001-core-tool-composition-contracts`

### Checklist
- [x] Create branch `fix/st-09001-core-tool-composition-contracts`
  - Created as `codex/fix/st-09001-core-tool-composition-contracts` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #63: https://github.com/TVScoundrel/agentforge/pull/63
- [x] Replace explicit `any`-based contracts in `packages/core/src/tools/composition.ts` with generic/`unknown`-based boundaries
- [x] Refactor composition helpers where needed to keep responsibilities isolated and readable
- [x] Add/update focused tests for composition flows (sequential, parallel, conditional, retry, timeout, cache)
  - `pnpm test --run packages/core/tests/tools/composition.test.ts` -> 9 passed
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09001-core-tool-composition-contracts.md` (`13 -> 0`, overall `385 -> 372`)
- [x] Add or update story documentation at `docs/st09001-core-tool-composition-contracts.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused composition tests in `packages/core/tests/tools/composition.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `147 passed | 16 skipped` files; `2084 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `bcdb705` refactor(st-09001): harden core tool composition typing
  - `e8f3698` docs(st-09001): record validation and move story to in-review
  - `0cd76de` chore(st-09001): finalize checklist and ready status
  - `fbf3c85` fix(st-09001): clear timeout handle after promise race
  - `d0117c3` chore(st-09001): append review-fix commit record
  - `38827fb` docs(st-09001): correct focused test count
- [x] Mark PR Ready only after all story tasks are complete
  - PR #63 marked ready: https://github.com/TVScoundrel/agentforge/pull/63
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #63 on 2026-03-12

---

## ST-09002: Tighten LangChain Converter Runtime Boundary

**Branch:** `fix/st-09002-langchain-converter-boundary-hardening`

### Checklist
- [x] Create branch `fix/st-09002-langchain-converter-boundary-hardening`
  - Created as `codex/fix/st-09002-langchain-converter-boundary-hardening` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #64: https://github.com/TVScoundrel/agentforge/pull/64
- [x] Replace avoidable explicit `any` usage in `packages/core/src/langchain/converter.ts` with generic/`unknown` + narrowing
- [x] Separate schema-conversion and output-serialization responsibilities for clearer module boundaries
- [x] Add/update focused tests for converter behavior and output serialization edge cases
  - `pnpm test --run packages/core/tests/langchain/converter.test.ts` -> `14 passed`
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09002-langchain-converter-boundary-hardening.md` (`15 -> 0`, overall `372 -> 357`)
- [x] Add or update story documentation at `docs/st09002-langchain-converter-boundary-hardening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused converter serialization tests in `packages/core/tests/langchain/converter.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `147 passed | 16 skipped` files; `2087 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `e33273d` refactor(st-09002): harden langchain converter boundary
  - `9297d86` docs(st-09002): record converter boundary progress
  - `b7d145f` docs(st-09002): record validation and move story to in-review
- [x] Mark PR Ready only after all story tasks are complete
  - PR #64 marked ready: https://github.com/TVScoundrel/agentforge/pull/64
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #64 on 2026-03-13

---

## ST-09003: Strengthen LangGraph State Utility Typing

**Branch:** `fix/st-09003-langgraph-state-utility-typing`

### Checklist
- [x] Create branch `fix/st-09003-langgraph-state-utility-typing`
  - Created as `codex/fix/st-09003-langgraph-state-utility-typing` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #65: https://github.com/TVScoundrel/agentforge/pull/65
- [x] Reduce explicit `any` usage in `packages/core/src/langgraph/state.ts` for channel config and helper APIs
- [x] Preserve or improve generic inference for reducer/default/schema combinations
- [x] Add/update focused tests for state validation, default factories, and reducer merge behavior
  - `pnpm test --run packages/core/tests/langgraph/state.test.ts packages/core/tests/langgraph/integration.test.ts` -> `25 passed`
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09003-langgraph-state-utility-typing.md` (`state.ts 13 -> 0`; baseline `357 -> 344`)
- [x] Add or update story documentation at `docs/st09003-langgraph-state-utility-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused inference and reducer fixture updates in `packages/core/tests/langgraph/state.test.ts` and `packages/core/tests/langgraph/integration.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `147 passed | 16 skipped` files; `2088 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `f533eeb` refactor(st-09003): harden langgraph state utility typing
  - `abc515a` docs(st-09003): record state utility typing progress
  - `a4effac` docs(st-09003): record state utility validation progress
  - `f9d2eda` fix(st-09003): enforce state config compatibility
  - `a369e64` fix(st-09003): preserve declared reducer update types
- [x] Mark PR Ready only after all story tasks are complete
  - PR #65 marked ready: https://github.com/TVScoundrel/agentforge/pull/65
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #65 on 2026-03-13

---

## ST-09004: Refine Observability Payload Contracts

**Branch:** `codex/fix/st-09004-observability-payload-contracts`

### Checklist
- [x] Create branch `fix/st-09004-observability-payload-contracts`
  - Created as `codex/fix/st-09004-observability-payload-contracts` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #66: https://github.com/TVScoundrel/agentforge/pull/66
- [x] Introduce shared JSON-safe payload contract(s) for observability code paths
- [x] Reduce explicit `any` usage in `packages/core/src/langgraph/observability/logger.ts` and `packages/core/src/monitoring/alerts.ts`
- [x] Add/update focused tests for typed payload formatting and alert rule execution behavior
  - `pnpm test --run packages/core/tests/langgraph/observability/logger.test.ts packages/core/tests/monitoring/alerts.test.ts` -> `22 passed`
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09004-observability-payload-contracts.md` (`logger.ts 15 -> 0`, `alerts.ts 5 -> 0`, baseline `344 -> 324`)
- [x] Add or update story documentation at `docs/st09004-observability-payload-contracts.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused observability and alert-manager tests in `packages/core/tests/langgraph/observability/logger.test.ts` and `packages/core/tests/monitoring/alerts.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `148 passed | 16 skipped` files; `2093 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `1e94121` refactor(st-09004): harden observability payload contracts
  - `c5e3388` docs(st-09004): record observability payload validation
  - `dd0ec34` chore(st-09004): finalize checklist and ready status
  - `de76d39` fix(st-09004): tighten json-safe observability payloads
  - `f28a7d2` fix(st-09004): preserve async alert api
  - `0e9cb99` fix(st-09004): widen logger payloads and clarify alert dispatch errors
  - `65aa982` fix(st-09004): harden async alert callback and channel typing
  - `980b409` fix(st-09004): tighten alert channel validation
  - `243d3a2` fix(st-09004): guard metrics provider failures
  - `4087073` fix(st-09004): type alert rules against declared channels
  - `5152968` fix(st-09004): isolate alert callback failures
- [x] Mark PR Ready only after all story tasks are complete
  - PR #66 marked ready: https://github.com/TVScoundrel/agentforge/pull/66
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #66 on 2026-03-17

---

## ST-09005: Harden Patterns ReAct Node and Shared Agent Builder Types

**Branch:** `fix/st-09005-patterns-react-builder-typing`

### Checklist
- [x] Create branch `fix/st-09005-patterns-react-builder-typing`
  - Created as `codex/fix/st-09005-patterns-react-builder-typing` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #67: https://github.com/TVScoundrel/agentforge/pull/67
- [x] Reduce explicit `any` usage in `packages/patterns/src/react/nodes.ts` and `packages/patterns/src/shared/agent-builder.ts`
- [x] Extract focused helper(s) for message normalization/state access where it improves SRP and readability
- [x] Add/update focused tests for conditional routing and tool-message construction behavior
  - `pnpm test --run packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/shared/agent-builder.test.ts` -> `13 passed`
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09005-patterns-react-builder-typing.md` (`nodes.ts 10 -> 0`, `agent-builder.ts 9 -> 0`, baseline `324 -> 305`)
- [x] Add or update story documentation at `docs/st09005-patterns-react-builder-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused coverage in `packages/patterns/tests/react/nodes.test.ts` and `packages/patterns/tests/shared/agent-builder.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `149 passed | 16 skipped` files; `2102 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `119eec6` refactor(st-09005): harden react node and builder typing
  - `1a2353a` docs(st-09005): record react builder typing progress
  - `d608445` docs(st-09005): record validation and move story to in-review
  - `f02d050` fix(st-09005): tighten builder schema and tool message validation
  - `7b7d14f` chore(st-09005): append review-fix commit record
  - `5952ef7` fix(st-09005): restore verbose debug gating
  - `bedc74a` fix(st-09005): tighten conditional route mapping types
  - `2bb0250` fix(st-09005): normalize undefined observation results
- [x] Mark PR Ready only after all story tasks are complete
  - PR #67 marked ready: https://github.com/TVScoundrel/agentforge/pull/67
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #67 on 2026-03-18

---

## ST-09006: Modularize ReAct Node Responsibilities

**Branch:** `codex/refactor/st-09006-react-node-modularization`

### Checklist
- [x] Create branch `refactor/st-09006-react-node-modularization`
  - Created as `codex/refactor/st-09006-react-node-modularization` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #68: https://github.com/TVScoundrel/agentforge/pull/68
- [x] Split `packages/patterns/src/react/nodes.ts` into smaller internal modules or helpers with clear reasoning/action/observation responsibilities
- [x] Keep `packages/patterns/src/react/nodes.ts` as the stable public entry point while preserving current exports and runtime behavior
- [x] Add/update focused tests for modularized reasoning, action execution support, and observation formatting flows
  - `pnpm test --run packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/react/deduplication.test.ts packages/patterns/tests/react/agent.test.ts` -> `31 passed`
- [x] Record touched-file explicit-`any` results and before/after module layout in story docs
  - Recorded in `docs/st09006-react-node-modularization.md` (`nodes.ts 454 -> 9` lines; baseline holds at `305`, `patterns 31`)
- [x] Add or update story documentation at `docs/st09006-react-node-modularization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Existing ReAct public-entry tests were re-run against `nodes.ts`, `deduplication`, and `agent` coverage after the module split
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `149 passed | 16 skipped` files; `2104 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `8c67908` refactor(st-09006): split react node responsibilities
  - `b40df7e` docs(st-09006): record modularization progress
  - `e6a39b4` docs(st-09006): record validation and move story to in-review
  - `38e4ae9` fix(st-09006): harden react node serialization and cache lookups
  - `404f908` fix(st-09006): guard react node argument serialization paths
  - `0833e36` fix(st-09006): default scratchpad step for missing iteration
  - `8cc11bd` fix(st-09006): harden duplicate log payloads and branch docs
- [x] Mark PR Ready only after all story tasks are complete
  - PR #68 marked ready: https://github.com/TVScoundrel/agentforge/pull/68
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #68 on 2026-03-18

---

## ST-09007: Modularize ReAct Node Test Suite

**Branch:** `refactor/st-09007-react-node-test-modularization`

### Checklist
- [x] Create branch `refactor/st-09007-react-node-test-modularization`
  - Created as `codex/refactor/st-09007-react-node-test-modularization` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #69: https://github.com/TVScoundrel/agentforge/pull/69
- [x] Reorganize `packages/patterns/tests/react/nodes.test.ts` into smaller test modules or helper layers that mirror the modularized ReAct node responsibilities
- [x] Keep the ReAct node test surface easy to run while preserving current behavior coverage
  - `packages/patterns/tests/react/nodes.test.ts` now remains the single public entrypoint and imports the focused suite modules
- [x] Extract shared test fixtures/helpers where they reduce duplication without obscuring intent
  - Extracted shared helpers into `packages/patterns/tests/react/nodes/helpers.ts`
- [x] Add/update focused tests for modularized reasoning, action execution, and observation formatting flows
  - `pnpm test --run packages/patterns/tests/react/nodes.test.ts packages/patterns/tests/react/deduplication.test.ts packages/patterns/tests/react/agent.test.ts` -> `35 passed`
- [x] Record touched-file explicit-`any` results and before/after test layout in story docs
  - Recorded in `docs/st09007-react-node-test-modularization.md` (`nodes.test.ts 594 -> 3` lines; baseline remains `305/496`, `patterns 31/82`)
- [x] Add or update story documentation at `docs/st09007-react-node-test-modularization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - The split keeps all existing reasoning/action/observation coverage under the public test entrypoint and preserves recent serialization/iteration regressions
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `149 passed | 16 skipped` files; `2108 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `20ac1e0` refactor(st-09007): split react node test suites
  - `8731357` docs(st-09007): record test modularization progress
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
