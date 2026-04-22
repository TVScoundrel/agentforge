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

**Branch:** `codex/refactor/st-09007-react-node-test-modularization`

### Checklist
- [x] Create branch `codex/refactor/st-09007-react-node-test-modularization`
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
  - `168ab83` docs(st-09007): record validation and move story to in-review
  - `92a4dd2` fix(st-09007): repair review tracker formatting
  - `631f28a` test(st-09007): assert human fallback for missing tool call id
  - `ed6608d` docs(st-09007): align test doc and branch references
  - `ae08aaa` test(st-09007): normalize base state helper defaults
  - `c819c87` docs(st-09007): remove brittle test layout line counts
  - `e3a8c21` fix(st-09007): tighten human fallback assertion and branch label
- [x] Mark PR Ready only after all story tasks are complete
  - PR #69 marked ready: https://github.com/TVScoundrel/agentforge/pull/69
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #69 on 2026-03-20

---

## ST-09008: Harden Parallel Workflow Builder Typing

**Branch:** `codex/fix/st-09008-parallel-workflow-builder-typing`

### Checklist
- [x] Create branch `fix/st-09008-parallel-workflow-builder-typing`
  - Created as `codex/fix/st-09008-parallel-workflow-builder-typing` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - Draft PR #70: https://github.com/TVScoundrel/agentforge/pull/70
- [x] Remove avoidable `any` and `@ts-expect-error` usage from `packages/core/src/langgraph/builders/parallel.ts`
  - Replaced `any` schema input with `AnnotationRoot`/`StateDefinition` generics and removed `@ts-expect-error`/`as any` edge wiring
- [x] Preserve current fan-out/fan-in runtime behavior while tightening state schema, node registration, and edge wiring contracts
  - Verified via focused typecheck/tests plus direct edge assertions for parallel fan-out, aggregate fan-in, and `autoStartEnd: false`
- [x] Add/update focused tests for duplicate-node validation, auto start/end wiring, and aggregate fan-in behavior
  - Updated `packages/core/tests/langgraph/builders/parallel.test.ts` to cover direct edge wiring and aggregate fan-in contracts
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - `packages/core/src/langgraph/builders/parallel.ts`: `9 -> 0`; baseline `304 -> 295`, `core 128 -> 119`
- [x] Add or update story documentation at `docs/st09008-parallel-workflow-builder-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Focused test coverage updated in `packages/core/tests/langgraph/builders/parallel.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `150 passed | 16 skipped` files; `2110 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `cb664a3` refactor(st-09008): harden parallel workflow builder typing
  - `ff6ea5e` docs(st-09008): record parallel builder typing progress
  - `2fa17b8` docs(st-09008): record validation and move story to in-review
  - `d4b2b18` fix(st-09008): derive parallel workflow state from schema
  - `182f525` fix(st-09008): tighten parallel update contracts
  - `65a9c50` fix(st-09008): restore deprecated parallel name option
- [x] Mark PR Ready only after all story tasks are complete
  - PR #70 marked ready: https://github.com/TVScoundrel/agentforge/pull/70
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #70 on 2026-03-22

---

## ST-09009: Tighten Ask-Human Interrupt Boundary

**Branch:** `codex/fix/st-09009-ask-human-interrupt-boundary-hardening`

### Checklist
- [x] Create branch `codex/fix/st-09009-ask-human-interrupt-boundary-hardening`
- [x] Create draft PR with story ID in title
- [x] Remove avoidable `any` usage from `packages/tools/src/agent/ask-human/tool.ts` around dynamic LangGraph import and interrupt handling
- [x] Preserve current ask-human runtime behavior while improving interrupt availability and compatibility checks
- [x] Add/update focused tests for missing LangGraph dependency handling, interrupt responses, and timeout/default-response behavior
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09009-ask-human-interrupt-boundary-hardening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch

Implementation notes:
- `fec8ad1` `fix(st-09009): harden ask-human interrupt boundary`
- `d1f5dd2` `docs(st-09009): record ask-human boundary progress`
- `6d8ca5a` `fix(st-09009): tighten ask-human review fixes`
- `f3b7e10` `fix(st-09009): type interrupt response boundary`
- `300e610` `test(st-09009): cover nullish interrupt resumes`
- Draft PR #71: https://github.com/TVScoundrel/agentforge/pull/71
- Focused validation passed:
  - `pnpm exec tsc -p packages/tools/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/tools/src/agent/ask-human/tool.ts packages/tools/tests/agent/ask-human-boundary.test.ts packages/tools/tests/agent/ask-human.test.ts`
  - `pnpm test --run packages/tools/tests/agent/ask-human.test.ts packages/tools/tests/agent/ask-human-boundary.test.ts packages/tools/tests/agent/ask-human-react.integration.test.ts packages/tools/tests/agent/ask-human-plan-execute.integration.test.ts`
- Full validation passed:
  - `pnpm test --run` -> `151 passed | 16 skipped` files; `2114 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0` (warnings only)
- PR #71 marked ready after final tracker/body refresh
- Merged via PR #71 on 2026-03-23

---

## ST-09010: Strengthen Plan-Execute Agent Routing Typing

**Branch:** `codex/fix/st-09010-plan-execute-routing-typing`

### Checklist
- [x] Create branch `codex/fix/st-09010-plan-execute-routing-typing`
- [x] Create draft PR with story ID in title
- [x] Remove avoidable `as any` usage from `packages/patterns/src/plan-execute/agent.ts` around route callbacks and compile return handling
- [x] Preserve current planner/executor/replanner/finisher routing behavior while tightening route typing
- [x] Add/update focused tests for executor/replanner route decisions and compiled agent invocation behavior
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09010-plan-execute-routing-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch

Implementation notes:
- `12b06fe` `refactor(st-09010): tighten plan-execute routing typing`
- Draft PR #72: https://github.com/TVScoundrel/agentforge/pull/72
- Focused validation passed:
  - `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/patterns/src/plan-execute/agent.ts packages/patterns/tests/plan-execute/agent.test.ts`
  - `pnpm test --run packages/patterns/tests/plan-execute/agent.test.ts packages/patterns/tests/plan-execute/integration.test.ts`
  - `pnpm lint:explicit-any:baseline`
- Full validation passed:
  - `pnpm test --run` -> `152 passed | 16 skipped` files; `2119 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0` (warnings only)
- PR #72 marked ready after final tracker/body refresh
- Review fix applied after PR feedback
- Merged via PR #72 on 2026-03-23

---

## ST-09011: Tighten Explicit-`any` Baseline Caps

**Branch:** `codex/chore/st-09011-explicit-any-baseline-tightening`

### Checklist
- [x] Create branch `codex/chore/st-09011-explicit-any-baseline-tightening`
- [x] Create draft PR with story ID in title
- [x] Update `scripts/no-explicit-any-baseline.json` to the current improved total and per-package warning caps
- [x] Verify `pnpm lint:explicit-any:baseline` passes locally with the tightened counts and record the command output
- [x] Record before/after baseline cap values and rationale in story docs
- [x] Add or update story documentation at `docs/st09011-explicit-any-baseline-tightening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch

Implementation notes:
- `40e6417` `chore(st-09011): tighten explicit-any baseline caps`
- Draft PR #73: https://github.com/TVScoundrel/agentforge/pull/73
- Focused validation passed:
  - `pnpm lint:explicit-any:baseline` -> `289/289` warnings
  - Per-package caps: `cli 24/24`, `core 119/119`, `patterns 28/28`, `skills 0/0`, `testing 51/51`, `tools 67/67`
- Test impact: no new automated tests were added because this story only tightens the existing lint-baseline data file; coverage comes from the baseline command plus full-suite/lint verification
- Full validation passed:
  - `pnpm test --run` -> `152 passed | 16 skipped` files; `2119 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0` (warnings only)
- PR #73 marked ready after final tracker/body refresh
- Merged via PR #73 on 2026-03-23 (merge commit `90c93df`)

---

## ST-09012: Remove Package Export-Map Build Warnings

**Branch:** `codex/fix/st-09012-package-export-map-warning-cleanup`

### Checklist
- [x] Create branch `codex/fix/st-09012-package-export-map-warning-cleanup`
- [x] Create draft PR with story ID in title
- [x] Remove the current `exports.types` ordering build warnings from `packages/skills/package.json`, `packages/tools/package.json`, and `packages/testing/package.json`
- [x] Preserve published import/require/types resolution behavior for the touched packages
- [x] Add/update focused validation for package builds and smoke-level resolution checks
- [x] Record removed warnings and package-metadata rationale in story docs
- [x] Add or update story documentation at `docs/st09012-package-export-map-warning-cleanup.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch

Implementation notes:
- Branch created from `main` on 2026-03-23: `codex/fix/st-09012-package-export-map-warning-cleanup`
- Draft PR #74: https://github.com/TVScoundrel/agentforge/pull/74
- Focused validation passed:
  - `pnpm --filter @agentforge/skills build`
  - `pnpm --filter @agentforge/tools build`
  - `pnpm --filter @agentforge/testing build`
  - CJS/ESM smoke imports passed for `@agentforge/skills` and `@agentforge/tools`
  - `pnpm exec tsc --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck --noEmit <temp>/index.ts`
  - disposable Vitest smoke test passed for `@agentforge/testing`
- Test impact: no committed automated tests were added because this story only changes package metadata ordering; focused build and consumer-entrypoint smoke checks cover the regression surface more directly than repository test additions
- Full validation passed:
  - `pnpm test --run` -> `152 passed | 16 skipped` files; `2119 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0` (warnings only)
- PR #74 marked ready after final tracker/body refresh
- Review fix: `75e4935` `docs(st-09012): align review-state tracker wording`
- Review fix: pending terminology clarification for `types` resolution wording
- Review fix: pending `pnpm exec vitest` wording alignment in story doc validation list
- Review fix: `f74c82f` `docs(st-09012): clarify types export resolution wording`
- Review fix: `cf6b99e` `docs(st-09012): align vitest command wording`
- Merged via PR #74 on 2026-03-23 (merge commit `42447ab`)

---

## ST-09013: Harden Sequential Workflow Builder Typing

**Branch:** `fix/st-09013-sequential-workflow-builder-typing`

### Checklist
- [x] Create branch `fix/st-09013-sequential-workflow-builder-typing`
  - Created as `codex/fix/st-09013-sequential-workflow-builder-typing` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - Draft PR #75: https://github.com/TVScoundrel/agentforge/pull/75
- [x] Remove avoidable `any` usage from `packages/core/src/langgraph/builders/sequential.ts` around schema, state, and edge wiring
  - Replaced the broad schema/state generics with `AnnotationRoot`/`StateDefinition`/`UpdateType`-driven typing and removed `START`/`END` `as any` edges
- [x] Preserve current sequential runtime behavior while deriving state/update typing from the supplied schema
  - Sequential execution order, `autoStartEnd`, and the public `name` option remain compatible; only the localized `addNode()` interop cast remains
- [x] Add/update focused tests for start/intermediate/end edge wiring and schema-derived workflow typing behavior
  - `packages/core/tests/langgraph/builders/sequential.test.ts` now covers schema-driven inference plus direct edge assertions for `autoStartEnd: true|false`
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09013-sequential-workflow-builder-typing.md` (`packages/core/src/langgraph/builders/sequential.ts`: `8 -> 0`; baseline `289 -> 281`, `core 119 -> 111`)
- [x] Add or update story documentation at `docs/st09013-sequential-workflow-builder-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Expanded automated coverage in `packages/core/tests/langgraph/builders/sequential.test.ts`; no manual-only gap remains for the changed surface
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `152 passed | 16 skipped` files; `2123 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `e48144c` `refactor(st-09013): harden sequential workflow builder typing`
  - `9257799` `docs(st-09013): record validation and move story to in-review`
  - `c214b95` `chore(st-09013): finalize checklist and ready status`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #75 marked ready: https://github.com/TVScoundrel/agentforge/pull/75
- [x] Wait for merge; do not merge directly from local branch
  - Review fix: `dc65894` `fix(st-09013): preserve sequential builder compatibility typing`
  - Review fix: `d24eeeb` `fix(st-09013): guard legacy sequential schema compatibility`
  - Review fix: `99ffe35` `fix(st-09013): remove legacy sequential state overload`
  - Review fix: `2ec4f9a` `fix(st-09013): bind sequential workflow typing to schema`
  - Review fix: `a45bfdb` `fix(st-09013): rethrow invalid sequential schema errors`
  - Review fix: `cc3f75b` `fix(st-09013): update sequential builder example usage`
  - Merged via PR #75 on 2026-03-23 (merge commit `cabf341`)

---

## ST-09014: Tighten Plan-Execute Shared Type Boundaries

**Branch:** `fix/st-09014-plan-execute-shared-type-boundaries`

### Checklist
- [x] Create branch `fix/st-09014-plan-execute-shared-type-boundaries`
  - Created as `codex/fix/st-09014-plan-execute-shared-type-boundaries` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - Draft PR #76: https://github.com/TVScoundrel/agentforge/pull/76
- [x] Remove broad tool/schema `any` boundaries from `packages/patterns/src/plan-execute/types.ts` and adjacent shared contracts as needed
  - Replaced `Tool<any, any>[]` with the exported `PlanExecuteTool` runtime contract, generic executor/agent config typing, `PlanStepArguments`/`PlanStepResult` aliases, and a single executor-side invocation seam
- [x] Preserve current planner/executor/replanner compatibility while tightening shared type inference
  - Planner, executor, replanner, and finisher runtime flows remain unchanged; only the shared type surfaces and schema helper typings were narrowed
- [x] Add/update focused tests for type-driven plan-execute configuration and execution flows
  - Added `packages/patterns/src/plan-execute/contracts.typecheck.ts` for source-included config inference coverage and expanded `packages/patterns/tests/plan-execute/state.test.ts` for schema compatibility
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09014-plan-execute-shared-type-boundaries.md` (`types.ts`: `1 -> 0`, `nodes.ts`: `1 -> 0`; baseline `289 -> 278`, `patterns 28 -> 25`)
- [x] Add or update story documentation at `docs/st09014-plan-execute-shared-type-boundaries.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused automated coverage; no manual-only gap remains for the changed surface
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `152 passed | 16 skipped` files; `2126 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `f5caf74` `refactor(st-09014): tighten plan-execute shared contracts`
  - `a3168aa` `docs(st-09014): record plan-execute contract progress`
- [x] Mark PR Ready only after all story tasks are complete
  - `84e499d` `docs(st-09014): record validation and move story to in-review`
  - PR #76 marked ready: https://github.com/TVScoundrel/agentforge/pull/76
- [x] Review fixes applied on the active PR branch
  - `9d1ea7c` `fix(st-09014): clean touched plan-execute warnings`
  - `9915726` `chore(st-09014): add plan-execute node modularization follow-up`
  - `d057c3c` `fix(st-09014): preserve bound tool invocation and valid typecheck fixture`
  - `3787bf1` `fix(st-09014): warn on unsupported plan-execute options`
  - `e6e03f2` `fix(st-09014): restore plan-execute warning spies and trim brittle docs`
  - `c18df1a` `docs(st-09014): clean kanban separators and baseline note`
  - `350a2bc` `fix(st-09014): make plan-execute tool boundary callable`
  - `224514d` `fix(st-09014): clear executor step timeout handles`
  - `17cd270` `docs(st-09014): align replanner threshold contract notes`
  - `a781d91` `test(st-09014): stabilize logger-mock lookup by name`
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #76 on 2026-03-24 (merge commit `5913b74`)

---

## ST-09015: Modularize Multi-Agent Node Responsibilities

**Branch:** `codex/refactor/st-09015-multi-agent-node-modularization`

### Checklist
- [x] Create branch `codex/refactor/st-09015-multi-agent-node-modularization`
- [x] Create draft PR with story ID in title
  - Draft PR #77: https://github.com/TVScoundrel/agentforge/pull/77
- [x] Split `packages/patterns/src/multi-agent/nodes.ts` into smaller modules or helper layers that mirror major node responsibilities
  - Split the implementation into `nodes/supervisor.ts`, `nodes/worker.ts`, `nodes/aggregator.ts`, and `nodes/shared.ts`
- [x] Preserve the public multi-agent node entrypoint and current runtime behavior after the split
  - `packages/patterns/src/multi-agent/nodes.ts` remains the stable public export surface and focused multi-agent tests still exercise the public entrypoint
- [x] Extract shared helpers where they reduce duplication without obscuring routing and handoff flow
  - Shared helpers now centralize ID generation, assignment lookup, tool conversion, and content serialization without moving routing decisions out of the supervisor module
- [x] Add/update focused tests for coordinator routing, handoff behavior, and node-level error handling
  - Updated `packages/patterns/tests/multi-agent/nodes.test.ts` and added a worker handoff-state preservation regression while preserving coordinator and error-path coverage
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09015-multi-agent-node-modularization.md` (`nodes.ts`: `2 -> 0`; baseline `278 -> 276`, `patterns 25 -> 23`)
- [x] Add or update story documentation at `docs/st09015-multi-agent-node-modularization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused automated coverage; no manual-only gap remains for the changed surface
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `152 passed | 16 skipped` files; `2130 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `6ee3aa1` `refactor(st-09015): split multi-agent node responsibilities`
  - `9c7ce17` `docs(st-09015): record multi-agent modularization progress`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #77 marked ready: https://github.com/TVScoundrel/agentforge/pull/77
- [x] Review fixes applied on the active PR branch
  - `367ee55` `fix(st-09015): remove sensitive multi-agent log previews`
  - `1863fa8` `fix(st-09015): remove multi-agent debug content previews`
  - `5d68246` `docs(st-09015): restore public multi-agent node contracts`
  - `e6fd074` `fix(st-09015): harden worker workload guards`
  - `e9b7d5c` `fix(st-09015): rethrow multi-agent graph interrupts`
  - `963fc60` `fix(st-09015): fail on invalid multi-agent model content`
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #77 on 2026-03-25 (merge commit `3d5ac9a`)

---

## ST-09016: Harden Monitoring Audit and Health Payload Types

**Branch:** `codex/fix/st-09016-monitoring-payload-type-hardening`

### Checklist
- [x] Create branch `codex/fix/st-09016-monitoring-payload-type-hardening`
- [x] Create draft PR with story ID in title
  - PR #78 (draft): https://github.com/TVScoundrel/agentforge/pull/78
- [x] Replace broad payload `any` fields in `packages/core/src/monitoring/audit.ts` and `packages/core/src/monitoring/health.ts` with safer contracts
- [x] Preserve current monitoring runtime behavior and public compatibility while tightening audit/health payload typing
- [x] Add/update focused tests for audit event serialization and health metadata handling
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09016-monitoring-payload-type-hardening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `153 passed | 16 skipped` files; `2137 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `c4d11f6` `fix(st-09016): harden monitoring payload contracts`
  - `388e2be` `docs(st-09016): record validation and move story to in-review`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #78 marked ready: https://github.com/TVScoundrel/agentforge/pull/78
- [x] Review fixes applied on the active PR branch
  - `a894d45` `fix(st-09016): preserve explicit falsy audit payloads`
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #78 on 2026-03-26 (merge commit `fe02e2b`)

---

## ST-09017: Centralize CLI Command Error Handling

**Branch:** `codex/refactor/st-09017-cli-error-handling-centralization`

### Checklist
- [x] Create branch `codex/refactor/st-09017-cli-error-handling-centralization`
- [x] Create draft PR with story ID in title
  - PR #79 (draft): https://github.com/TVScoundrel/agentforge/pull/79
- [x] Consolidate repeated command-level error formatting and exit handling in `packages/cli/src/commands/**`
- [x] Preserve current CLI user-visible behavior and exit codes while reducing repetitive `catch (error: any)` usage
- [x] Add/update focused tests for shared command error handling where the existing CLI test surface supports it
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09017-cli-error-handling-centralization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `154 passed | 16 skipped` files; `2146 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `af0dbac` `refactor(st-09017): centralize cli command error handling`
  - `ab45437` `docs(st-09017): record validation and move story to in-review`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #79 marked ready: https://github.com/TVScoundrel/agentforge/pull/79
- [x] Review fixes applied on the active PR branch
  - `399d76d` `fix(st-09017): preserve cli error output ordering`
  - `0f54f57` `fix(st-09017): fail publish spinner before npm guidance`
  - `f1aa02d` `fix(st-09017): tighten command error helper contract`
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #79 on 2026-03-27 (merge commit `94d4d99`)

---

## ST-09018: Harden Testing Assertion and State Builder Helpers

**Branch:** `codex/fix/st-09018-testing-helper-type-hardening`

### Checklist
- [x] Create branch `codex/fix/st-09018-testing-helper-type-hardening`
- [x] Create draft PR with story ID in title
  - Draft PR #80 created: https://github.com/TVScoundrel/agentforge/pull/80
- [x] Replace broad `any`-based helper signatures in `packages/testing/src/helpers/assertions.ts` and `packages/testing/src/helpers/state-builder.ts` with safer generic or unknown-first contracts
- [x] Preserve practical helper ergonomics for common agent/message/state test setup flows
- [x] Add/update focused tests for touched helper behavior and contract expectations
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09018-testing-helper-type-hardening.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `155 passed | 16 skipped` files; `2151 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `d313668` `fix(st-09018): harden testing helper contracts`
  - `2982e47` `docs(st-09018): record validation and move story to in-review`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #80 marked ready: https://github.com/TVScoundrel/agentforge/pull/80
- [x] Review fixes applied on the active PR branch
  - `8141fe3` `fix(st-09018): tighten helper review contracts`
  - `e189e44` `fix(st-09018): narrow helper field key assertions`
  - `c02daf1` `fix(st-09018): initialize empty conversation state`
  - `0ca161a` `fix(st-09018): support cross-package message assertions`
  - `a1612eb` `fix(st-09018): narrow asserted message typing`
  - `2a5706d` `fix(st-09018): widen asserted message type coverage`
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #80: https://github.com/TVScoundrel/agentforge/pull/80
  - Merge commit: `7d195eb`

---

## ST-09019: Harden Reflection Agent Routing Typing

**Branch:** `codex/fix/st-09019-reflection-agent-routing-typing`

### Checklist
- [x] Create branch `codex/fix/st-09019-reflection-agent-routing-typing`
- [x] Create draft PR with story ID in title
  - Draft PR #81 created: https://github.com/TVScoundrel/agentforge/pull/81
- [x] Remove avoidable route/compile `as any` usage from `packages/patterns/src/reflection/agent.ts`
- [x] Preserve current reflection generator/reflector/reviser/completion routing behavior while tightening route typing
- [x] Add/update focused tests for route decisions and compiled agent invocation behavior
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09019-reflection-agent-routing-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2160 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only (`0` errors)
- [x] Commit completed checklist items as logical commits and push updates
  - `8553a62` `refactor(st-09019): tighten reflection routing typing`
  - `ac82aa4` `docs(st-09019): record validation and move story to in-review`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #81 marked ready: https://github.com/TVScoundrel/agentforge/pull/81
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #81: https://github.com/TVScoundrel/agentforge/pull/81
  - Merge commit: `fd8f0ef`

---

## ST-09020: Tighten Prompt Loader Variable Contracts

**Branch:** `fix/st-09020-prompt-loader-variable-contracts`

### Checklist
- [x] Create branch `fix/st-09020-prompt-loader-variable-contracts`
- [x] Create draft PR with story ID in title
  - Draft PR #82: https://github.com/TVScoundrel/agentforge/pull/82
- [x] Replace broad variable-map `any` usage in `packages/core/src/prompt-loader/index.ts` with safer contracts
- [x] Preserve current sanitize/render/load behavior for trusted and untrusted variables
- [x] Add/update focused tests for variable rendering, escaping, and fallback behavior
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09020-prompt-loader-variable-contracts.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added/updated automated tests in `packages/core/tests/prompt-loader/index.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2163 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `2415bf6` `fix(st-09020): tighten prompt loader variable contracts`
  - `3d0f75d` `docs(st-09020): record validation and move story to in-review`
  - `a23e829` `fix(st-09020): harden prompt variable map handling`
  - `ae17ea5` `fix(st-09020): use own-property prompt option detection`
  - `b6ece8d` `docs(st-09020): document own-enumerable prompt compatibility`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #82 marked ready: https://github.com/TVScoundrel/agentforge/pull/82
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #82: https://github.com/TVScoundrel/agentforge/pull/82
  - Merge commit: `e84c425`

---

## ST-09021: Harden Streaming WebSocket and Message Contracts

**Branch:** `fix/st-09021-streaming-websocket-contracts`

### Checklist
- [x] Create branch `fix/st-09021-streaming-websocket-contracts`
- [x] Create draft PR with story ID in title
- [x] Replace broad socket/message/data `any` boundaries in `packages/core/src/streaming/websocket.ts` and adjacent streaming types
- [x] Preserve current WebSocket handler, send, parse, and broadcast behavior
- [x] Add/update focused tests for message parsing, error handling, and broadcast behavior
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09021-streaming-websocket-contracts.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch

### Notes

- Created branch: `fix/st-09021-streaming-websocket-contracts` (workspace branch: `codex/fix/st-09021-streaming-websocket-contracts`)
- Draft PR: #83 `fix(st-09021): harden streaming websocket and message contracts`
- Implementation commit: `7c29f09` `fix(st-09021): harden streaming websocket contracts`
- Validation:
  - `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/core/src/streaming/websocket.ts packages/core/src/streaming/types.ts packages/core/src/streaming/index.ts packages/core/src/streaming/__tests__/websocket.test.ts`
  - `pnpm test --run packages/core/src/streaming/__tests__/websocket.test.ts` -> `1 passed` file, `17 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `205/289` warnings, `core 82/119`
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2166 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only
- Review fix commit: `b83a17d` `fix(st-09021): tighten websocket review fixes`
- Review fix commit: `7f53266` `fix(st-09021): soften heartbeat capability errors`
- Review fix commit: `3957a3f` `fix(st-09021): widen websocket raw payload typing`
- Merged PR: #83
- Merge commit: `87885d1`

---

## ST-09022: Harden Shared Deduplication Utility Contracts

**Branch:** `fix/st-09022-shared-deduplication-contracts`

### Checklist
- [x] Create branch `fix/st-09022-shared-deduplication-contracts`
- [x] Create draft PR with story ID in title
- [x] Replace broad normalization and cache-key `any` boundaries in `packages/patterns/src/shared/deduplication.ts`
- [x] Preserve current deduplication metrics, cache-key generation, and logging behavior
- [x] Add/update focused tests for normalization, cache-key generation, and metrics helpers
- [x] Record explicit-`any` warning deltas for touched files in story docs
- [x] Add or update story documentation at `docs/st09022-shared-deduplication-contracts.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [x] Run full test suite before finalizing the PR and record results
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
- [x] Commit completed checklist items as logical commits and push updates
- [x] Mark PR Ready only after all story tasks are complete
- [x] Wait for merge; do not merge directly from local branch

### Notes

- Created branch: `fix/st-09022-shared-deduplication-contracts` (workspace branch: `codex/fix/st-09022-shared-deduplication-contracts`)
- Draft PR: #84 `fix(st-09022): harden shared deduplication utility contracts`
- Implementation commit: `52b6bf0` `fix(st-09022): harden shared deduplication contracts`
- Validation:
  - `pnpm exec eslint packages/patterns/src/shared/deduplication.ts packages/patterns/tests/shared/deduplication.test.ts`
  - `pnpm exec tsc -p packages/patterns/tsconfig.json --noEmit`
  - `pnpm test --run packages/patterns/tests/shared/deduplication.test.ts` -> `1 passed` file, `13 passed` tests
  - `pnpm test --run packages/patterns/tests/react/deduplication.test.ts packages/patterns/tests/plan-execute/deduplication.test.ts packages/patterns/tests/shared/deduplication.test.ts` -> `3 passed` files, `25 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `201/289` warnings, `patterns 15/28`
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2170 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only
- Merged PR: #84
- Merge commit: `82aad8e`

---

## ST-09023: Tighten Core Tool Builder Fluent Typing

**Branch:** `fix/st-09023-tool-builder-fluent-typing`

### Checklist
- [x] Create branch `fix/st-09023-tool-builder-fluent-typing`
  - Created as `codex/fix/st-09023-tool-builder-fluent-typing` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #85: https://github.com/TVScoundrel/agentforge/pull/85
- [x] Remove avoidable `(this as any)` seams from `packages/core/src/tools/builder.ts`
- [x] Preserve current fluent builder ergonomics and built-tool behavior
- [x] Add/update focused tests for schema/invoke chaining and built tool execution behavior
  - `pnpm test --run packages/core/tests/tools/builder.test.ts` -> `1 passed` file, `34 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09023-tool-builder-fluent-typing.md` (`6 -> 0`, overall `201 -> 195`)
- [x] Add or update story documentation at `docs/st09023-tool-builder-fluent-typing.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added `packages/core/src/tools/builder.typecheck.ts` plus focused chaining/execution coverage in `packages/core/tests/tools/builder.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2173 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `cf48e04` `refactor(st-09023): tighten tool builder fluent typing`
  - `458a30a` `docs(st-09023): record validation and move story to in-review`
  - `2313ad6` `fix(st-09023): isolate typed builder metadata state`
  - `2713cb0` `chore(st-09023): append review-fix commit record`
  - `eca1873` `fix(st-09023): deep-clone builder example metadata`
  - `735c106` `chore(st-09023): append review-fix commit record`
  - `fc53972` `fix(st-09023): preserve builder invoke compatibility`
  - `da8a920` `docs(st-09023): fix builder jsdoc indentation`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #85 marked ready: https://github.com/TVScoundrel/agentforge/pull/85
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #85 on 2026-04-07 (merge commit `cba76db`)

---

## ST-09024: Tighten LangGraph Interrupt Type Contracts

**Branch:** `fix/st-09024-langgraph-interrupt-type-contracts`

### Checklist
- [x] Create branch `fix/st-09024-langgraph-interrupt-type-contracts`
  - Created as `codex/fix/st-09024-langgraph-interrupt-type-contracts` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #86: https://github.com/TVScoundrel/agentforge/pull/86
- [x] Replace broad payload boundaries in `packages/core/src/langgraph/interrupts/types.ts` with safer interrupt/resume contracts
- [x] Preserve current human-request, approval, custom interrupt, and resume-command compatibility
- [x] Add/update focused tests for touched interrupt type helpers or adjacent runtime consumers as needed
  - `pnpm test --run packages/core/tests/langgraph/interrupts/utils.test.ts packages/core/tests/streaming/human-in-loop.test.ts` -> `2 passed` files, `20 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09024-langgraph-interrupt-type-contracts.md` (`types.ts 10 -> 0`, `utils.ts 3 -> 0`, overall `195 -> 182`)
- [x] Add or update story documentation at `docs/st09024-langgraph-interrupt-type-contracts.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added `packages/core/src/langgraph/interrupts/contracts.typecheck.ts` plus focused interrupt utility coverage in `packages/core/tests/langgraph/interrupts/utils.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2178 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `82d7ca6` `fix(st-09024): tighten langgraph interrupt contracts`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #86 marked ready: https://github.com/TVScoundrel/agentforge/pull/86
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #86 on 2026-04-07 (merge commit `08978b8`)

### Notes

- Created branch: `fix/st-09024-langgraph-interrupt-type-contracts` (workspace branch: `codex/fix/st-09024-langgraph-interrupt-type-contracts`)
- Draft PR: #86 `fix(st-09024): tighten langgraph interrupt type contracts`
- Implementation commit: `82d7ca6` `fix(st-09024): tighten langgraph interrupt contracts`
- Validation:
  - `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/core/src/langgraph/interrupts/types.ts packages/core/src/langgraph/interrupts/utils.ts packages/core/src/langgraph/interrupts/contracts.typecheck.ts packages/core/tests/langgraph/interrupts/utils.test.ts`
  - `pnpm test --run packages/core/tests/langgraph/interrupts/utils.test.ts packages/core/tests/streaming/human-in-loop.test.ts` -> `2 passed` files, `20 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `182/289` warnings, `core 63/119`
  - `pnpm test --run` -> `156 passed | 16 skipped` files; `2178 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only
- Merged PR: #86
- Merge commit: `08978b8`

---

## ST-09025: Extract Tool Registry Collection and Search Operations

**Branch:** `refactor/st-09025-tool-registry-collection-search-extraction`

### Checklist
- [x] Create branch `refactor/st-09025-tool-registry-collection-search-extraction`
  - Created as `codex/refactor/st-09025-tool-registry-collection-search-extraction` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #87: https://github.com/TVScoundrel/agentforge/pull/87
- [x] Extract collection and search responsibilities from `packages/core/src/tools/registry.ts`
- [x] Preserve current `getAll`, category/tag filter, and text-search behavior
- [x] Add/update focused tests for extracted collection and search behavior
  - `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts` -> `2 passed` files, `46 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09025-tool-registry-collection-search-extraction.md` (`registry.ts 8 -> 8`, overall `182 -> 182`)
- [x] Add or update story documentation at `docs/st09025-tool-registry-collection-search-extraction.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused helper coverage in `packages/core/tests/tools/registry-collection.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `157 passed | 16 skipped` files; `2181 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `2964a48` `refactor(st-09025): extract registry collection and search helpers`
  - `232c0d9` `docs(st-09025): record validation and move story to in-review`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #87 marked ready: https://github.com/TVScoundrel/agentforge/pull/87
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #87 on 2026-04-08 (merge commit `fbb6498`)

### Notes

- Created branch: `refactor/st-09025-tool-registry-collection-search-extraction` (workspace branch: `codex/refactor/st-09025-tool-registry-collection-search-extraction`)
- Draft PR: #87 `refactor(st-09025): extract registry collection and search operations`
- Implementation commit: `2964a48` `refactor(st-09025): extract registry collection and search helpers`
- Validation:
  - `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/registry-collection.ts packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts`
  - `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts` -> `2 passed` files, `46 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `182/289` warnings, `core 63/119`
  - `pnpm test --run` -> `157 passed | 16 skipped` files; `2181 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only
- Merged PR: #87
- Merge commit: `fbb6498`

---

## ST-09026: Modularize Tool Registry Prompt Rendering and Event Paths

**Branch:** `refactor/st-09026-tool-registry-prompt-event-modularization`

### Checklist
- [x] Create branch `refactor/st-09026-tool-registry-prompt-event-modularization`
  - Created as `codex/refactor/st-09026-tool-registry-prompt-event-modularization` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #88: https://github.com/TVScoundrel/agentforge/pull/88
- [x] Extract prompt-rendering and event-emission responsibilities from `packages/core/src/tools/registry.ts`
- [x] Preserve current prompt-generation, LangChain conversion, and registry event behavior
- [x] Add/update focused tests for prompt rendering and event behavior after the split
  - `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts packages/core/tests/tools/registry-events.test.ts packages/core/tests/tools/registry-prompt.test.ts` -> `4 passed` files, `50 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09026-tool-registry-prompt-event-modularization.md` (`registry.ts 8 -> 8`, overall `182 -> 182`)
- [x] Add or update story documentation at `docs/st09026-tool-registry-prompt-event-modularization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused helper coverage in `packages/core/tests/tools/registry-events.test.ts` and `packages/core/tests/tools/registry-prompt.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `159 passed | 16 skipped` files; `2185 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `86a3842` `refactor(st-09026): extract registry prompt and event helpers`
  - `44b24ff` `docs(st-09026): record progress and move story to in-progress`
  - `42eab78` `docs(st-09026): record validation and move story to in-review`
  - `d4e7b71` `chore(st-09026): finalize checklist and ready status`
  - `8a354da` `fix(st-09026): filter prompt categories from active set`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #88 marked ready: https://github.com/TVScoundrel/agentforge/pull/88
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #88 on 2026-04-09 (merge commit `6682cad`)

### Notes

- Created branch: `refactor/st-09026-tool-registry-prompt-event-modularization` (workspace branch: `codex/refactor/st-09026-tool-registry-prompt-event-modularization`)
- Draft PR: #88 `refactor(st-09026): modularize tool registry prompt rendering and event paths`
- Merged PR: #88
- Merge commit: `6682cad`
- Validation so far:
  - `pnpm exec tsc -p packages/core/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/core/src/tools/registry.ts packages/core/src/tools/registry-collection.ts packages/core/src/tools/registry-events.ts packages/core/src/tools/registry-prompt.ts packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts packages/core/tests/tools/registry-events.test.ts packages/core/tests/tools/registry-prompt.test.ts`
  - `pnpm test --run packages/core/tests/tools/registry.test.ts packages/core/tests/tools/registry-collection.test.ts packages/core/tests/tools/registry-events.test.ts packages/core/tests/tools/registry-prompt.test.ts` -> `4 passed` files, `50 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `182/289` warnings, `core 63/119`
  - `pnpm test --run` -> `159 passed | 16 skipped` files; `2185 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only

---

## ST-09027: Extract Connection Manager Vendor Initialization Adapters

**Branch:** `refactor/st-09027-connection-manager-vendor-initialization-extraction`

### Checklist
- [x] Create branch `refactor/st-09027-connection-manager-vendor-initialization-extraction`
  - Created as `codex/refactor/st-09027-connection-manager-vendor-initialization-extraction` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #89: https://github.com/TVScoundrel/agentforge/pull/89
- [x] Extract PostgreSQL/MySQL/SQLite initialization and pool-configuration logic from `packages/tools/src/data/relational/connection/connection-manager.ts`
- [x] Preserve current vendor initialization behavior and validation
- [x] Add/update focused tests for vendor initialization and pool configuration behavior
  - `pnpm test --run packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts` -> `2 passed` files, `49 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09027-connection-manager-vendor-initialization-extraction.md` (`connection-manager.ts 2 -> 2`, overall `182 -> 180`)
- [x] Add or update story documentation at `docs/st09027-connection-manager-vendor-initialization-extraction.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused helper coverage in `packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `160 passed | 16 skipped` files; `2196 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `bdf3e5d` `refactor(st-09027): extract vendor initialization helpers`
  - `5d0aae0` `docs(st-09027): record validation and move story to in-review`
  - `ae10d2a` `chore(st-09027): finalize checklist and ready status`
  - `1a0fc22` `fix(st-09027): tighten vendor initialization review fixes`
  - `290bc4b` `chore(st-09027): append review-fix commit record`
  - `57bedb4` `fix(st-09027): tighten vendor helper type pairing`
  - `d6653a9` `chore(st-09027): append review-fix commit record`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #89 marked ready: https://github.com/TVScoundrel/agentforge/pull/89
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #89: https://github.com/TVScoundrel/agentforge/pull/89
  - Merge commit: `a995df3`

### Notes

- Created branch: `refactor/st-09027-connection-manager-vendor-initialization-extraction` (workspace branch: `codex/refactor/st-09027-connection-manager-vendor-initialization-extraction`)
- Draft PR: #89 `refactor(st-09027): extract connection manager vendor initialization adapters`
- Implementation commit: `bdf3e5d` `refactor(st-09027): extract vendor initialization helpers`
- Validation so far:
  - `pnpm exec tsc -p packages/tools/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/tools/src/data/relational/connection/connection-manager.ts packages/tools/src/data/relational/connection/vendor-initialization.ts packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
  - `pnpm test --run packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts` -> `2 passed` files, `49 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `180/289` warnings, `tools 65/67`
  - `pnpm test --run` -> `160 passed | 16 skipped` files; `2196 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only
- Review fix commit: `1a0fc22` `fix(st-09027): tighten vendor initialization review fixes`
- Review fix commit: `57bedb4` `fix(st-09027): tighten vendor helper type pairing`

---

## ST-09028: Modularize Connection Manager Lifecycle and Reconnection Control

**Branch:** `refactor/st-09028-connection-manager-lifecycle-modularization`

### Checklist
- [x] Create branch `refactor/st-09028-connection-manager-lifecycle-modularization`
  - Created as `codex/refactor/st-09028-connection-manager-lifecycle-modularization` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #90: https://github.com/TVScoundrel/agentforge/pull/90
- [x] Extract lifecycle and reconnection orchestration from `packages/tools/src/data/relational/connection/connection-manager.ts`
- [x] Preserve current connect/initialize/disconnect/close/reconnection behavior
- [x] Add/update focused tests for cancellation, reconnection scheduling, and lifecycle cleanup behavior
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09028-connection-manager-lifecycle-modularization.md` (`connection-manager.ts 2 -> 2`, workspace `180 -> 180`)
- [x] Add or update story documentation at `docs/st09028-connection-manager-lifecycle-modularization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused lifecycle regressions in `packages/tools/tests/data/relational/connection/connection-manager.test.ts` for disconnect-during-initialize cancellation and canceling a pending reconnection timer during close
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `160 passed | 16 skipped` files; `2198 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `7aff487` `refactor(st-09028): extract connection lifecycle helpers`
  - `a2b75fc` `docs(st-09028): track lifecycle modularization progress`
  - `41498e5` `fix(st-09028): address lifecycle review feedback`
  - `f2eb2ce` `chore(st-09028): record review-fix commit`
  - `82921ad` `fix(st-09028): tighten lifecycle helper contracts`
  - `3ddfd40` `chore(st-09028): append review-fix commit record`
  - `5943cf6` `fix(st-09028): clarify reconnection helper naming`
- [x] Mark PR Ready only after all story tasks are complete
  - PR #90 marked ready: https://github.com/TVScoundrel/agentforge/pull/90
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #90 on 2026-04-17 (merge commit `91f0e2f`)

### Notes

- Created branch: `refactor/st-09028-connection-manager-lifecycle-modularization` (workspace branch: `codex/refactor/st-09028-connection-manager-lifecycle-modularization`)
- Draft PR: #90 `refactor(st-09028): modularize connection manager lifecycle`
- Implementation commit: `7aff487` `refactor(st-09028): extract connection lifecycle helpers`
- Review-fix commit: `41498e5` `fix(st-09028): address lifecycle review feedback`
- Review-fix commit: `f2eb2ce` `chore(st-09028): record review-fix commit`
- Review-fix commit: `82921ad` `fix(st-09028): tighten lifecycle helper contracts`
- Review-fix commit: `3ddfd40` `chore(st-09028): append review-fix commit record`
- Review-fix commit: `5943cf6` `fix(st-09028): clarify reconnection helper naming`
- Validation:
  - `pnpm exec tsc -p packages/tools/tsconfig.json --noEmit`
  - `pnpm exec eslint packages/tools/src/data/relational/connection/connection-manager.ts packages/tools/src/data/relational/connection/lifecycle.ts packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts`
  - `pnpm test --run packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts` -> `2 passed` files, `51 passed` tests
  - `pnpm lint:explicit-any:baseline --silent` -> `180/289` warnings, `tools 65/67`
  - `pnpm test --run` -> `160 passed | 16 skipped` files; `2198 passed | 286 skipped` tests
  - `pnpm lint` -> exit `0`; warnings only
- Merged PR: #90
- Merge commit: `91f0e2f`

---

## ST-09029: Modularize Plan-Execute Node Responsibilities

**Branch:** `refactor/st-09029-plan-execute-node-modularization`

### Checklist
- [x] Create branch `refactor/st-09029-plan-execute-node-modularization`
  - Created as `codex/refactor/st-09029-plan-execute-node-modularization` (workspace branch-prefix policy)
- [x] Create draft PR with story ID in title
  - PR #92: https://github.com/TVScoundrel/agentforge/pull/92
- [x] Split `packages/patterns/src/plan-execute/nodes.ts` into planner, executor, replanner, and finisher modules or focused helpers
  - Extracted `planner-node.ts`, `executor-node.ts`, `replanner-node.ts`, `finisher-node.ts`, and `node-loggers.ts`
- [x] Preserve the public plan-execute node entrypoint and current runtime behavior
  - `packages/patterns/src/plan-execute/nodes.ts` remains the stable facade and re-exports the same node factories
- [x] Extract shared helpers where they reduce duplication without obscuring control flow
  - Shared logger setup now lives in `packages/patterns/src/plan-execute/node-loggers.ts`
- [x] Add/update focused tests for planning, execution, replanning, and node-level error handling
  - `pnpm test --run packages/patterns/tests/plan-execute/nodes.test.ts packages/patterns/tests/plan-execute/deduplication.test.ts packages/patterns/tests/plan-execute/agent.test.ts packages/patterns/tests/plan-execute/integration.test.ts packages/patterns/tests/plan-execute/state.test.ts` -> `5 passed` files, `55 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09029-plan-execute-node-modularization.md`; workspace baseline remains `180/289`, `patterns` remains `15/28`
- [x] Add or update story documentation at `docs/st09029-plan-execute-node-modularization.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused coverage for finisher aggregation and replanner invalid-JSON error handling in `packages/patterns/tests/plan-execute/nodes.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `160 passed | 16 skipped` files; `2200 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `9dfed82` refactor(st-09029): split plan-execute node responsibilities
  - `ab3bc40` docs(st-09029): record validation and move story to in-review
  - `5c1141f` chore(st-09029): finalize checklist and ready status
  - `f6033a4` fix(st-09029): harden plan-execute serialization paths
  - `dd45057` chore(st-09029): append review-fix commit record
  - `fde60a2` fix(st-09029): preserve finisher response compatibility
  - `a5cb14d` fix(st-09029): tighten replanner serialization fallbacks
  - `0b5a2da` fix(st-09029): support array-based model content
  - `940e48d` fix(st-09029): preserve undefined result omission
  - `ce3848b` docs(st-09029): clarify replanner prompt behavior
  - `c57ae5c` fix(st-09029): normalize undefined prompt serialization
  - `6c81788` fix(st-09029): rethrow executor graph interrupts
- [x] Mark PR Ready only after all story tasks are complete
  - PR #92 marked ready: https://github.com/TVScoundrel/agentforge/pull/92
- [x] Wait for merge; do not merge directly from local branch
  - Merged via PR #92 with merge commit `bc62b59`

---

## ST-09030: Extract Connection Manager Query Execution and Session Adapters

**Branch:** `refactor/st-09030-connection-manager-query-session-extraction`

### Checklist
- [x] Create branch `refactor/st-09030-connection-manager-query-session-extraction`
- [x] Create draft PR with story ID in title
  - Draft PR #93: https://github.com/TVScoundrel/agentforge/pull/93
- [x] Extract query execution and `executeInConnection(...)` vendor branches from `packages/tools/src/data/relational/connection/connection-manager.ts`
  - Extracted focused helpers into `query-execution.ts` and `session-adapters.ts` while keeping `ConnectionManager` as the public façade
- [x] Preserve current PostgreSQL/MySQL/SQLite result normalization and dedicated-session behavior
  - MySQL tuple unwrapping, SQLite `affectedRows` normalization, and dedicated PostgreSQL/MySQL session release behavior are preserved by focused helper coverage
- [x] Add/update focused tests for vendor-specific query execution and session handling
  - `pnpm test --run packages/tools/tests/data/relational/connection/query-session-extraction.test.ts packages/tools/tests/data/relational/connection/connection-manager.test.ts packages/tools/tests/data/relational/connection/vendor-initialization.test.ts` -> `3 passed` files, `57 passed` tests
- [x] Record explicit-`any` warning deltas for touched files in story docs
  - Recorded in `docs/st09030-connection-manager-query-session-extraction.md`; workspace baseline remains `180/289`, `tools` remains `65/67`
- [x] Add or update story documentation at `docs/st09030-connection-manager-query-session-extraction.md` (or document why not required)
- [x] Assess test impact; add/update automated tests when needed, or document why tests are not required
  - Added focused helper coverage in `packages/tools/tests/data/relational/connection/query-session-extraction.test.ts`
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `161 passed | 16 skipped` files; `2216 passed | 286 skipped` tests
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> exit `0`; warnings only
- [x] Commit completed checklist items as logical commits and push updates
  - `0eb485d` refactor(st-09030): extract query and session helpers
  - `097b0a9` docs(st-09030): record validation and move story to in-review
  - `3395cf4` chore(st-09030): finalize checklist and ready status
- [x] Mark PR Ready only after all story tasks are complete
  - PR #93 marked ready: https://github.com/TVScoundrel/agentforge/pull/93
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09031: Extract Tool Registry Registration and Mutation Paths

**Branch:** `refactor/st-09031-tool-registry-registration-mutation-extraction`

### Checklist
- [ ] Create branch `refactor/st-09031-tool-registry-registration-mutation-extraction`
- [ ] Create draft PR with story ID in title
- [ ] Extract registration, update, removal, and bulk-registration logic from `packages/core/src/tools/registry.ts`
- [ ] Preserve duplicate detection, name consistency checks, and emitted event behavior
- [ ] Add/update focused tests for registration conflicts, updates, removals, and bulk-registration edge cases
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09031-tool-registry-registration-mutation-extraction.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09032: Tighten Managed Tool Lifecycle Contracts

**Branch:** `fix/st-09032-managed-tool-lifecycle-contracts`

### Checklist
- [ ] Create branch `fix/st-09032-managed-tool-lifecycle-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad lifecycle generics and metadata boundaries in `packages/core/src/tools/lifecycle.ts` with safer contracts
- [ ] Preserve current managed-tool initialization, execution, cleanup, health-check, and LangChain interop behavior
- [ ] Add/update focused tests for lifecycle hooks, health checks, stats, and process-exit cleanup behavior as needed
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09032-managed-tool-lifecycle-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09033: Tighten Database Pool Adapter Contracts

**Branch:** `fix/st-09033-database-pool-adapter-contracts`

### Checklist
- [ ] Create branch `fix/st-09033-database-pool-adapter-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad query/parameter contracts in `packages/core/src/resources/database-pool.ts` with safer adapter types
- [ ] Preserve current acquire/release, query/execute delegation, and pool lifecycle behavior
- [ ] Add/update focused tests for pool acquisition, query/execute delegation, and health-check validation as needed
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09033-database-pool-adapter-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09034: Tighten Snapshot Testing Runner Contracts

**Branch:** `fix/st-09034-snapshot-testing-runner-contracts`

### Checklist
- [ ] Create branch `fix/st-09034-snapshot-testing-runner-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad state and normalizer boundaries in `packages/testing/src/runners/snapshot-testing.ts` with safer unknown-first contracts
- [ ] Preserve current snapshot normalization, comparison, diffing, and message snapshot behavior
- [ ] Add/update focused tests for snapshot creation, comparisons, diffs, and message snapshot helpers
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09034-snapshot-testing-runner-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09035: Tighten Agent Test Runner State Contracts

**Branch:** `fix/st-09035-agent-test-runner-state-contracts`

### Checklist
- [ ] Create branch `fix/st-09035-agent-test-runner-state-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad agent, input, state, and step contracts in `packages/testing/src/runners/agent-test-runner.ts` with safer interfaces or generics
- [ ] Preserve current timeout, validation, step-capture, and `runMany(...)` behavior
- [ ] Add/update focused tests for successful runs, timeout handling, validation failures, and multi-input execution
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09035-agent-test-runner-state-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
