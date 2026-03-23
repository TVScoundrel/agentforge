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
- [ ] Create branch `fix/st-09013-sequential-workflow-builder-typing`
- [ ] Create draft PR with story ID in title
- [ ] Remove avoidable `any` usage from `packages/core/src/langgraph/builders/sequential.ts` around schema, state, and edge wiring
- [ ] Preserve current sequential runtime behavior while deriving state/update typing from the supplied schema
- [ ] Add/update focused tests for start/intermediate/end edge wiring and schema-derived workflow typing behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09013-sequential-workflow-builder-typing.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09014: Tighten Plan-Execute Shared Type Boundaries

**Branch:** `fix/st-09014-plan-execute-shared-type-boundaries`

### Checklist
- [ ] Create branch `fix/st-09014-plan-execute-shared-type-boundaries`
- [ ] Create draft PR with story ID in title
- [ ] Remove broad tool/schema `any` boundaries from `packages/patterns/src/plan-execute/types.ts` and adjacent shared contracts as needed
- [ ] Preserve current planner/executor/replanner compatibility while tightening shared type inference
- [ ] Add/update focused tests for type-driven plan-execute configuration and execution flows
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09014-plan-execute-shared-type-boundaries.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09015: Modularize Multi-Agent Node Responsibilities

**Branch:** `refactor/st-09015-multi-agent-node-modularization`

### Checklist
- [ ] Create branch `refactor/st-09015-multi-agent-node-modularization`
- [ ] Create draft PR with story ID in title
- [ ] Split `packages/patterns/src/multi-agent/nodes.ts` into smaller modules or helper layers that mirror major node responsibilities
- [ ] Preserve the public multi-agent node entrypoint and current runtime behavior after the split
- [ ] Extract shared helpers where they reduce duplication without obscuring routing and handoff flow
- [ ] Add/update focused tests for coordinator routing, handoff behavior, and node-level error handling
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09015-multi-agent-node-modularization.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09016: Harden Monitoring Audit and Health Payload Types

**Branch:** `fix/st-09016-monitoring-payload-type-hardening`

### Checklist
- [ ] Create branch `fix/st-09016-monitoring-payload-type-hardening`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad payload `any` fields in `packages/core/src/monitoring/audit.ts` and `packages/core/src/monitoring/health.ts` with safer contracts
- [ ] Preserve current monitoring runtime behavior and public compatibility while tightening audit/health payload typing
- [ ] Add/update focused tests for audit event serialization and health metadata handling
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09016-monitoring-payload-type-hardening.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09017: Centralize CLI Command Error Handling

**Branch:** `refactor/st-09017-cli-error-handling-centralization`

### Checklist
- [ ] Create branch `refactor/st-09017-cli-error-handling-centralization`
- [ ] Create draft PR with story ID in title
- [ ] Consolidate repeated command-level error formatting and exit handling in `packages/cli/src/commands/**`
- [ ] Preserve current CLI user-visible behavior and exit codes while reducing repetitive `catch (error: any)` usage
- [ ] Add/update focused tests for shared command error handling where the existing CLI test surface supports it
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09017-cli-error-handling-centralization.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09018: Harden Testing Assertion and State Builder Helpers

**Branch:** `fix/st-09018-testing-helper-type-hardening`

### Checklist
- [ ] Create branch `fix/st-09018-testing-helper-type-hardening`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad `any`-based helper signatures in `packages/testing/src/helpers/assertions.ts` and `packages/testing/src/helpers/state-builder.ts` with safer generic or unknown-first contracts
- [ ] Preserve practical helper ergonomics for common agent/message/state test setup flows
- [ ] Add/update focused tests for touched helper behavior and contract expectations
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09018-testing-helper-type-hardening.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09019: Harden Reflection Agent Routing Typing

**Branch:** `fix/st-09019-reflection-agent-routing-typing`

### Checklist
- [ ] Create branch `fix/st-09019-reflection-agent-routing-typing`
- [ ] Create draft PR with story ID in title
- [ ] Remove avoidable route/compile `as any` usage from `packages/patterns/src/reflection/agent.ts`
- [ ] Preserve current reflection generator/reflector/reviser/completion routing behavior while tightening route typing
- [ ] Add/update focused tests for route decisions and compiled agent invocation behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09019-reflection-agent-routing-typing.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09020: Tighten Prompt Loader Variable Contracts

**Branch:** `fix/st-09020-prompt-loader-variable-contracts`

### Checklist
- [ ] Create branch `fix/st-09020-prompt-loader-variable-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad variable-map `any` usage in `packages/core/src/prompt-loader/index.ts` with safer contracts
- [ ] Preserve current sanitize/render/load behavior for trusted and untrusted variables
- [ ] Add/update focused tests for variable rendering, escaping, and fallback behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09020-prompt-loader-variable-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09021: Harden Streaming WebSocket and Message Contracts

**Branch:** `fix/st-09021-streaming-websocket-contracts`

### Checklist
- [ ] Create branch `fix/st-09021-streaming-websocket-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad socket/message/data `any` boundaries in `packages/core/src/streaming/websocket.ts` and adjacent streaming types
- [ ] Preserve current WebSocket handler, send, parse, and broadcast behavior
- [ ] Add/update focused tests for message parsing, error handling, and broadcast behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09021-streaming-websocket-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09022: Harden Shared Deduplication Utility Contracts

**Branch:** `fix/st-09022-shared-deduplication-contracts`

### Checklist
- [ ] Create branch `fix/st-09022-shared-deduplication-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad normalization and cache-key `any` boundaries in `packages/patterns/src/shared/deduplication.ts`
- [ ] Preserve current deduplication metrics, cache-key generation, and logging behavior
- [ ] Add/update focused tests for normalization, cache-key generation, and metrics helpers
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09022-shared-deduplication-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09023: Tighten Core Tool Builder Fluent Typing

**Branch:** `fix/st-09023-tool-builder-fluent-typing`

### Checklist
- [ ] Create branch `fix/st-09023-tool-builder-fluent-typing`
- [ ] Create draft PR with story ID in title
- [ ] Remove avoidable `(this as any)` seams from `packages/core/src/tools/builder.ts`
- [ ] Preserve current fluent builder ergonomics and built-tool behavior
- [ ] Add/update focused tests for schema/invoke chaining and built tool execution behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09023-tool-builder-fluent-typing.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09024: Tighten LangGraph Interrupt Type Contracts

**Branch:** `fix/st-09024-langgraph-interrupt-type-contracts`

### Checklist
- [ ] Create branch `fix/st-09024-langgraph-interrupt-type-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Replace broad payload boundaries in `packages/core/src/langgraph/interrupts/types.ts` with safer interrupt/resume contracts
- [ ] Preserve current human-request, approval, custom interrupt, and resume-command compatibility
- [ ] Add/update focused tests for touched interrupt type helpers or adjacent runtime consumers as needed
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09024-langgraph-interrupt-type-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09025: Extract Tool Registry Collection and Search Operations

**Branch:** `refactor/st-09025-tool-registry-collection-search-extraction`

### Checklist
- [ ] Create branch `refactor/st-09025-tool-registry-collection-search-extraction`
- [ ] Create draft PR with story ID in title
- [ ] Extract collection and search responsibilities from `packages/core/src/tools/registry.ts`
- [ ] Preserve current `getAll`, category/tag filter, and text-search behavior
- [ ] Add/update focused tests for extracted collection and search behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09025-tool-registry-collection-search-extraction.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09026: Modularize Tool Registry Prompt Rendering and Event Paths

**Branch:** `refactor/st-09026-tool-registry-prompt-event-modularization`

### Checklist
- [ ] Create branch `refactor/st-09026-tool-registry-prompt-event-modularization`
- [ ] Create draft PR with story ID in title
- [ ] Extract prompt-rendering and event-emission responsibilities from `packages/core/src/tools/registry.ts`
- [ ] Preserve current prompt-generation, LangChain conversion, and registry event behavior
- [ ] Add/update focused tests for prompt rendering and event behavior after the split
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09026-tool-registry-prompt-event-modularization.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09027: Extract Connection Manager Vendor Initialization Adapters

**Branch:** `refactor/st-09027-connection-manager-vendor-initialization-extraction`

### Checklist
- [ ] Create branch `refactor/st-09027-connection-manager-vendor-initialization-extraction`
- [ ] Create draft PR with story ID in title
- [ ] Extract PostgreSQL/MySQL/SQLite initialization and pool-configuration logic from `packages/tools/src/data/relational/connection/connection-manager.ts`
- [ ] Preserve current vendor initialization behavior and validation
- [ ] Add/update focused tests for vendor initialization and pool configuration behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09027-connection-manager-vendor-initialization-extraction.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09028: Modularize Connection Manager Lifecycle and Reconnection Control

**Branch:** `refactor/st-09028-connection-manager-lifecycle-modularization`

### Checklist
- [ ] Create branch `refactor/st-09028-connection-manager-lifecycle-modularization`
- [ ] Create draft PR with story ID in title
- [ ] Extract lifecycle and reconnection orchestration from `packages/tools/src/data/relational/connection/connection-manager.ts`
- [ ] Preserve current connect/initialize/disconnect/close/reconnection behavior
- [ ] Add/update focused tests for cancellation, reconnection scheduling, and lifecycle cleanup behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09028-connection-manager-lifecycle-modularization.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
