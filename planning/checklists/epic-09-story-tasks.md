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
- [x] Mark PR Ready only after all story tasks are complete
  - PR #66 marked ready: https://github.com/TVScoundrel/agentforge/pull/66
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09005: Harden Patterns ReAct Node and Shared Agent Builder Types

**Branch:** `fix/st-09005-patterns-react-builder-typing`

### Checklist
- [ ] Create branch `fix/st-09005-patterns-react-builder-typing`
- [ ] Create draft PR with story ID in title
- [ ] Reduce explicit `any` usage in `packages/patterns/src/react/nodes.ts` and `packages/patterns/src/shared/agent-builder.ts`
- [ ] Extract focused helper(s) for message normalization/state access where it improves SRP and readability
- [ ] Add/update focused tests for conditional routing and tool-message construction behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09005-patterns-react-builder-typing.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
